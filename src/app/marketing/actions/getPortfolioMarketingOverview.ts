"use server";
import { db } from "@/db";
import { storageFacilities, inquiry, dailyManagementOccupancy } from "@/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getRecentWeekLabels, classifyTrend } from "../_lib/weekBuckets";

export interface PortfolioMarketingRow {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  thisWeekInquiries: number;
  trailingAvgInquiries: number;
  inquiryTrend: "up" | "down" | "stable";
  thisWeekConversionRate: number | null;
  trailingAvgConversionRate: number | null;
  currentOccupancyPct: number | null;
}

const TRAILING_WEEKS = 4;

export async function getPortfolioMarketingOverview(
  weeksBack: number = 8
): Promise<PortfolioMarketingRow[]> {
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

  // Weeks are labeled by Postgres, not JS Date, so they line up exactly with
  // the same TO_CHAR(DATE_TRUNC('week', ...)) expressions below regardless of
  // the app server's local timezone.
  const weekLabels = await getRecentWeekLabels(weeksBack);
  const [thisWeek, ...rest] = weekLabels;
  const trailingWeeks = rest.slice(0, TRAILING_WEEKS);
  const windowStart = sql`DATE_TRUNC('week', NOW()) - (${weeksBack}::int * INTERVAL '1 week')`;

  const placedRows = await db
    .select({
      sitelinkId: inquiry.sitelinkId,
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${inquiry.datePlaced}), 'YYYY-MM-DD')`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(inquiry)
    .where(
      and(
        inArray(inquiry.sitelinkId, facilityIds),
        gte(inquiry.datePlaced, windowStart)
      )
    )
    .groupBy(inquiry.sitelinkId, sql`DATE_TRUNC('week', ${inquiry.datePlaced})`);

  // Leases signed that week (period-level, i.e. by the lease's own date — not
  // attributed back to the inquiry's placement week). Good enough for the
  // overview's "is conversion moving" signal; the facility drill-down uses a
  // cohort-based conversion instead.
  const leasedRows = await db
    .select({
      sitelinkId: inquiry.sitelinkId,
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${inquiry.leaseDate}), 'YYYY-MM-DD')`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(inquiry)
    .where(
      and(
        inArray(inquiry.sitelinkId, facilityIds),
        gte(inquiry.leaseDate, windowStart)
      )
    )
    .groupBy(inquiry.sitelinkId, sql`DATE_TRUNC('week', ${inquiry.leaseDate})`);

  const latestDateSubq = db
    .select({
      facilityId: dailyManagementOccupancy.facilityId,
      maxDate: sql<string>`MAX(${dailyManagementOccupancy.date})`.as("max_date"),
    })
    .from(dailyManagementOccupancy)
    .groupBy(dailyManagementOccupancy.facilityId)
    .as("latest_occ");

  const occRows = await db
    .select({
      facilityId: dailyManagementOccupancy.facilityId,
      unitOccupancy: dailyManagementOccupancy.unitOccupancy,
    })
    .from(dailyManagementOccupancy)
    .innerJoin(
      latestDateSubq,
      and(
        eq(dailyManagementOccupancy.facilityId, latestDateSubq.facilityId),
        eq(dailyManagementOccupancy.date, latestDateSubq.maxDate)
      )
    );

  const placedByFacility = new Map<string, Map<string, number>>();
  for (const row of placedRows) {
    if (!row.sitelinkId) continue;
    if (!placedByFacility.has(row.sitelinkId)) {
      placedByFacility.set(row.sitelinkId, new Map());
    }
    placedByFacility.get(row.sitelinkId)!.set(row.week, row.count);
  }

  const leasedByFacility = new Map<string, Map<string, number>>();
  for (const row of leasedRows) {
    if (!row.sitelinkId) continue;
    if (!leasedByFacility.has(row.sitelinkId)) {
      leasedByFacility.set(row.sitelinkId, new Map());
    }
    leasedByFacility.get(row.sitelinkId)!.set(row.week, row.count);
  }

  const occByFacility = new Map(occRows.map((r) => [r.facilityId, r.unitOccupancy]));

  return facilities.map((facility) => {
    const placedMap = placedByFacility.get(facility.sitelinkId) ?? new Map();
    const leasedMap = leasedByFacility.get(facility.sitelinkId) ?? new Map();

    const thisWeekInquiries = placedMap.get(thisWeek) ?? 0;
    const thisWeekLeased = leasedMap.get(thisWeek) ?? 0;

    const trailingInquiries = trailingWeeks.map((w) => placedMap.get(w) ?? 0);
    const trailingLeased = trailingWeeks.map((w) => leasedMap.get(w) ?? 0);
    const trailingInquiriesSum = trailingInquiries.reduce((a, b) => a + b, 0);
    const trailingLeasedSum = trailingLeased.reduce((a, b) => a + b, 0);
    const trailingAvgInquiries =
      trailingWeeks.length > 0 ? trailingInquiriesSum / trailingWeeks.length : 0;

    return {
      sitelinkId: facility.sitelinkId,
      facilityName: facility.facilityName,
      facilityAbbreviation: facility.facilityAbbreviation,
      thisWeekInquiries,
      trailingAvgInquiries: Math.round(trailingAvgInquiries * 10) / 10,
      inquiryTrend: classifyTrend(thisWeekInquiries, trailingAvgInquiries),
      thisWeekConversionRate:
        thisWeekInquiries > 0 ? thisWeekLeased / thisWeekInquiries : null,
      trailingAvgConversionRate:
        trailingInquiriesSum > 0 ? trailingLeasedSum / trailingInquiriesSum : null,
      currentOccupancyPct: occByFacility.get(facility.sitelinkId) ?? null,
    };
  });
}
