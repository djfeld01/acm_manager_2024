"use server";
import { db } from "@/db";
import {
  storageFacilities,
  monthlyGoals,
  tenantActivities,
  dailyManagementOccupancy,
} from "@/db/schema";
import { and, eq, gte, lt, sql, desc, inArray } from "drizzle-orm";
import {
  weightedMovingAverage,
  seasonalIndex,
  predictRentals,
  classifyTrend,
} from "@/lib/utils/rentalGoalStats";

export interface LocationOverview {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  occupancyPct: number | null;
  vacantUnits: number | null;
  last3MonthAvg: number;
  statPrediction: number;
  priorYearGoal: number | null;
  trend: "up" | "down" | "stable";
}

export interface RentalsHistoryPoint {
  month: string;
  rentals: number;
  moveOuts: number;
  goal: number | null;
}

export interface OccupancyHistoryPoint {
  month: string;
  occupancyPct: number | null;
}

export interface FacilityDetail {
  facilityName: string;
  rentalsHistory: RentalsHistoryPoint[];
  occupancyHistory: OccupancyHistoryPoint[];
  statPrediction: number;
  vacantUnits: number | null;
  trend: "up" | "down" | "stable";
}

export interface AIAnalysisInput {
  facilityName: string;
  targetMonth: string;
  rentalsHistory: RentalsHistoryPoint[];
  statPrediction: number;
  vacantUnits: number | null;
  occupancyPct: number | null;
  trend: "up" | "down" | "stable";
}

