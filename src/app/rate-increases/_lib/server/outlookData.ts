import { db } from "@/db";
import { rateIncreaseBatch, rateIncreaseBatchItem } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { analyzeStays, buildExitModel, dayNum, daysBetween } from "../analytics";
import { OBSERVATION_START } from "../config";
import {
  DAYS_PER_MONTH,
  simulateOutlook,
  type Band,
  type BandStat,
  type OutlookBatch,
  type OutlookInput,
  type OutlookRun,
  type PremiumRisk,
} from "../outlook";
import { withStreetRate, type StreetBasis } from "../street";
import { buildDemandHealth } from "./demandData";
import { loadLatestSnapshot, loadStayInputs } from "./loadData";

const SIMS = 400;
/** Stores plateau below full: units in turnover, or never quite rentable. */
const MAX_OCCUPANCY = 0.95;
/** Levels of extra move-outs tried for "how bad before it stops paying". */
const UPLIFT_LEVELS = [0, 0.25, 0.5, 1, 1.5, 2];
const RISKS: PremiumRisk[] = ["none", "moderate", "strong"];

export interface OutlookSeries {
  income: Band[];
  cumulative: Band[];
  occupied: Band[];
  expectedExits: number;
}

export interface OutlookPayload {
  asOf: string;
  horizon: number;
  basis: StreetBasis;
  months: { month: number; label: string }[];
  startIncome: number;
  tenants: number;
  vacantUnits: number;
  /** New tenants' rent as a share of street, measured from recent move-ins. */
  replacementRatio: number;
  replacementSample: number;
  /** Expected new tenants in the first month, by unit type. */
  moveInsFirstMonth: { unitType: string; perMonth: number; vacant: number }[];
  runs: Record<PremiumRisk, { base: OutlookSeries; withBatch: OutlookSeries | null; bands: BandStat[] }>;
  /** With a batch chosen: net change in income over the horizon at several levels of extra move-outs (moderate assumption). */
  sensitivity: { uplift: number; delta: number }[] | null;
  /** The level of extra move-outs at which the batch stops paying, if within the range tried. */
  breakEvenUplift: number | null;
  batch: {
    id: number;
    name: string;
    effectiveDate: string;
    effectiveMonth: number;
    tenants: number;
    monthlyGain: number;
    visible: boolean;
  } | null;
}

const monthLabel = (iso: string, mid: number) => {
  const d = new Date((dayNum(iso) + mid * DAYS_PER_MONTH) * 86400000);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

const seedOf = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : NaN;
};

const series = (r: OutlookRun): OutlookSeries => ({
  income: r.income,
  cumulative: r.cumulative,
  occupied: r.occupied,
  expectedExits: r.expectedExits,
});

export interface OutlookSetup {
  asOf: string;
  horizon: number;
  basis: StreetBasis;
  common: Omit<OutlookInput, "risk" | "batch">;
  startIncome: number;
  tenants: number;
  vacantUnits: number;
  replacementRatio: number;
  replacementSample: number;
  moveInsFirstMonth: OutlookPayload["moveInsFirstMonth"];
}

/** Read a store's current rent roll, stay model and demand into simulation inputs. */
export async function buildOutlookInputs(sitelinkId: string, basis: StreetBasis, H: number): Promise<OutlookSetup | null> {
  const snap = await loadLatestSnapshot(sitelinkId);
  if (!snap.date) return null;
  const asOf = snap.date;

  const stays = await loadStayInputs(sitelinkId, snap.rows);
  const stay = analyzeStays(stays, { asOf, windowStart: OBSERVATION_START });
  const model = buildExitModel(stays, { asOf, windowStart: OBSERVATION_START });
  const health = await buildDemandHealth(sitelinkId, new Date().toISOString().slice(0, 10), snap.rows, stay);

  const rows = withStreetRate(snap.rows, basis);
  const streetOf = (r: { standardRate: number | null }, fallback: number) => (r.standardRate && r.standardRate > 0 ? r.standardRate : fallback);

  const tenants = rows
    .filter((r) => r.isRented && (r.rent ?? 0) > 0 && r.ledgerId)
    .map((r) => ({
      ledgerId: r.ledgerId!,
      unitType: r.unitType,
      rent: r.rent!,
      street: streetOf(r, r.rent!),
      tenureDays: r.leaseDate ? Math.max(0, daysBetween(r.leaseDate, asOf)) : 365,
    }));
  const vacant = rows
    .filter((r) => r.isRentable && !r.isRented && (r.standardRate ?? 0) > 0)
    .map((r) => ({ unitType: r.unitType, street: r.standardRate! }));

  // What new tenants pay against street, from recent move-ins that haven't been raised.
  const fresh = rows
    .filter(
      (r) =>
        r.isRented && r.leaseDate && (r.rent ?? 0) > 0 && (r.standardRate ?? 0) > 0 &&
        daysBetween(r.leaseDate, asOf) <= 180 && (!r.rentLastChanged || r.rentLastChanged <= r.leaseDate)
    )
    .map((r) => r.rent! / r.standardRate!);
  const replacementRatio = fresh.length >= 20 ? Math.min(1.1, Math.max(0.75, median(fresh))) : 1;

  const segByType = new Map(health.byType.map((s) => [s.label, s]));
  const moveInsPerMonth = (unitType: string, month: number) => {
    const seg = segByType.get(unitType);
    if (!seg) return 0;
    const mid = new Date((dayNum(asOf) + (month - 0.5) * DAYS_PER_MONTH) * 86400000).getUTCMonth();
    const factor = health.trailingMix > 0 ? health.seasonalIndex[mid]! / health.trailingMix : 1;
    return seg.baseMoveInsPerMonth * factor;
  };

  const types = Array.from(new Set([...tenants.map((t) => t.unitType), ...vacant.map((v) => v.unitType)]));
  return {
    asOf,
    horizon: H,
    basis,
    common: {
      tenants,
      vacant,
      exitProb: model.prob,
      moveInsPerMonth,
      replacementRatio,
      horizon: H,
      sims: SIMS,
      seed: seedOf(`${sitelinkId}|${asOf}`),
      maxOccupancy: MAX_OCCUPANCY,
    },
    startIncome: tenants.reduce((a, t) => a + t.rent, 0),
    tenants: tenants.length,
    vacantUnits: vacant.length,
    replacementRatio,
    replacementSample: fresh.length,
    moveInsFirstMonth: types.map((t) => ({ unitType: t, perMonth: moveInsPerMonth(t, 1), vacant: vacant.filter((v) => v.unitType === t).length })),
  };
}

