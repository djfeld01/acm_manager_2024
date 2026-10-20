import {
  kaplanMeier,
  survivalAt,
  medianStay,
  restrictedMeanStay,
  exitProbability,
  type KMCurve,
  type StayRecord,
} from "./survival";
import { UNIT_TYPE_GROUPS, compareSizes, normalizeSize } from "./unitTypes";

/* ---------- date helpers (YYYY-MM-DD strings, UTC day numbers) ---------- */

export function dayNum(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
export function isoFromDayNum(n: number): string {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}
export const daysBetween = (a: string, b: string) => dayNum(b) - dayNum(a);

/* ---------- street-rate position ---------- */

export interface UnitSnapshot {
  unitType: string;
  size: string | null;
  isRentable: boolean;
  isRented: boolean;
  rent: number | null;
  standardRate: number | null;
}

export const RATE_BUCKETS = [
  { key: "below", label: "Below street", test: (r: number) => r < 0.995 },
  { key: "at", label: "At street (0-10% over)", test: (r: number) => r >= 0.995 && r < 1.1 },
  { key: "over10", label: "10-25% over", test: (r: number) => r >= 1.1 && r < 1.25 },
  { key: "over25", label: "25%+ over", test: (r: number) => r >= 1.25 },
] as const;

export interface StreetPositionSegment {
  /** Unit type or size, depending on the breakdown. */
  label: string;
  units: number;
  rentable: number;
  rented: number;
  vacant: number;
  occupancy: number;
  avgRent: number;
  avgStreet: number;
  medianRatio: number;
  /** Monthly rent already collected above (below) street, summed. */
  dollarsOverStreet: number;
  buckets: { key: string; label: string; count: number; monthlyRent: number }[];
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function segmentPosition(label: string, rows: UnitSnapshot[]): StreetPositionSegment {
  const rentable = rows.filter((r) => r.isRentable);
  const rented = rows.filter((r) => r.isRented);
  const priced = rented.filter((r) => (r.rent ?? 0) > 0 && (r.standardRate ?? 0) > 0);
  const ratios = priced.map((r) => r.rent! / r.standardRate!);
  return {
    label,
    units: rows.length,
    rentable: rentable.length,
    rented: rented.length,
    vacant: rentable.filter((r) => !r.isRented).length,
    occupancy: rentable.length ? rented.filter((r) => r.isRentable).length / rentable.length : 0,
    avgRent: priced.length ? priced.reduce((a, r) => a + r.rent!, 0) / priced.length : 0,
    avgStreet: priced.length ? priced.reduce((a, r) => a + r.standardRate!, 0) / priced.length : 0,
    medianRatio: median(ratios),
    dollarsOverStreet: priced.reduce((a, r) => a + (r.rent! - r.standardRate!), 0),
    buckets: RATE_BUCKETS.map((b) => {
      const inBucket = priced.filter((r) => b.test(r.rent! / r.standardRate!));
      return {
        key: b.key,
        label: b.label,
        count: inBucket.length,
        monthlyRent: inBucket.reduce((a, r) => a + r.rent!, 0),
      };
    }),
  };
}

export function streetRatePosition(rows: UnitSnapshot[]): {
  overall: StreetPositionSegment;
  byType: StreetPositionSegment[];
  bySize: StreetPositionSegment[];
} {
  const types = [...UNIT_TYPE_GROUPS, "Other"] as string[];
  const sizes = Array.from(new Set(rows.map((r) => normalizeSize(r.size)))).sort(compareSizes);
  return {
    overall: segmentPosition("All units", rows),
    byType: types
      .map((t) => segmentPosition(t, rows.filter((r) => r.unitType === t)))
      .filter((s) => s.units > 0),
    bySize: sizes.map((z) => segmentPosition(z, rows.filter((r) => normalizeSize(r.size) === z))),
  };
}

/* ---------- stays & survival ---------- */

export interface StayInput {
  /** Move-in (lease) date, YYYY-MM-DD. */
  moveIn: string;
  /** Move-out date, or null if still a tenant at the snapshot. */
  exit: string | null;
  unitType: string;
  /** Normalized size, e.g. "10x10". */
  size: string;
  /** Current tenants only: lets per-tenant risk be reported back. */
  ledgerId?: string;
}

const MIN_EVENTS_FOR_SEGMENT = 30;

export interface CurvePoint {
  day: number;
  s: number;
  lo: number;
  hi: number;
}

export interface SegmentSurvival {
  /** Unit type or size, depending on the breakdown. */
  label: string;
  nStays: number;
  nEvents: number;
  /** true when too few move-outs to fit this type alone, so the overall
   *  facility-wide curve is used for its numbers instead. */
  usedFallback: boolean;
  curve: CurvePoint[];
  medianDays: number | null;
  expectedStayDays: number;
  survival: { m6: number; m12: number; m24: number; m36: number; m60: number };
  currentTenants: number;
  expectedMoveOuts: { d30: number; d60: number; d90: number };
}

export interface MonthlyBacktest {
  month: string; // YYYY-MM
  atRiskAtStart: number;
  actualMoveOuts: number;
  expectedTenure: number;
  expectedFacilityAvg: number;
  actualRate: number;
}

export interface StayAnalysis {
  asOf: string;
  windowStart: string;
  overall: SegmentSurvival;
  byType: SegmentSurvival[];
  bySize: SegmentSurvival[];
  /** Baseline chance of leaving in 30/60/90 days, per current tenant by
   *  ledger ID. Only filled when asked for. */
  tenantRisk?: Record<string, { d30: number; d60: number; d90: number }>;
  monthly: MonthlyBacktest[];
  baseline: {
    avgMonthlyRate: number;
    expectedMoveOuts: { d30: number; d60: number; d90: number };
    tenureExpectedMoveOuts: { d30: number; d60: number; d90: number };
  };
}

function toRecord(s: StayInput, windowStart: string, asOf: string): StayRecord {
  const entry = Math.max(0, daysBetween(s.moveIn, windowStart));
  const end = s.exit ?? asOf;
  return { entry, time: daysBetween(s.moveIn, end), event: s.exit !== null };
}

function sampleCurve(curve: KMCurve, maxDays = 3650, step = 30): CurvePoint[] {
  const out: CurvePoint[] = [];
  const cap = Math.min(maxDays, Math.max(curve.reliableMaxT, 365));
  for (let d = 0; d <= cap; d += step) {
    let lo = 1;
    let hi = 1;
    for (const p of curve.points) {
      if (p.t <= d) {
        lo = p.lo;
        hi = p.hi;
      } else break;
    }
    out.push({ day: d, s: survivalAt(curve, d), lo, hi });
  }
  return out;
}

export function analyzeStays(
  stays: StayInput[],
  opts: { asOf: string; windowStart: string; withTenantRisk?: boolean }
): StayAnalysis {
  const { asOf, windowStart } = opts;
  const records = (xs: StayInput[]) => xs.map((s) => toRecord(s, windowStart, asOf));

  const overallCurve = kaplanMeier(records(stays));
  const current = stays.filter((s) => s.exit === null);

  /** Fit one curve per segment; segments with too few move-outs borrow the
   *  overall curve. `pick` gives the curve a given stay should be scored with. */
  const fitBy = (keyOf: (s: StayInput) => string) => {
    const fits = new Map<string, { own: KMCurve; curve: KMCurve; fallback: boolean }>();
    for (const k of new Set(stays.map(keyOf))) {
      const own = kaplanMeier(records(stays.filter((s) => keyOf(s) === k)));
      const fallback = own.nEvents < MIN_EVENTS_FOR_SEGMENT;
      fits.set(k, { own, curve: fallback ? overallCurve : own, fallback });
    }
    const pick = (s: StayInput) => fits.get(keyOf(s))?.curve ?? overallCurve;
    return { fits, pick };
  };

  const expectedFor = (xs: StayInput[], pick: (s: StayInput) => KMCurve) => {
    const out = { d30: 0, d60: 0, d90: 0 };
    for (const s of xs) {
      const tenure = daysBetween(s.moveIn, asOf);
      const c = pick(s);
      out.d30 += exitProbability(c, tenure, 30);
      out.d60 += exitProbability(c, tenure, 60);
      out.d90 += exitProbability(c, tenure, 90);
    }
    return out;
  };

  const summarize = (
    label: string,
    curve: KMCurve,
    nStays: number,
    nEvents: number,
    fallback: boolean,
    currentInSegment: StayInput[],
    pick: (s: StayInput) => KMCurve
  ): SegmentSurvival => ({
    label,
    nStays,
    nEvents,
    usedFallback: fallback,
    curve: sampleCurve(curve),
    medianDays: medianStay(curve),
    expectedStayDays: restrictedMeanStay(curve, 3650),
    survival: {
      m6: survivalAt(curve, 182),
      m12: survivalAt(curve, 365),
      m24: survivalAt(curve, 730),
      m36: survivalAt(curve, 1095),
      m60: survivalAt(curve, 1825),
    },
    currentTenants: currentInSegment.length,
    expectedMoveOuts: expectedFor(currentInSegment, pick),
  });

  const segmentsBy = (keyOf: (s: StayInput) => string) => {
    const { fits, pick } = fitBy(keyOf);
    const list = Array.from(fits.entries()).map(([k, f]) =>
      summarize(k, f.curve, f.own.nStays, f.own.nEvents, f.fallback, current.filter((s) => keyOf(s) === k), pick)
    );
    return { list, pick };
  };

  const overall = summarize(
    "All unit types",
    overallCurve,
    overallCurve.nStays,
    overallCurve.nEvents,
    false,
    current,
    () => overallCurve
  );
  const typeSeg = segmentsBy((s) => s.unitType);
  const byType = typeSeg.list.sort((a, b) => b.nStays - a.nStays);
  const bySize = segmentsBy((s) => s.size).list.sort((a, b) => compareSizes(a.label, b.label));
  const curveFor = typeSeg.pick;

  let tenantRisk: StayAnalysis["tenantRisk"];
  if (opts.withTenantRisk) {
    tenantRisk = {};
    for (const s of current) {
      if (s.ledgerId) tenantRisk[s.ledgerId] = expectedFor([s], curveFor);
    }
  }

  // ---- monthly backtest: who was here at each month start, what we expected
  // vs what actually happened. In-sample (the curve was fit on this data).
  const monthly: MonthlyBacktest[] = [];
  const [wy, wm] = windowStart.split("-").map(Number);
  const [ay, am] = asOf.split("-").map(Number);
  let y = wy;
  let m = wm;
  const monthStart = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}-01`;
  const nextMonth = (yy: number, mm: number): [number, number] => (mm === 12 ? [yy + 1, 1] : [yy, mm + 1]);

  const rows: Omit<MonthlyBacktest, "expectedFacilityAvg">[] = [];
  while (y < ay || (y === ay && m < am)) {
    const start = monthStart(y, m);
    const [ny, nm] = nextMonth(y, m);
    const end = monthStart(ny, nm);
    const days = daysBetween(start, end);

    let atRisk = 0;
    let actual = 0;
    let expected = 0;
    for (const s of stays) {
      const inAtStart = s.moveIn <= start && (s.exit === null || s.exit > start);
      if (inAtStart) {
        atRisk++;
        expected += exitProbability(curveFor(s), daysBetween(s.moveIn, start), days);
      } else if (s.moveIn > start && s.moveIn < end) {
        // moved in during the month: only exposed for the rest of it
        expected += exitProbability(curveFor(s), 0, daysBetween(s.moveIn, end));
      }
      if (s.exit !== null && s.exit >= start && s.exit < end) actual++;
    }
    rows.push({
      month: start.slice(0, 7),
      atRiskAtStart: atRisk,
      actualMoveOuts: actual,
      expectedTenure: expected,
      actualRate: atRisk ? actual / atRisk : 0,
    });
    [y, m] = [ny, nm];
  }

  const totalAtRisk = rows.reduce((a, r) => a + r.atRiskAtStart, 0);
  const totalActual = rows.reduce((a, r) => a + r.actualMoveOuts, 0);
  const avgMonthlyRate = totalAtRisk ? totalActual / totalAtRisk : 0;
  for (const r of rows) {
    monthly.push({ ...r, expectedFacilityAvg: r.atRiskAtStart * avgMonthlyRate });
  }

  const recent = rows.slice(-12);
  const recentAtRisk = recent.reduce((a, r) => a + r.atRiskAtStart, 0);
  const recentRate = recentAtRisk ? recent.reduce((a, r) => a + r.actualMoveOuts, 0) / recentAtRisk : avgMonthlyRate;
  const occupiedNow = current.length;

  return {
    asOf,
    windowStart,
    overall,
    byType,
    bySize,
    tenantRisk,
    monthly,
    baseline: {
      avgMonthlyRate: recentRate,
      expectedMoveOuts: {
        d30: occupiedNow * recentRate,
        d60: occupiedNow * recentRate * 2,
        d90: occupiedNow * recentRate * 3,
      },
      tenureExpectedMoveOuts: overall.expectedMoveOuts,
    },
  };
}

/**
 * A reusable exit model fit on stays as of one date: per-unit-type survival
 * curves (falling back to the overall curve for thin types) plus the
 * facility's recent monthly exit rate. Used to say how many of a group would
 * be expected to leave over any horizon.
 */
export interface ExitModel {
  /** Chance a tenant of this type, already `tenureDays` in, leaves within `horizonDays`. */
  prob: (unitType: string, tenureDays: number, horizonDays: number) => number;
  /** Trailing-12-month share of tenants leaving per month. */
  monthlyRate: number;
}

export function buildExitModel(
  stays: StayInput[],
  opts: { asOf: string; windowStart: string }
): ExitModel {
  const { asOf, windowStart } = opts;
  const records = (xs: StayInput[]) => xs.map((s) => toRecord(s, windowStart, asOf));
  const overall = kaplanMeier(records(stays));
  const byType = new Map<string, KMCurve>();
  for (const t of new Set(stays.map((s) => s.unitType))) {
    const c = kaplanMeier(records(stays.filter((s) => s.unitType === t)));
    byType.set(t, c.nEvents < MIN_EVENTS_FOR_SEGMENT ? overall : c);
  }
  return {
    prob: (unitType, tenureDays, horizonDays) =>
      exitProbability(byType.get(unitType) ?? overall, tenureDays, horizonDays),
    monthlyRate: analyzeStays(stays, { asOf, windowStart }).baseline.avgMonthlyRate,
  };
}
