"use server";
import { db } from "@/db";
import { inquiry } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { normalizeSourceGroup } from "../_lib/weekBuckets";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface MonthlySeasonalityPoint {
  month: string;
  [year: string]: string | number;
}

export interface FacilityMonthlySeasonality {
  years: string[];
  sources: string[];
  inquiriesBySource: Record<string, MonthlySeasonalityPoint[]>;
  leasedBySource: Record<string, MonthlySeasonalityPoint[]>;
  /** The current calendar month is compared month-to-date across every year
   *  (all years capped at this day-of-month) so an in-progress month isn't
   *  compared unfairly against prior full months. */
  asOfDay: number;
  currentMonthLabel: string;
}

// Same fallback as getFacilityMarketingDetail: phone/walk-in inquiries
// usually have no `source`, so fall back to `inquiryType`.
const SOURCE_LABEL = sql<string>`COALESCE(NULLIF(TRIM(${inquiry.source}), ''), NULLIF(TRIM(${inquiry.inquiryType}), ''), 'Unknown')`;

export async function getFacilityMonthlySeasonality(
  sitelinkId: string,
  yearsBack: number = 4
): Promise<FacilityMonthlySeasonality> {
  const windowStart = sql`DATE_TRUNC('year', NOW()) - (${yearsBack - 1}::int * INTERVAL '1 year')`;

  const rows = await db
    .select({
      year: sql<number>`EXTRACT(YEAR FROM ${inquiry.datePlaced})::int`,
      monthNum: sql<number>`EXTRACT(MONTH FROM ${inquiry.datePlaced})::int`,
      source: SOURCE_LABEL,
      placed: sql<number>`COUNT(*)::int`,
      leased: sql<number>`COUNT(*) FILTER (WHERE ${inquiry.leaseDate} IS NOT NULL)::int`,
    })
    .from(inquiry)
    .where(
      and(
        eq(inquiry.sitelinkId, sitelinkId),
        gte(inquiry.datePlaced, windowStart),
        // Cap every year's data for the CURRENT calendar month at today's
        // day-of-month, so an in-progress month is compared fairly
        // (month-to-date) against prior years' same month instead of
        // looking artificially slow next to their full-month totals.
        sql`NOT (
          EXTRACT(MONTH FROM ${inquiry.datePlaced}) = EXTRACT(MONTH FROM NOW())
          AND EXTRACT(DAY FROM ${inquiry.datePlaced}) > EXTRACT(DAY FROM NOW())
        )`
      )
    )
    .groupBy(
      sql`EXTRACT(YEAR FROM ${inquiry.datePlaced})`,
      sql`EXTRACT(MONTH FROM ${inquiry.datePlaced})`,
      SOURCE_LABEL
    );

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: yearsBack }, (_, i) =>
    String(currentYear - yearsBack + 1 + i)
  );
  // StoragePug's many sub-sources (google/cpc, google/organic, Rental vs.
  // Reservation vs. Request a Quote, ...) are lumped into one "StoragePug"
  // group so its aggregate performance is easy to pull up on its own.
  const sources = Array.from(
    new Set(rows.map((r) => normalizeSourceGroup(r.source)))
  ).sort();

  function buildSeries(filterSource: string | null): MonthlySeasonalityPoint[] {
    const points: MonthlySeasonalityPoint[] = MONTH_NAMES.map((month) => {
      const point: MonthlySeasonalityPoint = { month };
      for (const y of years) point[y] = 0;
      return point;
    });
    for (const row of rows) {
      if (filterSource != null && normalizeSourceGroup(row.source) !== filterSource) continue;
      const yearKey = String(row.year);
      if (!years.includes(yearKey)) continue;
      const point = points[row.monthNum - 1];
      point[yearKey] = (Number(point[yearKey]) || 0) + row.placed;
    }
    return points;
  }

  function buildLeasedSeries(filterSource: string | null): MonthlySeasonalityPoint[] {
    const points: MonthlySeasonalityPoint[] = MONTH_NAMES.map((month) => {
      const point: MonthlySeasonalityPoint = { month };
      for (const y of years) point[y] = 0;
      return point;
    });
    for (const row of rows) {
      if (filterSource != null && normalizeSourceGroup(row.source) !== filterSource) continue;
      const yearKey = String(row.year);
      if (!years.includes(yearKey)) continue;
      const point = points[row.monthNum - 1];
      point[yearKey] = (Number(point[yearKey]) || 0) + row.leased;
    }
    return points;
  }

  const inquiriesBySource: Record<string, MonthlySeasonalityPoint[]> = {
    All: buildSeries(null),
  };
  const leasedBySource: Record<string, MonthlySeasonalityPoint[]> = {
    All: buildLeasedSeries(null),
  };
  for (const source of sources) {
    inquiriesBySource[source] = buildSeries(source);
    leasedBySource[source] = buildLeasedSeries(source);
  }

  return {
    years,
    sources,
    inquiriesBySource,
    leasedBySource,
    asOfDay: now.getDate(),
    currentMonthLabel: MONTH_NAMES[now.getMonth()],
  };
}
