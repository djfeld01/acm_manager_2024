import { RATE_BUCKETS, dayNum, isoFromDayNum, type ExitModel, type StayInput } from "./analytics";
import { wilsonInterval } from "./survival";

/* ---------- what we knew at the notice date ---------- */

/**
 * Stays as they looked on `asOf`: anyone who left after that date is treated
 * as still here (right-censored) and anyone who arrived later is dropped.
 * Fitting the baseline on this keeps the increase from contaminating the
 * expectation it is judged against.
 */
export function truncateStays(stays: StayInput[], asOf: string): StayInput[] {
  const out: StayInput[] = [];
  for (const s of stays) {
    if (s.moveIn > asOf) continue;
    out.push(s.exit !== null && s.exit > asOf ? { ...s, exit: null } : s);
  }
  return out;
}

/* ---------- strata for matching ---------- */

export const TENURE_BUCKETS = [
  { key: "lt6", label: "Under 6 mo", max: 182 },
  { key: "6to12", label: "6–12 mo", max: 365 },
  { key: "1to2", label: "1–2 yr", max: 730 },
  { key: "2plus", label: "2+ yr", max: Infinity },
] as const;

export function tenureBucket(days: number): string {
  return TENURE_BUCKETS.find((b) => days < b.max)!.key;
}

export function ratioBand(ratio: number | null): string {
  if (ratio === null) return "unknown";
  return RATE_BUCKETS.find((b) => b.test(ratio))?.key ?? "unknown";
}

const MIN_CONTROLS_PER_STRATUM = 5;

/* ---------- inputs & outputs ---------- */

export interface CohortMember {
  ledgerId: string;
  tenantId: string | null;
  unitName: string | null;
  unitType: string;
  size: string;
  leaseDate: string | null;
  rent: number;
  standardRate: number | null;
}

export interface ExitEvent {
  tenantId: string;
  unitName: string | null;
  /** YYYY-MM-DD */
  date: string;
}

export interface OutcomeInput {
  noticeDate: string;
  effectiveDate: string;
  /** Latest date our move-out records reach. */
  dataThrough: string;
  /** First date exits are visible to us (the rent roll the batch came from). */
  snapshotDate: string;
  batch: CohortMember[];
  controls: CohortMember[];
  exits: ExitEvent[];
  model: ExitModel;
}

export interface Checkpoint {
  label: string;
  /** Days since the notice date. */
  day: number;
  actual: number;
  expectedTenure: number;
  expectedFacility: number;
  /** Matched-control exits scaled to the matched batch tenants. */
  controlExpected: number;
}

export interface SeriesPoint {
  day: number;
  actual: number;
  expectedTenure: number;
  expectedFacility: number;
  control: number | null;
}

export interface SegmentOutcome {
  label: string;
  tenants: number;
  actual: number;
  expected: number;
}

export type Verdict = "too-early" | "in-line" | "higher" | "lower";

