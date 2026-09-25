"use server";
import { db } from "@/db";
import { inquiry, storageFacilities } from "@/db/schema";
import { and, eq, gte, lt, inArray, sql } from "drizzle-orm";

export interface StoragePugTrendPoint {
  period: string;
  /** Average StoragePug inquiries per month across active facilities. For a
   *  quarterly point this is the average of that quarter's *monthly* values
   *  (not a 3-month sum), so quarterly and monthly points sit on the same
   *  scale and are directly comparable. */
  portfolioAvg: number;
  byFacility: Record<string, number>;
}

export interface StoragePugTrend {
  monthly: StoragePugTrendPoint[];
  quarterly: StoragePugTrendPoint[];
  facilities: { sitelinkId: string; label: string }[];
  /** The chart stops here — the current calendar month is excluded because
   *  it's still in progress and would understate its own point (and the
   *  quarter containing it). */
  lastCompleteMonth: string;
}

const STORAGEPUG_START = "2025-01-01";

export async function getStoragePugTrend(): Promise<StoragePugTrend> {
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

  const rows = await db
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
        gte(inquiry.datePlaced, sql`${STORAGEPUG_START}::date`),
        lt(inquiry.datePlaced, sql`DATE_TRUNC('month', NOW())`),
        sql`LOWER(${inquiry.source}) LIKE 'storagepug%'`
      )
    )
    .groupBy(
      inquiry.sitelinkId,
      sql`EXTRACT(YEAR FROM ${inquiry.datePlaced})`,
      sql`EXTRACT(MONTH FROM ${inquiry.datePlaced})`
    );

  // Full month list from Jan 2025 through the last COMPLETE month (excludes
  // the current in-progress month).
  const now = new Date();
  const lastComplete = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const months: { year: number; month: number; key: string }[] = [];
  for (let y = 2025, m = 1; y < lastComplete.getFullYear() || (y === lastComplete.getFullYear() && m <= lastComplete.getMonth() + 1); m++) {
    months.push({ year: y, month: m, key: `${y}-${String(m).padStart(2, "0")}` });
    if (m === 12) { m = 0; y++; }
  }

  const countByFacilityMonth = new Map<string, number>();
  for (const r of rows) {
    if (!r.sitelinkId) continue;
    countByFacilityMonth.set(`${r.sitelinkId}|${r.year}-${r.month}`, r.placed);
  }

  const monthly: StoragePugTrendPoint[] = months.map(({ year, month, key }) => {
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
  const quarterMap = new Map<string, StoragePugTrendPoint[]>();
  for (const point of monthly) {
    const [yearStr, monthStr] = point.period.split("-");
    const q = Math.ceil(parseInt(monthStr, 10) / 3);
    const key = `${yearStr}-Q${q}`;
    if (!quarterMap.has(key)) quarterMap.set(key, []);
    quarterMap.get(key)!.push(point);
  }
  const quarterly: StoragePugTrendPoint[] = Array.from(quarterMap.entries()).map(
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
    lastCompleteMonth: months.length > 0 ? months[months.length - 1].key : "",
  };
}
