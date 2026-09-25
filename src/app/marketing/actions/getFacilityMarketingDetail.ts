"use server";
import { db } from "@/db";
import { storageFacilities, inquiry, dailyManagementOccupancy } from "@/db/schema";
import { and, eq, gte, inArray, sql, desc } from "drizzle-orm";
import {
  getRecentWeekLabels,
  computeStats,
  collapseStoragePugSources,
  type Stats,
} from "../_lib/weekBuckets";

export interface WeeklyFunnelPoint {
  weekStart: string;
  facilityInquiries: number;
  portfolioMeanInquiries: number;
  portfolioMedianInquiries: number;
  portfolioMinInquiries: number;
  portfolioMaxInquiries: number;
  facilityLeased: number;
  portfolioMeanLeased: number;
  portfolioMedianLeased: number;
  portfolioMinLeased: number;
  portfolioMaxLeased: number;
}

export interface SourceBreakdownRow {
  source: string;
  inquiries: number;
  leased: number;
  conversionRate: number;
  portfolioConversionRate: number | null;
}

export interface FunnelStage {
  placed: number;
  followedUp: number;
  leased: number;
  cancelled: number;
  followUpRate: number | null;
  leaseRate: number | null;
  /** cancelDate and leaseDate are mutually exclusive on `inquiry` — this is
   *  the share of PLACED inquiries that were abandoned before ever leasing,
   *  not a post-lease cancellation rate. */
  cancelRate: number | null;
}

export interface FacilityMarketingDetail {
  facilityName: string;
  weeklySeries: WeeklyFunnelPoint[];
  sourceBreakdown: SourceBreakdownRow[];
  funnel: {
    facility: FunnelStage;
    portfolio: { mean: FunnelStage; median: FunnelStage; min: FunnelStage; max: FunnelStage };
  };
  occupancy: { facilityPct: number | null; portfolio: Stats | null };
}

function buildFunnelStage(
  placed: number,
  followedUp: number,
  leased: number,
  cancelled: number
): FunnelStage {
  return {
    placed,
    followedUp,
    leased,
    cancelled,
    followUpRate: placed > 0 ? followedUp / placed : null,
    leaseRate: placed > 0 ? leased / placed : null,
    cancelRate: placed > 0 ? cancelled / placed : null,
  };
}

// The `source` column is blank for most phone/walk-in inquiries (it's only
// populated for tracked marketing channels like web/SpareFoot/etc.) — fall
// back to `inquiryType` (Phone, WalkIn, ...) instead of a meaningless
// "Unknown" bucket.
const SOURCE_LABEL = sql<string>`COALESCE(NULLIF(TRIM(${inquiry.source}), ''), NULLIF(TRIM(${inquiry.inquiryType}), ''), 'Unknown')`;

