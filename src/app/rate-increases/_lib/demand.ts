import { isoFromDayNum, dayNum } from "./analytics";
import { DEMAND_THRESHOLDS } from "./config";

export interface MoveInRow {
  date: string; // YYYY-MM-DD
  unitType: string;
  size: string;
}
export interface InquiryRow {
  placed: string; // YYYY-MM-DD
  leased: string | null;
  unitType: string;
  size: string;
}

export interface DemandInput {
  asOf: string; // today, YYYY-MM-DD
  moveIns: MoveInRow[];
  inquiries: InquiryRow[];
  /** 12 values, index 0 = January; 1.0 = an average month. */
  seasonalIndex: number[];
  /** Expected move-outs per month by unit type and by size, plus key "All". */
  expectedMoveOutsPerMonth: Record<string, number>;
  /** Vacant rentable units by unit type and by size, plus key "All". */
  vacantUnits: Record<string, number>;
  unitTypes: string[];
  /** Normalized sizes, ordered small to large. */
  sizes: string[];
}

export type DemandStatus = "healthy" | "watch" | "low";

export interface DemandSegment {
  /** Unit type or size, depending on the breakdown. */
  label: string;
  moveInsLast180: number;
  /** Trailing 180-day move-ins per month, before any seasonal adjustment. */
  baseMoveInsPerMonth: number;
  expectedMoveInsPerMonth: number;
  expectedMoveOutsPerMonth: number;
  /** Expected move-ins / expected move-outs. >= 1 means demand refills what leaves. */
  coverage: number | null;
  /** How much MORE move-out than expected demand could absorb before
   *  coverage drops below 1 (coverage - 1). */
  cushion: number | null;
  status: DemandStatus | null;
  /** Vacant units / expected daily move-ins. null if no expected move-ins. */
  absorptionDays: number | null;
  vacantUnits: number;
  inquiriesLast90: number;
  inquiriesSamePeriodLastYear: number;
  inquiriesYoY: number | null;
  /** Share of inquiries placed 30-180 days ago that became leases. */
  conversion: number | null;
  /** Fewer than ~12 move-ins in 6 months: treat the numbers as rough. */
  lowSample: boolean;
  series: { month: string; inquiries: number; moveIns: number }[];
}

const DAYS_PER_MONTH = 30.44;

function monthsCovered(startIso: string, days: number): number[] {
  // calendar months (0-11) touched by [start, start+days), weighted by day count
  const counts = new Array(12).fill(0);
  const s = dayNum(startIso);
  for (let i = 0; i < days; i++) {
    counts[new Date((s + i) * 86400000).getUTCMonth()]++;
  }
  return counts;
}

function weightedIndex(counts: number[], index: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return 1;
  return counts.reduce((a, c, i) => a + c * index[i], 0) / total;
}

export function classifyCoverage(c: number): DemandStatus {
  if (c >= DEMAND_THRESHOLDS.healthy) return "healthy";
  if (c >= DEMAND_THRESHOLDS.watch) return "watch";
  return "low";
}

export interface DemandHealth {
  overall: DemandSegment;
  byType: DemandSegment[];
  bySize: DemandSegment[];
  /** Next-90-day demand relative to the 180 days the run-rate came from
   *  (below 1 = a seasonally slower stretch ahead). */
  seasonalFactor: number;
  /** 12 values, index 0 = January; 1.0 = an average month. */
  seasonalIndex: number[];
  /** The seasonal weight of the 180 days the run-rate came from. */
  trailingMix: number;
}