export interface Outcome {
  noticeDate: string;
  effectiveDate: string;
  dataThrough: string;
  /** Days of follow-up so far, counted from the notice date. */
  horizon: number;
  tenants: number;
  /** Left between the rent roll and the notice date — not counted either way. */
  leftBeforeNotice: number;
  checkpoints: Checkpoint[];
  series: SeriesPoint[];
  latest: Checkpoint;
  verdict: Verdict;
  /** How many standard deviations above (+) / below (−) the tenure baseline. */
  zScore: number | null;
  control: {
    pool: number;
    matchedBatch: number;
    unmatchedBatch: number;
    batchRate: number;
    batchRateCI: { lo: number; hi: number };
    controlRate: number;
    difference: number;
  } | null;
  balance: { label: string; batch: string; control: string }[];
  byType: SegmentOutcome[];
  bySize: SegmentOutcome[];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function computeOutcome(input: OutcomeInput): Outcome {
  const { noticeDate, effectiveDate, dataThrough, snapshotDate, model } = input;
  const noticeDay = dayNum(noticeDate);
  const horizon = Math.max(0, dayNum(dataThrough) - noticeDay);

  // Earliest exit per tenant+unit at or after the rent roll date.
  const exitDay = new Map<string, number>();
  for (const e of input.exits) {
    if (e.date < snapshotDate) continue;
    const key = `${e.tenantId}|${e.unitName ?? ""}`;
    const d = dayNum(e.date) - noticeDay;
    const prev = exitDay.get(key);
    if (prev === undefined || d < prev) exitDay.set(key, d);
  }

  type M = CohortMember & { exit: number | null; tenure: number; stratum: string };
  let leftBeforeNotice = 0;
  const prep = (members: CohortMember[], countLeft: boolean): M[] => {
    const out: M[] = [];
    for (const m of members) {
      const d = m.tenantId ? exitDay.get(`${m.tenantId}|${m.unitName ?? ""}`) : undefined;
      if (d !== undefined && d < 0) {
        if (countLeft) leftBeforeNotice++;
        continue;
      }
      const tenure = m.leaseDate ? Math.max(0, noticeDay - dayNum(m.leaseDate)) : 0;
      const ratio = m.standardRate && m.standardRate > 0 ? m.rent / m.standardRate : null;
      out.push({
        ...m,
        exit: d !== undefined && d <= horizon ? d : null,
        tenure,
        stratum: `${tenureBucket(tenure)}|${ratioBand(ratio)}`,
      });
    }
    return out;
  };
  const batch = prep(input.batch, true);
  const controls = prep(input.controls, false);

  // Matched comparison: batch tenants whose stratum has enough controls.
  const controlsByStratum = new Map<string, M[]>();
  for (const c of controls) controlsByStratum.set(c.stratum, [...(controlsByStratum.get(c.stratum) ?? []), c]);
  const matchedBatch = batch.filter((b) => (controlsByStratum.get(b.stratum)?.length ?? 0) >= MIN_CONTROLS_PER_STRATUM);
  const batchCountByStratum = new Map<string, number>();
  for (const b of matchedBatch) batchCountByStratum.set(b.stratum, (batchCountByStratum.get(b.stratum) ?? 0) + 1);

  const actualBy = (members: M[], d: number) => members.filter((m) => m.exit !== null && m.exit <= d).length;
  const expTenure = (d: number) =>
    batch.reduce((a, b) => a + model.prob(b.unitType, b.tenure, d), 0);
  const expFacility = (d: number) => batch.length * (1 - Math.pow(1 - model.monthlyRate, d / 30.44));
  const controlExpected = (d: number) => {
    let total = 0;
    for (const [stratum, nB] of batchCountByStratum) {
      const cs = controlsByStratum.get(stratum)!;
      total += nB * (actualBy(cs, d) / cs.length);
    }
    return total;
  };

  const checkpointDays: { label: string; day: number }[] = [];
  const effDay = dayNum(effectiveDate) - noticeDay;
  const add = (label: string, day: number) => {
    if (day >= 0 && day <= horizon && !checkpointDays.some((c) => c.day === day)) checkpointDays.push({ label, day });
  };
  add("Effective date", effDay);
  add("30 days after", effDay + 30);
  add("60 days after", effDay + 60);
  add("90 days after", effDay + 90);
  if (!checkpointDays.some((c) => c.day === horizon)) checkpointDays.push({ label: "Latest data", day: horizon });
  checkpointDays.sort((a, b) => a.day - b.day);

  const checkpointAt = (label: string, day: number): Checkpoint => ({
    label,
    day,
    actual: actualBy(batch, day),
    expectedTenure: expTenure(day),
    expectedFacility: expFacility(day),
    controlExpected: controlExpected(day),
  });
  const checkpoints = checkpointDays.map((c) => checkpointAt(c.label, c.day));
  const latest = checkpoints[checkpoints.length - 1] ?? checkpointAt("Latest data", 0);

  const series: SeriesPoint[] = [];
  const hasControl = matchedBatch.length > 0;
  for (let d = 0; d <= horizon; d += 7) {
    series.push({
      day: d,
      actual: actualBy(batch, d),
      expectedTenure: expTenure(d),
      expectedFacility: expFacility(d),
      control: hasControl ? controlExpected(d) : null,
    });
  }
  if (horizon % 7 !== 0) {
    series.push({
      day: horizon,
      actual: latest.actual,
      expectedTenure: latest.expectedTenure,
      expectedFacility: latest.expectedFacility,
      control: hasControl ? latest.controlExpected : null,
    });
  }

  // Poisson-style yardstick: is the count unusual given what was expected?
  let zScore: number | null = null;
  let verdict: Verdict = "too-early";
  if (latest.expectedTenure >= 3) {
    zScore = (latest.actual - latest.expectedTenure) / Math.sqrt(latest.expectedTenure);
    verdict = zScore > 2 ? "higher" : zScore < -2 ? "lower" : "in-line";
  }

  let control: Outcome["control"] = null;
  if (hasControl) {
    const mAct = actualBy(matchedBatch, horizon);
    const rate = mAct / matchedBatch.length;
    const cRate = controlExpected(horizon) / matchedBatch.length;
    control = {
      pool: controls.length,
      matchedBatch: matchedBatch.length,
      unmatchedBatch: batch.length - matchedBatch.length,
      batchRate: rate,
      batchRateCI: wilsonInterval(mAct, matchedBatch.length),
      controlRate: cRate,
      difference: rate - cRate,
    };
  }

  const segment = (key: (m: M) => string): SegmentOutcome[] => {
    const labels = Array.from(new Set(batch.map(key)));
    return labels.map((label) => {
      const members = batch.filter((m) => key(m) === label);
      return {
        label,
        tenants: members.length,
        actual: actualBy(members, horizon),
        expected: members.reduce((a, m) => a + model.prob(m.unitType, m.tenure, horizon), 0),
      };
    });
  };

  const typeMix = (ms: M[]) => {
    const total = ms.length || 1;
    const counts = new Map<string, number>();
    for (const m of ms) counts.set(m.unitType, (counts.get(m.unitType) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `${t} ${Math.round((n / total) * 100)}%`)
      .join(", ");
  };
  const ratios = (ms: M[]) =>
    ms.filter((m) => m.standardRate && m.standardRate > 0).map((m) => m.rent / m.standardRate!);
  const balance = [
    { label: "Tenants", batch: String(batch.length), control: String(controls.length) },
    {
      label: "Average months in unit",
      batch: (mean(batch.map((m) => m.tenure)) / 30.44).toFixed(1),
      control: (mean(controls.map((m) => m.tenure)) / 30.44).toFixed(1),
    },
    {
      label: "Rent vs street (before)",
      batch: `${Math.round(mean(ratios(batch)) * 100)}%`,
      control: `${Math.round(mean(ratios(controls)) * 100)}%`,
    },
    { label: "Unit types", batch: typeMix(batch), control: typeMix(controls) },
  ];

  return {
    noticeDate,
    effectiveDate,
    dataThrough,
    horizon,
    tenants: batch.length,
    leftBeforeNotice,
    checkpoints,
    series,
    latest,
    verdict,
    zScore,
    control,
    balance,
    byType: segment((m) => m.unitType),
    bySize: segment((m) => m.size),
  };
}

/* ---------- did the new rent actually land, and what is it worth now? ---------- */

export interface RealizationItem {
  ledgerId: string;
  unitId: string;
  oldRent: number;
  newRent: number;
}

export interface SnapshotUnit {
  unitId: string;
  ledgerId: string | null;
  isRented: boolean;
  rent: number | null;
}

export interface Realization {
  /** False when the rent roll on file is older than the effective date. */
  applicable: boolean;
  snapshotDate: string;
  tenants: number;
  stillHere: number;
  appliedAsPlanned: number;
  notApplied: number;
  changedOtherwise: number;
  gone: number;
  /** Units whose tenant left and a new tenant now rents them. */
  reLet: number;
  vacant: number;
  plannedGain: number;
  /** Extra rent being collected from the original tenants who stayed. */
  stayerGain: number;
  /** Old rent that left with departed tenants, before any re-letting. */
  lostRent: number;
  /** Rent from new tenants in the vacated units. */
  reLetRent: number;
  /** Rent now collected from these units minus their old rent; negative = worse off. */
  netRunRate: number;
}

export function computeRealization(
  items: RealizationItem[],
  units: SnapshotUnit[],
  snapshotDate: string,
  effectiveDate: string
): Realization {
  const byUnit = new Map(units.map((u) => [u.unitId, u]));
  let stillHere = 0;
  let applied = 0;
  let notApplied = 0;
  let other = 0;
  let gone = 0;
  let reLet = 0;
  let vacant = 0;
  let stayerGain = 0;
  let lostRent = 0;
  let reLetRent = 0;
  let occupantRent = 0;
  let oldTotal = 0;
  let plannedGain = 0;

  for (const it of items) {
    oldTotal += it.oldRent;
    plannedGain += it.newRent - it.oldRent;
    const u = byUnit.get(it.unitId);
    const rentNow = u && u.isRented ? (u.rent ?? 0) : 0;
    occupantRent += rentNow;
    if (u && u.isRented && u.ledgerId === it.ledgerId) {
      stillHere++;
      stayerGain += rentNow - it.oldRent;
      if (Math.abs(rentNow - it.newRent) < 0.5) applied++;
      else if (Math.abs(rentNow - it.oldRent) < 0.5) notApplied++;
      else other++;
    } else {
      gone++;
      lostRent += it.oldRent;
      if (u && u.isRented) {
        reLet++;
        reLetRent += rentNow;
      } else {
        vacant++;
      }
    }
  }

  return {
    applicable: snapshotDate >= effectiveDate,
    snapshotDate,
    tenants: items.length,
    stillHere,
    appliedAsPlanned: applied,
    notApplied,
    changedOtherwise: other,
    gone,
    reLet,
    vacant,
    plannedGain,
    stayerGain,
    lostRent,
    reLetRent,
    netRunRate: occupantRent - oldTotal,
  };
}

/** The date the notice has to go out by for a given effective date. */
export function noticeDeadline(effectiveDate: string, noticeDays: number): string {
  return isoFromDayNum(dayNum(effectiveDate) - noticeDays);
}

/* ---------- where a batch is in its life ---------- */

export type BatchStage = "draft" | "awaiting-notice" | "notice-scheduled" | "noticed" | "effective";

export function batchStage(
  b: { status: "draft" | "final"; noticeDate: string | null; effectiveDate: string },
  today: string
): BatchStage {
  if (b.status === "draft") return "draft";
  if (today >= b.effectiveDate) return "effective";
  if (!b.noticeDate) return "awaiting-notice";
  return today >= b.noticeDate ? "noticed" : "notice-scheduled";
}

export const STAGE_LABEL: Record<BatchStage, string> = {
  draft: "Draft",
  "awaiting-notice": "Awaiting notice",
  "notice-scheduled": "Notice scheduled",
  noticed: "Notice sent",
  effective: "In effect",
};

/** Smallest rise over the expected move-outs that would stand out from chance. */
export function detectablePct(expected: number): number | null {
  return expected >= 1 ? (2 / Math.sqrt(expected)) * 100 : null;
}
