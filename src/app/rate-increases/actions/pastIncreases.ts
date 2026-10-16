"use server";
import { db } from "@/db";
import { increaseWaveMonth, occupancyMonth, storageFacilities, tenantActivities } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { assertOwnerOrAdmin } from "../_lib/server/guard";
import { ALL, type OccupancyRow, type ReportKind, type WaveMonthRow } from "../_lib/reports";
import { analyzeFacilityWaves, pooledEvidence, type FacilityWaves, type PooledEvidence } from "../_lib/waves";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ROWS = 6000;
const CHUNK = 400;

export interface SaveReportInput {
  kind: ReportKind;
  /** Date the report was run, YYYY-MM-DD. */
  reportDate: string;
  sites: { sitelinkId: string; rows: (WaveMonthRow | OccupancyRow)[] }[];
}

export interface SaveReportResult {
  sites: { sitelinkId: string; name: string; rows: number; kept: number; skipped: number }[];
}

function checkMonth(m: string) {
  if (!ISO.test(m) || !m.endsWith("-01")) throw new Error(`"${m}" is not the first of a month`);
}
function checkNum(n: unknown, what: string) {
  if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`${what} is not a number`);
}

/** Store one parsed report. Re-uploading is safe: a row is only replaced by a
 *  report run on the same day or later, so an older file can't overwrite newer data. */
export async function saveIncreaseReport(input: SaveReportInput): Promise<SaveReportResult> {
  await assertOwnerOrAdmin();
  if (input.kind !== "tracking" && input.kind !== "history") throw new Error("Unknown report type");
  if (!ISO.test(input.reportDate)) throw new Error("The report date is not a valid date");
  if (input.reportDate > new Date(Date.now() + 86400000).toISOString().slice(0, 10)) {
    throw new Error("The report date is in the future");
  }
  if (!input.sites.length) throw new Error("The report has no facilities");
  if (input.sites.reduce((n, s) => n + s.rows.length, 0) > MAX_ROWS) throw new Error("That report is too large");

  const ids = input.sites.map((s) => s.sitelinkId);
  const known = await db
    .select({ id: storageFacilities.sitelinkId, name: storageFacilities.facilityName })
    .from(storageFacilities)
    .where(inArray(storageFacilities.sitelinkId, ids));
  const names = new Map(known.map((k) => [k.id, k.name]));
  const unknown = ids.filter((i) => !names.has(i));
  if (unknown.length) throw new Error(`SiteID ${unknown.join(", ")} isn't one of your facilities in the app.`);

  const out: SaveReportResult["sites"] = [];
  for (const site of input.sites) {
    let kept = 0;
    if (input.kind === "tracking") {
      const rows = (site.rows as WaveMonthRow[]).map((r) => {
        checkMonth(r.month);
        for (const [k, v] of Object.entries(r)) if (typeof v === "number") checkNum(v, k);
        return { ...r, sitelinkId: site.sitelinkId, unitType: r.unitType.slice(0, 32), size: r.size.slice(0, 32), reportDate: input.reportDate };
      });
      for (let i = 0; i < rows.length; i += CHUNK) {
        const res = await db
          .insert(increaseWaveMonth)
          .values(rows.slice(i, i + CHUNK))
          .onConflictDoUpdate({
            target: [increaseWaveMonth.sitelinkId, increaseWaveMonth.month, increaseWaveMonth.unitType, increaseWaveMonth.size],
            set: {
              unitsRaised: sql`excluded.units_raised`,
              dollarsAdded: sql`excluded.dollars_added`,
              avgPct: sql`excluded.avg_pct`,
              atStandard: sql`excluded.at_standard`,
              belowStandard: sql`excluded.below_standard`,
              aboveStandard: sql`excluded.above_standard`,
              moveouts0to30: sql`excluded.moveouts_0_30`,
              moveouts31to60: sql`excluded.moveouts_31_60`,
              moveouts61to90: sql`excluded.moveouts_61_90`,
              moveouts0to30Rent: sql`excluded.moveouts_0_30_rent`,
              moveouts31to60Rent: sql`excluded.moveouts_31_60_rent`,
              moveouts61to90Rent: sql`excluded.moveouts_61_90_rent`,
              reportDate: sql`excluded.report_date`,
            },
            setWhere: sql`excluded.report_date >= ${increaseWaveMonth.reportDate}`,
          })
          .returning({ id: increaseWaveMonth.id });
        kept += res.length;
      }
      out.push({ sitelinkId: site.sitelinkId, name: names.get(site.sitelinkId)!, rows: rows.length, kept, skipped: rows.length - kept });
    } else {
      const rows = (site.rows as OccupancyRow[]).map((r) => {
        checkMonth(r.month);
        for (const [k, v] of Object.entries(r)) if (typeof v === "number") checkNum(v, k);
        return { ...r, sitelinkId: site.sitelinkId, unitType: r.unitType.slice(0, 32), size: r.size.slice(0, 32), reportDate: input.reportDate };
      });
      for (let i = 0; i < rows.length; i += CHUNK) {
        const res = await db
          .insert(occupancyMonth)
          .values(rows.slice(i, i + CHUNK))
          .onConflictDoUpdate({
            target: [occupancyMonth.sitelinkId, occupancyMonth.month, occupancyMonth.unitType, occupancyMonth.size],
            set: {
              unitsOccupied: sql`excluded.units_occupied`,
              totalUnits: sql`excluded.total_units`,
              grossOccupied: sql`excluded.gross_occupied`,
              actualOccupied: sql`excluded.actual_occupied`,
              reportDate: sql`excluded.report_date`,
            },
            setWhere: sql`excluded.report_date >= ${occupancyMonth.reportDate}`,
          })
          .returning({ id: occupancyMonth.id });
        kept += res.length;
      }
      out.push({ sitelinkId: site.sitelinkId, name: names.get(site.sitelinkId)!, rows: rows.length, kept, skipped: rows.length - kept });
    }
  }
  return { sites: out };
}

