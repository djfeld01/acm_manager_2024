"use server";
import { db } from "@/db";
import { inquiry, storageFacilities } from "@/db/schema";
import { and, eq, gte, lt, inArray, sql } from "drizzle-orm";

export interface SourceTrendPoint {
  period: string;
  /** Average inquiries per month across active facilities. For a quarterly
   *  point this is the average of that quarter's *monthly* values (not a
   *  3-month sum), so quarterly and monthly points sit on the same scale
   *  and are directly comparable. */
  portfolioAvg: number;
  byFacility: Record<string, number>;
}

export interface SourceTrend {
  monthly: SourceTrendPoint[];
  quarterly: SourceTrendPoint[];
  facilities: { sitelinkId: string; label: string }[];
  /** Every source group seen in the last 2 years, for the picker. */
  availableSources: string[];
  /** The chart stops here — the current calendar month is excluded because
   *  it's still in progress and would understate its own point (and the
   *  quarter containing it). */
  lastCompleteMonth: string;
  seriesStart: string;
}

// Same grouping used elsewhere on the marketing page: StoragePug's many
// sub-sources (Rental/Reservation/Request-a-Quote x google/cpc/organic/none)
// collapse into one "StoragePug" bucket; everything else falls back through
// `inquiryType` (Phone/WalkIn/...) before landing on "Unknown".
const SOURCE_GROUP = sql<string>`
  CASE
    WHEN LOWER(${inquiry.source}) LIKE 'storagepug%' THEN 'StoragePug'
    ELSE COALESCE(NULLIF(TRIM(${inquiry.source}), ''), NULLIF(TRIM(${inquiry.inquiryType}), ''), 'Unknown')
  END
`;

const LOOKBACK_MONTHS = 24;

function parseDateOnlyUTC(s: string): Date {
  const [y, m, d] = s.split(/[ T]/)[0].split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function getSourceTrend(sourceFilter: string): Promise<SourceTrend> {
  const facilities = await db
    .select({
      sitelinkId: storageFacilities.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
    })
    .from(storageFacilities)
    .where(
      and(
        eq(storageFacilities.currentClient, true),
        eq(storageFacilities.isCorporate, false)
      )
    )
    .orderBy(storageFacilities.facilityAbbreviation);
  const facilityIds = facilities.map((f) => f.sitelinkId);

  const availableSourceRows = await db
    .selectDistinct({ source: SOURCE_GROUP })
    .from(inquiry)
    .where(
      and(
        inArray(inquiry.sitelinkId, facilityIds),
        gte(inquiry.datePlaced, sql`NOW() - INTERVAL '2 years'`)
      )
    );
  const availableSources = availableSourceRows.map((r) => r.source).sort();

  const [firstSeen] = await db
    .select({ minDate: sql<string | null>`MIN(${inquiry.datePlaced})` })
    .from(inquiry)
    .where(
      and(inArray(inquiry.sitelinkId, facilityIds), sql`${SOURCE_GROUP} = ${sourceFilter}`)
    );

  // Start at whichever is LATER: the source's own first-seen date, or a
  // fixed 24-month lookback — so a newly-added source (e.g. StoragePug,
  // live since Jan 2025) shows its full history, while a long-lived one
  // (WalkIn, Phone, ...) doesn't drag in a decade of flat history.
  const now = new Date();
  const lookbackStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - LOOKBACK_MONTHS, 1));
  const firstSeenDate = firstSeen?.minDate ? parseDateOnlyUTC(firstSeen.minDate) : null;
  const firstSeenMonthStart = firstSeenDate
    ? new Date(Date.UTC(firstSeenDate.getUTCFullYear(), firstSeenDate.getUTCMonth(), 1))
    : null;
  const seriesStartDate =
    firstSeenMonthStart && firstSeenMonthStart.getTime() > lookbackStart.getTime()
      ? firstSeenMonthStart
      : lookbackStart;
  const lastComplete = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const rows = firstSeen?.minDate
    ? await db
        .select({
          sitelinkId: inquiry.sitelinkId,
          year: sql<number>`EXTRACT(YEAR FROM ${inquiry.datePlaced})::int`,
          month: sql<number>`EXTRACT(MONTH FROM ${inquiry.datePlaced})::int`,
          placed: sql<number>`COUNT(*)::int`,
        })
        .from(inquiry)
        .where(
          and(
            inArray(inquiry.sitelinkId, facilityIds),
            gte(inquiry.datePlaced, sql`${seriesStartDate.toISOString()}::timestamp`),
            lt(inquiry.datePlaced, sql`DATE_TRUNC('month', NOW())`),
            sql`${SOURCE_GROUP} = ${sourceFilter}`
          )
        )
        .groupBy(
          inquiry.sitelinkId,
          sql`EXTRACT(YEAR FROM ${inquiry.datePlaced})`,
          sql`EXTRACT(MONTH FROM ${inquiry.datePlaced})`
        )
    : [];

  const months: { year: number; month: number; key: string }[] = [];
  if (seriesStartDate.getTime() <= lastComplete.getTime()) {
    for (
      let y = seriesStartDate.getUTCFullYear(), m = seriesStartDate.getUTCMonth() + 1;
      y < lastComplete.getUTCFullYear() ||
      (y === lastComplete.getUTCFullYear() && m <= lastComplete.getUTCMonth() + 1);
      m++
    ) {
      months.push({ year: y, month: m, key: `${y}-${String(m).padStart(2, "0")}` });
      if (m === 12) { m = 0; y++; }
    }
  }

  const countByFacilityMonth = new Map<string, number>();
  for (const r of rows) {
    if (!r.sitelinkId) continue;
    countByFacilityMonth.set(`${r.sitelinkId}|${r.year}-${r.month}`, r.placed);
  }

  const monthly: SourceTrendPoint[] = months.map(({ year, month, key }) => {
    const byFacility: Record<string, number> = {};
    let sum = 0;
    for (const f of facilities) {
      const v = countByFacilityMonth.get(`${f.sitelinkId}|${year}-${month}`) ?? 0;
      byFacility[f.sitelinkId] = v;
      sum += v;
    }
    return {
      period: key,
      portfolioAvg: facilities.length > 0 ? Math.round((sum / facilities.length) * 10) / 10 : 0,
      byFacility,
    };
  });

  // Quarterly = average of that quarter's monthly values (keeps the same
  // "per month" units as the monthly series).
  const quarterMap = new Map<string, SourceTrendPoint[]>();
  for (const point of monthly) {
    const [yearStr, monthStr] = point.period.split("-");
    const q = Math.ceil(parseInt(monthStr, 10) / 3);
    const key = `${yearStr}-Q${q}`;
    if (!quarterMap.has(key)) quarterMap.set(key, []);
    quarterMap.get(key)!.push(point);
  }
  const quarterly: SourceTrendPoint[] = Array.from(quarterMap.entries()).map(
    ([period, points]) => {
      const byFacility: Record<string, number> = {};
      for (const f of facilities) {
        const vals = points.map((p) => p.byFacility[f.sitelinkId] ?? 0);
        byFacility[f.sitelinkId] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      }
      return {
        period,
        portfolioAvg: Math.round((points.reduce((sum, p) => sum + p.portfolioAvg, 0) / points.length) * 10) / 10,
        byFacility,
      };
    }
  );

  return {
    monthly,
    quarterly,
    facilities: facilities.map((f) => ({ sitelinkId: f.sitelinkId, label: f.facilityAbbreviation })),
    availableSources,
    lastCompleteMonth: months.length > 0 ? months[months.length - 1].key : "",
    seriesStart: months.length > 0 ? months[0].key : "",
  };
}