/** Project a store's rental income, with and without a chosen batch of increases. */
export async function loadOutlook(
  sitelinkId: string,
  opts: { basis: StreetBasis; horizon: number; batchId: number | null; upliftPct: number }
): Promise<OutlookPayload | null> {
  const setup = await buildOutlookInputs(sitelinkId, opts.basis, opts.horizon);
  if (!setup) return null;
  const { asOf, common } = setup;
  const H = opts.horizon;

  // The batch to compare against, if one was chosen.
  let batchInfo: OutlookPayload["batch"] = null;
  let batch: OutlookBatch | null = null;
  if (opts.batchId !== null) {
    const [b] = await db
      .select()
      .from(rateIncreaseBatch)
      .where(and(eq(rateIncreaseBatch.id, opts.batchId), eq(rateIncreaseBatch.sitelinkId, sitelinkId)))
      .limit(1);
    if (!b) throw new Error("Batch not found");
    const items = await db.select().from(rateIncreaseBatchItem).where(eq(rateIncreaseBatchItem.batchId, b.id));
    const effectiveMonth = Math.max(1, Math.floor(daysBetween(asOf, b.effectiveDate) / DAYS_PER_MONTH) + 1);
    batch = {
      raises: Object.fromEntries(items.map((i) => [i.ledgerId, i.newRent])),
      effectiveMonth,
      exitUplift: opts.upliftPct / 100,
      upliftMonths: 3,
    };
    batchInfo = {
      id: b.id,
      name: b.name,
      effectiveDate: b.effectiveDate,
      effectiveMonth,
      tenants: items.length,
      monthlyGain: items.reduce((a, i) => a + (i.newRent - i.oldRent), 0),
      visible: effectiveMonth <= H,
    };
  }

  const runs = {} as OutlookPayload["runs"];
  for (const risk of RISKS) {
    const base = simulateOutlook({ ...common, risk });
    const withBatch = batch ? simulateOutlook({ ...common, risk, batch }) : null;
    runs[risk] = { base: series(base), withBatch: withBatch ? series(withBatch) : null, bands: base.bands };
  }

  // How bad would move-outs have to get before the batch loses money?
  let sensitivity: OutlookPayload["sensitivity"] = null;
  let breakEvenUplift: number | null = null;
  if (batch) {
    const baseEnd = runs.moderate.base.cumulative[H - 1]!.p50;
    sensitivity = UPLIFT_LEVELS.map((uplift) => {
      const r = simulateOutlook({ ...common, risk: "moderate", batch: { ...batch!, exitUplift: uplift } });
      return { uplift, delta: r.cumulative[H - 1]!.p50 - baseEnd };
    });
    for (let i = 1; i < sensitivity.length; i++) {
      const a = sensitivity[i - 1]!, b = sensitivity[i]!;
      if (a.delta >= 0 && b.delta < 0) {
        breakEvenUplift = a.uplift + ((b.uplift - a.uplift) * a.delta) / (a.delta - b.delta);
        break;
      }
    }
  }

  return {
    asOf,
    horizon: H,
    basis: opts.basis,
    months: Array.from({ length: H }, (_, i) => ({ month: i + 1, label: monthLabel(asOf, i + 0.5) })),
    startIncome: setup.startIncome,
    tenants: setup.tenants,
    vacantUnits: setup.vacantUnits,
    replacementRatio: setup.replacementRatio,
    replacementSample: setup.replacementSample,
    moveInsFirstMonth: setup.moveInsFirstMonth,
    runs,
    sensitivity,
    breakEvenUplift,
    batch: batchInfo,
  };
}