export function computeDemandHealth(input: DemandInput): DemandHealth {
  const { asOf, seasonalIndex } = input;
  const dayAgo = (n: number) => isoFromDayNum(dayNum(asOf) - n);
  const start180 = dayAgo(180);
  const start90 = dayAgo(90);
  const start365 = dayAgo(365);
  const start30 = dayAgo(30);

  // Seasonal adjustment: next 90 days vs the 180 days the run-rate is based on.
  const trailingMix = weightedIndex(monthsCovered(start180, 180), seasonalIndex);
  const nextMix = weightedIndex(monthsCovered(asOf, 90), seasonalIndex);
  const seasonalFactor = trailingMix > 0 ? nextMix / trailingMix : 1;

  const build = (label: string, match: (r: { unitType: string; size: string }) => boolean): DemandSegment => {
    const mi = input.moveIns.filter((r) => match(r));
    const iq = input.inquiries.filter((r) => match(r));

    const moveInsLast180 = mi.filter((r) => r.date > start180 && r.date <= asOf).length;
    const baseMoveIns = moveInsLast180 / (180 / DAYS_PER_MONTH);
    const expectedMoveIns = baseMoveIns * seasonalFactor;
    const key = label === "All unit types" ? "All" : label;
    const expectedMoveOuts = input.expectedMoveOutsPerMonth[key] ?? 0;
    const coverage = expectedMoveOuts > 0 ? expectedMoveIns / expectedMoveOuts : null;
    const vacant = input.vacantUnits[key] ?? 0;

    const inq90 = iq.filter((r) => r.placed > start90 && r.placed <= asOf).length;
    const inqLY = iq.filter((r) => r.placed > dayAgo(365 + 90) && r.placed <= start365).length;

    // Conversion on inquiries old enough to have resolved.
    const mature = iq.filter((r) => r.placed > start180 && r.placed <= start30);
    const conversion = mature.length >= 10 ? mature.filter((r) => r.leased).length / mature.length : null;

    // Monthly series, last ~24 months.
    const byMonth = new Map<string, { inquiries: number; moveIns: number }>();
    const bump = (m: string, k: "inquiries" | "moveIns") => {
      const e = byMonth.get(m) ?? { inquiries: 0, moveIns: 0 };
      e[k]++;
      byMonth.set(m, e);
    };
    for (const r of iq) bump(r.placed.slice(0, 7), "inquiries");
    for (const r of mi) bump(r.date.slice(0, 7), "moveIns");
    const series = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-25)
      .map(([month, v]) => ({ month, ...v }));

    return {
      label,
      moveInsLast180,
      baseMoveInsPerMonth: baseMoveIns,
      expectedMoveInsPerMonth: expectedMoveIns,
      expectedMoveOutsPerMonth: expectedMoveOuts,
      coverage,
      cushion: coverage === null ? null : coverage - 1,
      status: coverage === null ? null : classifyCoverage(coverage),
      absorptionDays: expectedMoveIns > 0 ? vacant / (expectedMoveIns / DAYS_PER_MONTH) : null,
      vacantUnits: vacant,
      inquiriesLast90: inq90,
      inquiriesSamePeriodLastYear: inqLY,
      inquiriesYoY: inqLY > 0 ? inq90 / inqLY - 1 : null,
      conversion,
      lowSample: moveInsLast180 < 12,
      series,
    };
  };

  return {
    overall: build("All unit types", () => true),
    byType: input.unitTypes.map((t) => build(t, (r) => r.unitType === t)),
    bySize: input.sizes.map((z) => build(z, (r) => r.size === z)),
    seasonalFactor,
    seasonalIndex,
    trailingMix,
  };
}

/** 12-element seasonal index from lease counts keyed by "YYYY-MM"; only
 *  complete years are used. 1.0 = an average month. */
export function seasonalIndexFromLeases(
  counts: { year: number; month: number; n: number }[],
  currentYear: number
): number[] {
  const perMonth = new Array(12).fill(0);
  const years = new Set<number>();
  for (const c of counts) {
    if (c.year >= currentYear) continue;
    perMonth[c.month - 1] += c.n;
    years.add(c.year);
  }
  const total = perMonth.reduce((a, b) => a + b, 0);
  if (!total || !years.size) return new Array(12).fill(1);
  const avg = total / 12;
  return perMonth.map((v) => v / avg);
}

