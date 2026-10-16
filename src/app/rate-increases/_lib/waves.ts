/**
 * How move-outs behaved after past rent-increase "waves" at a facility.
 *
 * Which months were waves, and how big, comes from SiteLink's Tenant Increase
 * Tracking report; occupancy comes from its Rate Management History report;
 * move-outs come from our own records (one consistent definition). A wave's
 * effect is the move-out rate in the three months from the increase, relative
 * to the same facility's rate in comparison months with no wave nearby.
 *
 * This is deliberately simple: it ignores season and tenant tenure, which the
 * survival model in the Length of Stay tab does account for. It exists so the
 * same method works at facilities where we have no rent roll.
 */

export const MIN_WAVE_UNITS = 50;
/** A wave raises at least this share of the occupied units. */
export const MIN_WAVE_SHARE = 0.25;
/** Comparison months needed before a wave's effect is reported. */
export const MIN_REFERENCE_MONTHS = 4;
/** Our move-out records begin here. */
export const EXITS_FROM = "2024-01-01";

export interface WaveMonth {
  /** YYYY-MM-01 */
  month: string;
  unitsRaised: number;
  dollarsAdded: number;
  avgPct: number;
  atStandard: number;
  belowStandard: number;
  aboveStandard: number;
  /** SiteLink's own move-out counts for the raised units. */
  moveouts0to30: number;
  moveouts31to60: number;
  moveouts61to90: number;
}

export interface FacilityWaveInput {
  sitelinkId: string;
  name: string;
  waves: WaveMonth[];
  occupancy: { month: string; occupied: number }[];
  exits: { month: string; exits: number }[];
  /** Today, YYYY-MM-DD. */
  asOf: string;
}

export interface WindowResult {
  months: string[];
  exits: number;
  expected: number;
  /** Actual / expected. */
  ratio: number;
  /** ratio - 1, e.g. 0.2 = 20% more move-outs than usual. */
  excess: number;
  /** 95% range for the excess. */
  excessLow: number;
  excessHigh: number;
  perMonth: { month: string; exits: number; expected: number; ratio: number }[];
}

export interface WaveResponse {
  month: string;
  unitsRaised: number;
  dollarsAdded: number;
  avgPct: number;
  /** Share of raised units that were above the street rate. */
  aboveStreetShare: number | null;
  /** Raised units as a share of occupied units that month. */
  share: number | null;
  isWave: boolean;
  /** Our measure of what happened to move-outs; null when it can't be worked out yet. */
  response: WindowResult | null;
  /** Why `response` is null. */
  note: string | null;
  occupancyBefore: number | null;
  occupancyAfter: number | null;
  /** SiteLink's count of raised units that moved out within 90 days. */
  siteLinkMoveouts90: number;
}

export interface FacilityWaves {
  sitelinkId: string;
  name: string;
  referenceMonths: string[];
  referenceRate: number | null;
  referenceExits: number;
  waves: WaveResponse[];
}