export interface WaveGroup {
  unitType: string;
  size: string;
  unitsRaised: number;
  avgPct: number;
  aboveStandard: number;
  /** SiteLink's count of these raised units that moved out within 90 days. */
  moveouts90: number;
}

export interface ImportSummary {
  sitelinkId: string;
  name: string;
  waveMonths: { from: string; to: string } | null;
  waveReportDate: string | null;
  occupancyMonths: { from: string; to: string } | null;
  occupancyReportDate: string | null;
}

export interface PastIncreasesData {
  facilities: FacilityWaves[];
  pooled: PooledEvidence | null;
  imports: ImportSummary[];
  /** Unit-type/size detail for each wave month, keyed "sitelinkId|YYYY-MM-01". */
  groups: Record<string, WaveGroup[]>;
}

async function loadFacilityWaves(): Promise<{ facilities: FacilityWaves[]; imports: ImportSummary[]; waveMonthKeys: Set<string> }> {
  const asOf = new Date().toISOString().slice(0, 10);

  const waveRows = await db.select().from(increaseWaveMonth).where(and(eq(increaseWaveMonth.unitType, ALL), eq(increaseWaveMonth.size, ALL)));
  const occRows = await db
    .select({
      sitelinkId: occupancyMonth.sitelinkId,
      month: occupancyMonth.month,
      occupied: sql<number>`sum(${occupancyMonth.unitsOccupied})::int`,
      reportDate: sql<string>`max(${occupancyMonth.reportDate})::text`,
    })
    .from(occupancyMonth)
    .groupBy(occupancyMonth.sitelinkId, occupancyMonth.month);

  const ids = Array.from(new Set([...waveRows.map((r) => r.sitelinkId), ...occRows.map((r) => r.sitelinkId)]));
  if (!ids.length) return { facilities: [], imports: [], waveMonthKeys: new Set() };

  const names = new Map(
    (
      await db
        .select({ id: storageFacilities.sitelinkId, name: storageFacilities.facilityName })
        .from(storageFacilities)
        .where(inArray(storageFacilities.sitelinkId, ids))
    ).map((f) => [f.id, f.name])
  );

  const exitRows = await db
    .select({
      facility: tenantActivities.facilityId,
      month: sql<string>`to_char(${tenantActivities.date}, 'YYYY-MM') || '-01'`,
      n: sql<number>`count(*)::int`,
    })
    .from(tenantActivities)
    .where(and(inArray(tenantActivities.facilityId, ids), sql`${tenantActivities.activityType} = 'MoveOut'`))
    .groupBy(tenantActivities.facilityId, sql`2`);

  const facilities: FacilityWaves[] = [];
  const imports: ImportSummary[] = [];
  const waveMonthKeys = new Set<string>();
  const range = (months: string[]) => (months.length ? { from: [...months].sort()[0]!, to: [...months].sort().at(-1)! } : null);
  for (const id of ids) {
    const w = waveRows.filter((r) => r.sitelinkId === id);
    const o = occRows.filter((r) => r.sitelinkId === id);
    const result = analyzeFacilityWaves({
      sitelinkId: id,
      name: names.get(id) ?? id,
      asOf,
      waves: w.map((r) => ({
        month: r.month,
        unitsRaised: r.unitsRaised,
        dollarsAdded: r.dollarsAdded,
        avgPct: r.avgPct,
        atStandard: r.atStandard,
        belowStandard: r.belowStandard,
        aboveStandard: r.aboveStandard,
        moveouts0to30: r.moveouts0to30,
        moveouts31to60: r.moveouts31to60,
        moveouts61to90: r.moveouts61to90,
      })),
      occupancy: o.map((r) => ({ month: r.month, occupied: r.occupied })),
      exits: exitRows.filter((e) => e.facility === id).map((e) => ({ month: e.month, exits: e.n })),
    });
    facilities.push(result);
    for (const wv of result.waves) if (wv.isWave) waveMonthKeys.add(`${id}|${wv.month}`);
    imports.push({
      sitelinkId: id,
      name: names.get(id) ?? id,
      waveMonths: range(w.map((r) => r.month)),
      waveReportDate: w.map((r) => r.reportDate).sort().at(-1) ?? null,
      occupancyMonths: range(o.map((r) => r.month)),
      occupancyReportDate: o.map((r) => r.reportDate).sort().at(-1) ?? null,
    });
  }
  return { facilities, imports, waveMonthKeys };
}