/** Parse "YYYY-MM" into a Date at the start of that month (UTC) */
function parseTargetMonth(targetMonth: string): Date {
  const [year, month] = targetMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Start of the current month (UTC) — used to exclude in-progress months from history */
function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Upper bound for history queries: earlier of targetDate or current month start,
 *  so a partially-complete current month never skews the WMA. */
function historyEnd(targetDate: Date): Date {
  const current = startOfCurrentMonth();
  return targetDate < current ? targetDate : current;
}


export async function getRentalOverviewData(
  targetMonth: string
): Promise<LocationOverview[]> {
  const targetDate = parseTargetMonth(targetMonth);
  const targetCalendarMonth = targetDate.getUTCMonth(); // 0-based

  // Cap history at start of current month so a partially-complete month isn't included
  const historyEndDate = historyEnd(targetDate);

  // 12 months back from the history end
  const historyStart = new Date(historyEndDate);
  historyStart.setUTCFullYear(historyStart.getUTCFullYear() - 1);

  // Prior year: same month last year
  const priorYearDate = new Date(targetDate);
  priorYearDate.setUTCFullYear(priorYearDate.getUTCFullYear() - 1);

  // Get active non-corporate facilities
  const facilities = await db
    .select({
      sitelinkId: storageFacilities.sitelinkId,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
    })
    .from(storageFacilities)
    .where(
      and(
        eq(storageFacilities.currentClient, true),
        eq(storageFacilities.isCorporate, false)
      )
    )
    .orderBy(storageFacilities.facilityName);

  if (facilities.length === 0) return [];

  const facilityIds = facilities.map((f) => f.sitelinkId);
  const priorYearMonthStr = priorYearDate.toISOString().split("T")[0];

  // --- 3 bulk queries instead of 3N sequential queries ---

  // 1. All move-ins + move-outs for all facilities over the history window
  const allActivityRows = await db
    .select({
      facilityId: tenantActivities.facilityId,
      month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${tenantActivities.date}), 'YYYY-MM')`,
      rentals: sql<number>`COUNT(*) FILTER (WHERE ${tenantActivities.activityType} = 'MoveIn')::int`,
      moveOuts: sql<number>`COUNT(*) FILTER (WHERE ${tenantActivities.activityType} = 'MoveOut')::int`,
    })
    .from(tenantActivities)
    .where(
      and(
        inArray(tenantActivities.facilityId, facilityIds),
        sql`${tenantActivities.activityType} IN ('MoveIn', 'MoveOut')`,
        gte(tenantActivities.date, historyStart),
        lt(tenantActivities.date, historyEndDate)
      )
    )
    .groupBy(tenantActivities.facilityId, sql`DATE_TRUNC('month', ${tenantActivities.date})`)
    .orderBy(tenantActivities.facilityId, sql`DATE_TRUNC('month', ${tenantActivities.date}) DESC`);

  // 2. Latest occupancy per facility via subquery join (DISTINCT ON equivalent)
  const latestDateSubq = db
    .select({
      facilityId: dailyManagementOccupancy.facilityId,
      maxDate: sql<string>`MAX(${dailyManagementOccupancy.date})`.as("max_date"),
    })
    .from(dailyManagementOccupancy)
    .groupBy(dailyManagementOccupancy.facilityId)
    .as("latest_occ");

  const allOccRows = await db
    .select({
      facilityId: dailyManagementOccupancy.facilityId,
      unitOccupancy: dailyManagementOccupancy.unitOccupancy,
      vacantUnits: dailyManagementOccupancy.vacantUnits,
    })
    .from(dailyManagementOccupancy)
    .innerJoin(
      latestDateSubq,
      and(
        eq(dailyManagementOccupancy.facilityId, latestDateSubq.facilityId),
        eq(dailyManagementOccupancy.date, latestDateSubq.maxDate)
      )
    );

  // 3. Prior-year rental goals for all facilities
  const allPriorGoals = await db
    .select({
      sitelinkId: monthlyGoals.sitelinkId,
      rentalGoal: monthlyGoals.rentalGoal,
    })
    .from(monthlyGoals)
    .where(
      and(
        inArray(monthlyGoals.sitelinkId, facilityIds),
        sql`DATE_TRUNC('month', ${monthlyGoals.month}::date) = DATE_TRUNC('month', ${priorYearMonthStr}::date)`
      )
    );

  // Build lookup maps for O(1) access
  const activityByFacility = new Map<
    string,
    { month: string; rentals: number; moveOuts: number }[]
  >();
  for (const row of allActivityRows) {
    if (!activityByFacility.has(row.facilityId)) {
      activityByFacility.set(row.facilityId, []);
    }
    activityByFacility.get(row.facilityId)!.push(row);
  }

  const occByFacility = new Map(
    allOccRows.map((r) => [r.facilityId, r])
  );

  const priorGoalByFacility = new Map(
    allPriorGoals.map((r) => [r.sitelinkId, r.rentalGoal])
  );

  // Compute per-facility predictions in JS (no more DB calls)
  return facilities.map((facility) => {
    const rows = activityByFacility.get(facility.sitelinkId) ?? [];
    // rows are DESC (most-recent first) from the ORDER BY above
    const rentalsByMonth = rows.map((r) => r.rentals);
    const moveOutsByMonth = rows.map((r) => r.moveOuts);

    const wma = weightedMovingAverage(rentalsByMonth);
    const moveOutWma = weightedMovingAverage(moveOutsByMonth);

    const perCalMonth = Array(12).fill(0);
    const perCalCount = Array(12).fill(0);
    for (const row of rows) {
      const m = parseInt(row.month.split("-")[1], 10) - 1;
      perCalMonth[m] += row.rentals;
      perCalCount[m] += 1;
    }
    const singleYearAvg = perCalMonth.map((sum, i) =>
      perCalCount[i] > 0 ? sum / perCalCount[i] : 0
    );
    const idxArr = seasonalIndex([singleYearAvg]);
    const sIdx = idxArr[targetCalendarMonth] ?? 1;

    const occ = occByFacility.get(facility.sitelinkId);
    const vacantUnits = occ?.vacantUnits ?? null;

    const statPrediction = predictRentals({
      wma,
      seasonalIdx: sIdx,
      vacantUnits: vacantUnits ?? Infinity,
      predictedMoveOuts: moveOutWma,
    });

    const last3MonthAvg =
      rentalsByMonth.length > 0
        ? Math.round(
            rentalsByMonth.slice(0, 3).reduce((a, b) => a + b, 0) /
              Math.min(rentalsByMonth.length, 3)
          )
        : 0;

    return {
      sitelinkId: facility.sitelinkId,
      facilityName: facility.facilityName,
      facilityAbbreviation: facility.facilityAbbreviation,
      occupancyPct: occ?.unitOccupancy ?? null,
      vacantUnits,
      last3MonthAvg,
      statPrediction,
      priorYearGoal: priorGoalByFacility.get(facility.sitelinkId) ?? null,
      trend: classifyTrend(rentalsByMonth),
    };
  });
}

export async function getFacilityRentalDetail(
  sitelinkId: string,
  targetMonth: string
): Promise<FacilityDetail> {
  const targetDate = parseTargetMonth(targetMonth);
  const targetCalendarMonth = targetDate.getUTCMonth();

  // Cap history at start of current month so a partially-complete month isn't included
  const historyEndDate = historyEnd(targetDate);

  const historyStart = new Date(historyEndDate);
  historyStart.setUTCFullYear(historyStart.getUTCFullYear() - 1);

  const [facility] = await db
    .select({
      facilityName: storageFacilities.facilityName,
    })
    .from(storageFacilities)
    .where(eq(storageFacilities.sitelinkId, sitelinkId))
    .limit(1);

  // 12 months of move-ins and move-outs
  const activityRows = await db
    .select({
      month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${tenantActivities.date}), 'YYYY-MM')`,
      rentals: sql<number>`COUNT(*) FILTER (WHERE ${tenantActivities.activityType} = 'MoveIn')::int`,
      moveOuts: sql<number>`COUNT(*) FILTER (WHERE ${tenantActivities.activityType} = 'MoveOut')::int`,
    })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        sql`${tenantActivities.activityType} IN ('MoveIn', 'MoveOut')`,
        gte(tenantActivities.date, historyStart),
        lt(tenantActivities.date, historyEndDate)
      )
    )
    .groupBy(sql`DATE_TRUNC('month', ${tenantActivities.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${tenantActivities.date}) ASC`);

  // Goals for those months
  const goalsRows = await db
    .select({
      month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${monthlyGoals.month}::date), 'YYYY-MM')`,
      rentalGoal: monthlyGoals.rentalGoal,
    })
    .from(monthlyGoals)
    .where(
      and(
        eq(monthlyGoals.sitelinkId, sitelinkId),
        sql`${monthlyGoals.month}::date >= ${historyStart.toISOString().split("T")[0]}`,
        sql`${monthlyGoals.month}::date < ${historyEndDate.toISOString().split("T")[0]}`
      )
    );

  const goalsByMonth: Record<string, number> = {};
  for (const g of goalsRows) {
    goalsByMonth[g.month] = g.rentalGoal;
  }

  const rentalsHistory: RentalsHistoryPoint[] = activityRows.map((r) => ({
    month: r.month,
    rentals: r.rentals,
    moveOuts: r.moveOuts,
    goal: goalsByMonth[r.month] ?? null,
  }));

  // Occupancy history (one record per month — use last day of each month)
  const occupancyRows = await db
    .select({
      month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${dailyManagementOccupancy.date}::date), 'YYYY-MM')`,
      occupancyPct: sql<number>`AVG(${dailyManagementOccupancy.unitOccupancy})`,
    })
    .from(dailyManagementOccupancy)
    .where(
      and(
        eq(dailyManagementOccupancy.facilityId, sitelinkId),
        sql`${dailyManagementOccupancy.date}::date >= ${historyStart.toISOString().split("T")[0]}`,
        sql`${dailyManagementOccupancy.date}::date < ${historyEndDate.toISOString().split("T")[0]}`
      )
    )
    .groupBy(sql`DATE_TRUNC('month', ${dailyManagementOccupancy.date}::date)`)
    .orderBy(sql`DATE_TRUNC('month', ${dailyManagementOccupancy.date}::date) ASC`);

  const occupancyHistory: OccupancyHistoryPoint[] = occupancyRows.map((r) => ({
    month: r.month,
    occupancyPct: r.occupancyPct !== null ? Math.round(r.occupancyPct * 100) : null,
  }));

  // Latest occupancy for current vacant units
  const [latestOcc] = await db
    .select({
      unitOccupancy: dailyManagementOccupancy.unitOccupancy,
      vacantUnits: dailyManagementOccupancy.vacantUnits,
    })
    .from(dailyManagementOccupancy)
    .where(eq(dailyManagementOccupancy.facilityId, sitelinkId))
    .orderBy(desc(dailyManagementOccupancy.date))
    .limit(1);

  // Stats (activityRows is ASC; reverse for WMA which expects most-recent first)
  const rentalsByMonthDesc = [...activityRows].reverse().map((r) => r.rentals);
  const moveOutsByMonthDesc = [...activityRows].reverse().map((r) => r.moveOuts);

  const wma = weightedMovingAverage(rentalsByMonthDesc);
  const moveOutWma = weightedMovingAverage(moveOutsByMonthDesc);

  const perCalMonth = Array(12).fill(0);
  const perCalCount = Array(12).fill(0);
  for (const row of activityRows) {
    const m = parseInt(row.month.split("-")[1], 10) - 1;
    perCalMonth[m] += row.rentals;
    perCalCount[m] += 1;
  }
  const singleYearAvg = perCalMonth.map((sum, i) =>
    perCalCount[i] > 0 ? sum / perCalCount[i] : 0
  );
  const idxArr = seasonalIndex([singleYearAvg]);
  const sIdx = idxArr[targetCalendarMonth] ?? 1;

  const vacantUnits = latestOcc?.vacantUnits ?? null;
  const statPrediction = predictRentals({
    wma,
    seasonalIdx: sIdx,
    vacantUnits: vacantUnits ?? Infinity,
    predictedMoveOuts: moveOutWma,
  });

  return {
    facilityName: facility?.facilityName ?? sitelinkId,
    rentalsHistory,
    occupancyHistory,
    statPrediction,
    vacantUnits,
    trend: classifyTrend(rentalsByMonthDesc),
  };
}

export async function generateAIAnalysis(
  input: AIAnalysisInput
): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const recentHistory = input.rentalsHistory.slice(-6);
  const historyText = recentHistory
    .map(
      (r) =>
        `${r.month}: ${r.rentals} move-ins, ${r.moveOuts} move-outs${r.goal != null ? ` (goal: ${r.goal})` : ""}`
    )
    .join("\n");

  const prompt = `You are a storage facility analyst. Analyze the rental performance for ${input.facilityName} and provide a brief, practical recommendation.

Target month: ${input.targetMonth}
Recent rental history (last 6 months):
${historyText}

Current metrics:
- Occupancy rate: ${input.occupancyPct != null ? `${Math.round(input.occupancyPct * 100)}%` : "N/A"}
- Vacant units: ${input.vacantUnits ?? "N/A"}
- Trend: ${input.trend}
- Statistical model prediction: ${input.statPrediction} rentals

Please provide:
1. A brief analysis of recent rental trends (2-3 sentences)
2. Key factors that may influence rentals in ${input.targetMonth} (seasonal patterns, occupancy level)
3. A recommended rental goal range for ${input.targetMonth}

Keep your response concise and actionable (under 200 words).`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "No analysis available.";
}