const addMonths = (month: string, n: number): string => {
  const [y, m] = month.split("-").map(Number);
  const t = y! * 12 + (m! - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}-01`;
};

/** A month is complete once the whole month has passed. */
const isComplete = (month: string, asOf: string) => addMonths(month, 1) <= asOf;

function windowResult(
  months: string[],
  occ: Map<string, number>,
  exits: Map<string, number>,
  refRate: number,
  refExits: number
): WindowResult | null {
  let k = 0;
  let expected = 0;
  const perMonth: WindowResult["perMonth"] = [];
  for (const m of months) {
    const o = occ.get(m);
    const e = exits.get(m);
    if (o === undefined || e === undefined || o <= 0) return null;
    const exp = refRate * o;
    k += e;
    expected += exp;
    perMonth.push({ month: m, exits: e, expected: exp, ratio: exp > 0 ? e / exp : 0 });
  }
  if (expected <= 0) return null;
  const ratio = k / expected;
  // 95% range on the ratio, allowing for noise in both the window and the comparison months.
  const spread = 1.96 * Math.sqrt(1 / Math.max(k, 1) + 1 / Math.max(refExits, 1));
  return {
    months,
    exits: k,
    expected,
    ratio,
    excess: ratio - 1,
    excessLow: ratio * Math.exp(-spread) - 1,
    excessHigh: ratio * Math.exp(spread) - 1,
    perMonth,
  };
}

export function analyzeFacilityWaves(input: FacilityWaveInput): FacilityWaves {
  const occ = new Map(input.occupancy.map((o) => [o.month, o.occupied]));
  const exits = new Map(input.exits.map((e) => [e.month, e.exits]));
  const waveMonths = input.waves
    .filter((w) => w.unitsRaised >= MIN_WAVE_UNITS && w.unitsRaised >= MIN_WAVE_SHARE * (occ.get(w.month) ?? Infinity))
    .map((w) => w.month);

  // Comparison months: complete, with both occupancy and move-out data, and not
  // near any wave (the month before through two months after).
  const near = new Set<string>();
  for (const w of waveMonths) for (let d = -1; d <= 2; d++) near.add(addMonths(w, d));
  const referenceMonths = input.occupancy
    .map((o) => o.month)
    .filter((m) => m >= EXITS_FROM && isComplete(m, input.asOf) && exits.has(m) && !near.has(m))
    .sort();
  let refExits = 0;
  let refOcc = 0;
  for (const m of referenceMonths) {
    refExits += exits.get(m)!;
    refOcc += occ.get(m)!;
  }
  const referenceRate = referenceMonths.length >= MIN_REFERENCE_MONTHS && refOcc > 0 ? refExits / refOcc : null;

  const waves: WaveResponse[] = input.waves
    .filter((w) => w.unitsRaised > 0)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((w) => {
      const isWave = waveMonths.includes(w.month);
      const post = [0, 1, 2].map((d) => addMonths(w.month, d));
      const dataEnd = post.every((m) => isComplete(m, input.asOf));
      let response: WindowResult | null = null;
      let note: string | null = null;
      if (!isWave) note = "Too small to count as a wave.";
      else if (post[0]! < EXITS_FROM) note = "Before our move-out records begin.";
      else if (!dataEnd) note = "The three months after the increase aren't over yet.";
      else if (referenceRate === null) note = "Not enough comparison months without a wave.";
      else {
        response = windowResult(post, occ, exits, referenceRate, refExits);
        if (!response) note = "Missing occupancy or move-out data for those months.";
      }
      const before = occ.get(addMonths(w.month, -1)) ?? null;
      // Latest complete month at least three months on, else the latest we have.
      const later = [3, 2, 1].map((d) => addMonths(w.month, d)).find((m) => occ.has(m) && isComplete(m, input.asOf));
      const total = w.atStandard + w.belowStandard + w.aboveStandard;
      return {
        month: w.month,
        unitsRaised: w.unitsRaised,
        dollarsAdded: w.dollarsAdded,
        avgPct: w.avgPct,
        aboveStreetShare: total > 0 ? w.aboveStandard / total : null,
        share: occ.get(w.month) ? w.unitsRaised / occ.get(w.month)! : null,
        isWave,
        response,
        note,
        occupancyBefore: before,
        occupancyAfter: later ? (occ.get(later) ?? null) : null,
        siteLinkMoveouts90: w.moveouts0to30 + w.moveouts31to60 + w.moveouts61to90,
      };
    });

  return { sitelinkId: input.sitelinkId, name: input.name, referenceMonths, referenceRate, referenceExits: refExits, waves };
}

export interface PooledEvidence {
  /** Waves with a measured response. */
  waves: number;
  facilities: number;
  exits: number;
  expected: number;
  ratio: number;
  excess: number;
  excessLow: number;
  excessHigh: number;
  /** Middle of the individual waves' excess. */
  medianExcess: number;
}

/** Pool every measured wave: total move-outs seen vs total expected. */
export function pooledEvidence(all: FacilityWaves[]): PooledEvidence | null {
  let k = 0;
  let e = 0;
  let ref = 0;
  let n = 0;
  const excesses: number[] = [];
  const facilities = new Set<string>();
  for (const f of all) {
    let used = false;
    for (const w of f.waves) {
      if (!w.response) continue;
      k += w.response.exits;
      e += w.response.expected;
      n++;
      used = true;
      excesses.push(w.response.excess);
    }
    if (used) {
      ref += f.referenceExits;
      facilities.add(f.sitelinkId);
    }
  }
  if (!n || e <= 0) return null;
  const ratio = k / e;
  const spread = 1.96 * Math.sqrt(1 / Math.max(k, 1) + 1 / Math.max(ref, 1));
  excesses.sort((a, b) => a - b);
  const mid = Math.floor(excesses.length / 2);
  const median = excesses.length % 2 ? excesses[mid]! : (excesses[mid - 1]! + excesses[mid]!) / 2;
  return {
    waves: n,
    facilities: facilities.size,
    exits: k,
    expected: e,
    ratio,
    excess: ratio - 1,
    excessLow: ratio * Math.exp(-spread) - 1,
    excessHigh: ratio * Math.exp(spread) - 1,
    medianExcess: median,
  };
}
