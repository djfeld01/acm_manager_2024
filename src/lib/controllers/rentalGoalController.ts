"use server";
import { db } from "@/db";
import {
  storageFacilities,
  monthlyGoals,
  tenantActivities,
  dailyManagementOccupancy,
} from "@/db/schema";
import { and, eq, gte, lt, sql, desc } from "drizzle-orm";
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

/** Format a Date as "Mon YYYY" for display */
function formatMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function getRentalOverviewData(
  targetMonth: string
): Promise<LocationOverview[]> {
  const targetDate = parseTargetMonth(targetMonth);
  const targetCalendarMonth = targetDate.getUTCMonth(); // 0-based

  // 12 months back from targetMonth
  const historyStart = new Date(targetDate);
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

  const results: LocationOverview[] = [];

  for (const facility of facilities) {
    // Get last 12 months of rentals (MoveIn) grouped by month
    const rentalsRows = await db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${tenantActivities.date}), 'YYYY-MM')`,
        rentals: sql<number>`COUNT(*)::int`,
      })
      .from(tenantActivities)
      .where(
        and(
          eq(tenantActivities.facilityId, facility.sitelinkId),
          eq(tenantActivities.activityType, "MoveIn"),
          gte(tenantActivities.date, historyStart),
          lt(tenantActivities.date, targetDate)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${tenantActivities.date})`)
      .orderBy(sql`DATE_TRUNC('month', ${tenantActivities.date}) DESC`);

    // Build sorted list most-recent first
    const rentalsByMonth = rentalsRows.map((r) => r.rentals);

    // Latest occupancy record
    const [latestOcc] = await db
      .select({
        unitOccupancy: dailyManagementOccupancy.unitOccupancy,
        vacantUnits: dailyManagementOccupancy.vacantUnits,
      })
      .from(dailyManagementOccupancy)
      .where(eq(dailyManagementOccupancy.facilityId, facility.sitelinkId))
      .orderBy(desc(dailyManagementOccupancy.date))
      .limit(1);

    // Prior year goal for the target month
    const priorYearMonthStr = priorYearDate.toISOString().split("T")[0];
    const [priorGoalRow] = await db
      .select({ rentalGoal: monthlyGoals.rentalGoal })
      .from(monthlyGoals)
      .where(
        and(
          eq(monthlyGoals.sitelinkId, facility.sitelinkId),
          sql`DATE_TRUNC('month', ${monthlyGoals.month}::date) = DATE_TRUNC('month', ${priorYearMonthStr}::date)`
        )
      )
      .limit(1);

    const wma = weightedMovingAverage(rentalsByMonth);
    // Build historicalByMonth for seasonal index from available data
    // Group the 12 months into their calendar months
    const byCalendarMonth: number[][] = Array.from({ length: 12 }, () => []);
    for (const row of rentalsRows) {
      const m = parseInt(row.month.split("-")[1], 10) - 1;
      byCalendarMonth[m].push(row.rentals);
    }
    const historicalByMonthTransposed: number[][] = byCalendarMonth.map(
      (vals) => vals
    );
    // seasonalIndex expects array of "years x 12" — adapt to flat approach
    // We pass a single "year" with per-month sums/avgs
    const perCalMonth = Array(12).fill(0);
    const perCalCount = Array(12).fill(0);
    for (const row of rentalsRows) {
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
    });

    const last3MonthAvg =
      rentalsByMonth.length > 0
        ? Math.round(
            rentalsByMonth.slice(0, 3).reduce((a, b) => a + b, 0) /
              Math.min(rentalsByMonth.length, 3)
          )
        : 0;

    results.push({
      sitelinkId: facility.sitelinkId,
      facilityName: facility.facilityName,
      facilityAbbreviation: facility.facilityAbbreviation,
      occupancyPct: latestOcc?.unitOccupancy ?? null,
      vacantUnits: vacantUnits,
      last3MonthAvg,
      statPrediction,
      priorYearGoal: priorGoalRow?.rentalGoal ?? null,
      trend: classifyTrend(rentalsByMonth),
    });
  }

  return results;
}

export async function getFacilityRentalDetail(
  sitelinkId: string,
  targetMonth: string
): Promise<FacilityDetail> {
  const targetDate = parseTargetMonth(targetMonth);
  const targetCalendarMonth = targetDate.getUTCMonth();

  const historyStart = new Date(targetDate);
  historyStart.setUTCFullYear(historyStart.getUTCFullYear() - 1);

  const [facility] = await db
    .select({
      facilityName: storageFacilities.facilityName,
    })
    .from(storageFacilities)
    .where(eq(storageFacilities.sitelinkId, sitelinkId))
    .limit(1);

  // 12 months of rentals
  const rentalsRows = await db
    .select({
      month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${tenantActivities.date}), 'YYYY-MM')`,
      rentals: sql<number>`COUNT(*)::int`,
    })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        eq(tenantActivities.activityType, "MoveIn"),
        gte(tenantActivities.date, historyStart),
        lt(tenantActivities.date, targetDate)
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
        sql`${monthlyGoals.month}::date < ${targetDate.toISOString().split("T")[0]}`
      )
    );

  const goalsByMonth: Record<string, number> = {};
  for (const g of goalsRows) {
    goalsByMonth[g.month] = g.rentalGoal;
  }

  const rentalsHistory: RentalsHistoryPoint[] = rentalsRows.map((r) => ({
    month: r.month,
    rentals: r.rentals,
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
        sql`${dailyManagementOccupancy.date}::date < ${targetDate.toISOString().split("T")[0]}`
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

  // Stats
  const rentalsByMonthDesc = [...rentalsRows]
    .reverse()
    .map((r) => r.rentals);

  const wma = weightedMovingAverage(rentalsByMonthDesc);

  const perCalMonth = Array(12).fill(0);
  const perCalCount = Array(12).fill(0);
  for (const row of rentalsRows) {
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
    .map((r) => `${r.month}: ${r.rentals} rentals${r.goal != null ? ` (goal: ${r.goal})` : ""}`)
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