export async function getFacilityMarketingDetail(
  sitelinkId: string,
  weeksBack: number = 8
): Promise<FacilityMarketingDetail> {
  const [facility] = await db
    .select({ facilityName: storageFacilities.facilityName })
    .from(storageFacilities)
    .where(eq(storageFacilities.sitelinkId, sitelinkId))
    .limit(1);

  const activeFacilities = await db
    .select({ sitelinkId: storageFacilities.sitelinkId })
    .from(storageFacilities)
    .where(
      and(
        eq(storageFacilities.currentClient, true),
        eq(storageFacilities.isCorporate, false)
      )
    );
  const facilityIds = activeFacilities.map((f) => f.sitelinkId);

  const weekLabels = await getRecentWeekLabels(weeksBack);
  const chronological = [...weekLabels].reverse();
  const windowStart = sql`DATE_TRUNC('week', NOW()) - (${weeksBack}::int * INTERVAL '1 week')`;

  // Cohort-based: every count below is keyed by the week the inquiry was
  // PLACED, regardless of when the follow-up/lease/cancel actually happened.
  // This means the most recent 1-2 weeks will understate eventual conversion,
  // since some of those leads simply haven't had time to convert yet.
  const facilityWeekly = await db
    .select({
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${inquiry.datePlaced}), 'YYYY-MM-DD')`,
      placed: sql<number>`COUNT(*)::int`,
      followedUp: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.firstFollowUpDate} IS NOT NULL)::int`,
      leased: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.leaseDate} IS NOT NULL)::int`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.cancelDate} IS NOT NULL)::int`,
    })
    .from(inquiry)
    .where(and(eq(inquiry.sitelinkId, sitelinkId), gte(inquiry.datePlaced, windowStart)))
    .groupBy(sql`DATE_TRUNC('week', ${inquiry.datePlaced})`);

  // Same shape, but per-facility (not summed), so we can compute mean/median/
  // min/max ACROSS facilities for a given week instead of just a raw average.
  const portfolioWeeklyByFacility = await db
    .select({
      sitelinkId: inquiry.sitelinkId,
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', ${inquiry.datePlaced}), 'YYYY-MM-DD')`,
      placed: sql<number>`COUNT(*)::int`,
      leased: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.leaseDate} IS NOT NULL)::int`,
    })
    .from(inquiry)
    .where(
      and(inArray(inquiry.sitelinkId, facilityIds), gte(inquiry.datePlaced, windowStart))
    )
    .groupBy(inquiry.sitelinkId, sql`DATE_TRUNC('week', ${inquiry.datePlaced})`);

  const facilityByWeek = new Map(facilityWeekly.map((r) => [r.week, r]));

  const portfolioByFacilityThenWeek = new Map<string, Map<string, { placed: number; leased: number }>>();
  for (const row of portfolioWeeklyByFacility) {
    if (!row.sitelinkId) continue;
    if (!portfolioByFacilityThenWeek.has(row.sitelinkId)) {
      portfolioByFacilityThenWeek.set(row.sitelinkId, new Map());
    }
    portfolioByFacilityThenWeek.get(row.sitelinkId)!.set(row.week, row);
  }

  const weeklySeries: WeeklyFunnelPoint[] = chronological.map((week) => {
    const f = facilityByWeek.get(week);
    const placedAcrossFacilities = facilityIds.map(
      (id) => portfolioByFacilityThenWeek.get(id)?.get(week)?.placed ?? 0
    );
    const leasedAcrossFacilities = facilityIds.map(
      (id) => portfolioByFacilityThenWeek.get(id)?.get(week)?.leased ?? 0
    );
    const placedStats = computeStats(placedAcrossFacilities);
    const leasedStats = computeStats(leasedAcrossFacilities);
    return {
      weekStart: week,
      facilityInquiries: f?.placed ?? 0,
      portfolioMeanInquiries: placedStats.mean,
      portfolioMedianInquiries: placedStats.median,
      portfolioMinInquiries: placedStats.min,
      portfolioMaxInquiries: placedStats.max,
      facilityLeased: f?.leased ?? 0,
      portfolioMeanLeased: leasedStats.mean,
      portfolioMedianLeased: leasedStats.median,
      portfolioMinLeased: leasedStats.min,
      portfolioMaxLeased: leasedStats.max,
    };
  });

  const facilityTotals = facilityWeekly.reduce(
    (acc, r) => ({
      placed: acc.placed + r.placed,
      followedUp: acc.followedUp + r.followedUp,
      leased: acc.leased + r.leased,
      cancelled: acc.cancelled + r.cancelled,
    }),
    { placed: 0, followedUp: 0, leased: 0, cancelled: 0 }
  );

  // Per-facility totals over the whole window, for the funnel's mean/median/
  // min/max comparison (a facility-level distribution, not a weekly one).
  const portfolioFacilityTotals = await db
    .select({
      sitelinkId: inquiry.sitelinkId,
      placed: sql<number>`COUNT(*)::int`,
      followedUp: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.firstFollowUpDate} IS NOT NULL)::int`,
      leased: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.leaseDate} IS NOT NULL)::int`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.cancelDate} IS NOT NULL)::int`,
    })
    .from(inquiry)
    .where(
      and(inArray(inquiry.sitelinkId, facilityIds), gte(inquiry.datePlaced, windowStart))
    )
    .groupBy(inquiry.sitelinkId);

  const totalsByFacility = new Map(portfolioFacilityTotals.map((r) => [r.sitelinkId, r]));
  const placedStats = computeStats(facilityIds.map((id) => totalsByFacility.get(id)?.placed ?? 0));
  const followedUpStats = computeStats(
    facilityIds.map((id) => totalsByFacility.get(id)?.followedUp ?? 0)
  );
  const leasedStats = computeStats(facilityIds.map((id) => totalsByFacility.get(id)?.leased ?? 0));
  const cancelledStats = computeStats(
    facilityIds.map((id) => totalsByFacility.get(id)?.cancelled ?? 0)
  );

  const funnel = {
    facility: buildFunnelStage(
      facilityTotals.placed,
      facilityTotals.followedUp,
      facilityTotals.leased,
      facilityTotals.cancelled
    ),
    portfolio: {
      mean: buildFunnelStage(
        placedStats.mean,
        followedUpStats.mean,
        leasedStats.mean,
        cancelledStats.mean
      ),
      median: buildFunnelStage(
        placedStats.median,
        followedUpStats.median,
        leasedStats.median,
        cancelledStats.median
      ),
      min: buildFunnelStage(placedStats.min, followedUpStats.min, leasedStats.min, cancelledStats.min),
      max: buildFunnelStage(placedStats.max, followedUpStats.max, leasedStats.max, cancelledStats.max),
    },
  };

  const sourceRows = await db
    .select({
      source: SOURCE_LABEL,
      inquiries: sql<number>`COUNT(*)::int`,
      leased: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.leaseDate} IS NOT NULL)::int`,
    })
    .from(inquiry)
    .where(and(eq(inquiry.sitelinkId, sitelinkId), gte(inquiry.datePlaced, windowStart)))
    .groupBy(SOURCE_LABEL)
    .orderBy(desc(sql`COUNT(*)`));

  const portfolioSourceRows = await db
    .select({
      source: SOURCE_LABEL,
      inquiries: sql<number>`COUNT(*)::int`,
      leased: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.leaseDate} IS NOT NULL)::int`,
    })
    .from(inquiry)
    .where(
      and(inArray(inquiry.sitelinkId, facilityIds), gte(inquiry.datePlaced, windowStart))
    )
    .groupBy(SOURCE_LABEL);

  const groupedSourceRows = collapseStoragePugSources(sourceRows);
  const groupedPortfolioSourceRows = collapseStoragePugSources(portfolioSourceRows);

  const portfolioRateBySource = new Map(
    groupedPortfolioSourceRows.map((r) => [
      r.source,
      r.inquiries > 0 ? r.leased / r.inquiries : null,
    ])
  );

  const sourceBreakdown: SourceBreakdownRow[] = groupedSourceRows.map((r) => ({
    source: r.source,
    inquiries: r.inquiries,
    leased: r.leased,
    conversionRate: r.inquiries > 0 ? r.leased / r.inquiries : 0,
    portfolioConversionRate: portfolioRateBySource.get(r.source) ?? null,
  }));

  // Current occupancy: facility vs. portfolio, to rule out "we're just out
  // of vacant units" as the explanation for low rentals.
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
    )
    .where(inArray(dailyManagementOccupancy.facilityId, facilityIds));

  const facilityOcc = occRows.find((r) => r.facilityId === sitelinkId)?.unitOccupancy ?? null;
  const validOccValues = occRows
    .map((r) => r.unitOccupancy)
    .filter((v): v is number => v != null);
  const occupancyStats = validOccValues.length > 0 ? computeStats(validOccValues) : null;

  return {
    facilityName: facility?.facilityName ?? sitelinkId,
    weeklySeries,
    sourceBreakdown,
    funnel,
    occupancy: { facilityPct: facilityOcc, portfolio: occupancyStats },
  };
}