export async function getPastIncreases(): Promise<PastIncreasesData> {
  await assertOwnerOrAdmin();
  const { facilities, imports, waveMonthKeys } = await loadFacilityWaves();

  const groups: Record<string, WaveGroup[]> = {};
  if (waveMonthKeys.size) {
    const rows = await db
      .select()
      .from(increaseWaveMonth)
      .where(and(inArray(increaseWaveMonth.sitelinkId, imports.map((i) => i.sitelinkId)), sql`${increaseWaveMonth.unitType} <> ${ALL}`));
    for (const r of rows) {
      const key = `${r.sitelinkId}|${r.month}`;
      if (!waveMonthKeys.has(key)) continue;
      (groups[key] ??= []).push({
        unitType: r.unitType,
        size: r.size,
        unitsRaised: r.unitsRaised,
        avgPct: r.avgPct,
        aboveStandard: r.aboveStandard,
        moveouts90: r.moveouts0to30 + r.moveouts31to60 + r.moveouts61to90,
      });
    }
  }
  return { facilities, pooled: pooledEvidence(facilities), imports, groups };
}

/** Just the pooled finding, for the Batch Builder's what-if. */
export async function getWaveEvidence(): Promise<PooledEvidence | null> {
  await assertOwnerOrAdmin();
  const { facilities } = await loadFacilityWaves();
  return pooledEvidence(facilities);
}
