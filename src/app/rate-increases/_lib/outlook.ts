/**
 * Income outlook: a month-by-month simulation of a store's rental income.
 *
 * Every current tenant can leave in any month, with the chance taken from the
 * length-of-stay model. When a unit empties it goes back into the pool of
 * vacant units; new tenants arrive at the store's recent move-in pace (with
 * its seasonal pattern), fill a random vacant unit of that type, and pay about
 * the street rate. So a tenant paying well above street, when they leave, is
 * replaced by someone paying street: the premium is lost for good. A tenant
 * paying below street is replaced at a gain.
 *
 * The simulation is repeated hundreds of times with random draws; the spread
 * across runs is the range shown on the chart. How much more likely tenants
 * far above street are to leave is not measured anywhere, so it is an
 * explicit setting (and the three settings are run side by side).
 */

export const DAYS_PER_MONTH = 30.44;

/** Where a tenant's rent sits against street (rent / street). */
export const PREMIUM_BANDS = [
  { key: "below", label: "Below street", lo: 0, hi: 0.995 },
  { key: "at", label: "Street to 10% over", lo: 0.995, hi: 1.1 },
  { key: "over10", label: "10–25% over", lo: 1.1, hi: 1.25 },
  { key: "over25", label: "25–50% over", lo: 1.25, hi: 1.5 },
  { key: "over50", label: "50–100% over", lo: 1.5, hi: 2 },
  { key: "twice", label: "Twice street or more", lo: 2, hi: Infinity },
] as const;

export type BandKey = (typeof PREMIUM_BANDS)[number]["key"];

export function bandIndex(rent: number, street: number): number {
  if (!(street > 0)) return 1;
  const ratio = rent / street;
  const i = PREMIUM_BANDS.findIndex((b) => ratio >= b.lo && ratio < b.hi);
  return i < 0 ? PREMIUM_BANDS.length - 1 : i;
}

/**
 * How much more (or less) likely each band is to leave, relative to a tenant
 * near street. Assumptions, not measurements. The overall number of move-outs
 * is held at what the length-of-stay model says; these only shift WHO leaves.
 */
export type PremiumRisk = "none" | "moderate" | "strong";

export const RISK_MULTIPLIERS: Record<PremiumRisk, number[]> = {
  none: [1, 1, 1, 1, 1, 1],
  moderate: [0.85, 1, 1.15, 1.3, 1.5, 1.7],
  strong: [0.7, 1, 1.3, 1.7, 2.2, 2.8],
};

export const RISK_LABEL: Record<PremiumRisk, string> = {
  none: "Everyone equally likely to leave",
  moderate: "Moderately more likely when far over street",
  strong: "Much more likely when far over street",
};

export interface OutlookTenant {
  ledgerId: string;
  unitType: string;
  rent: number;
  /** Street rate for the unit (standard or push, per the page setting). */
  street: number;
  tenureDays: number;
}

export interface VacantUnit {
  unitType: string;
  street: number;
}

export interface OutlookBatch {
  /** ledger ID -> new rent */
  raises: Record<string, number>;
  /** 1-based month in which the new rents start. */
  effectiveMonth: number;
  /** Extra chance of leaving for the raised tenants, e.g. 0.25 = 25% more. */
  exitUplift: number;
  /** How many months from the effective month the extra chance lasts. */
  upliftMonths: number;
}

export interface OutlookInput {
  tenants: OutlookTenant[];
  vacant: VacantUnit[];
  /** Chance a tenant of this type, `tenureDays` in, leaves within `horizonDays`. */
  exitProb: (unitType: string, tenureDays: number, horizonDays: number) => number;
  /** Expected new tenants in a given 1-based month, for a unit type. */
  moveInsPerMonth: (unitType: string, month: number) => number;
  /** New tenants' rent as a share of the unit's street rate. */
  replacementRatio: number;
  horizon: number;
  sims: number;
  seed: number;
  risk: PremiumRisk;
  batch?: OutlookBatch | null;
  /**
   * Most of a unit type's rentable units that can be occupied (0.95 = 95%), or
   * today's level if it is already higher. Stores plateau: some units are
   * always in turnover or hard to rent. Defaults to no ceiling.
   */
  maxOccupancy?: number;
}

export interface Band {
  p10: number;
  p50: number;
  p90: number;
  mean: number;
}

export interface BandStat {
  key: BandKey;
  label: string;
  tenants: number;
  rent: number;
  /** Rent above street, summed. */
  premium: number;
  /** Average number of these tenants who leave within the horizon. */
  expectedExits: number;
  /** Average premium that walks out the door with them (rent above street). */
  premiumLost: number;
  /** Average change in monthly rent when their units are re-let (positive = rent falls). */
  turnoverLoss: number;
}

export interface OutlookRun {
  startIncome: number;
  income: Band[];
  cumulative: Band[];
  occupied: Band[];
  bands: BandStat[];
  /** Average move-outs of today's tenants over the horizon. */
  expectedExits: number;
}

/* ---------- random numbers ---------- */

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(rng: () => number, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda < 30) {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L);
    return k - 1;
  }
  // Large means: normal approximation (Box-Muller).
  const z = Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
}

const MAX_MONTHLY_EXIT = 0.95;

function summarize(values: number[]): Band {
  const s = [...values].sort((a, b) => a - b);
  const at = (p: number) => s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]!;
  return { p10: at(0.1), p50: at(0.5), p90: at(0.9), mean: values.reduce((a, b) => a + b, 0) / values.length };
}

/* ---------- the simulation ---------- */

export function simulateOutlook(input: OutlookInput): OutlookRun {
  const { tenants, horizon: H, sims } = input;
  const D = DAYS_PER_MONTH;
  const n = tenants.length;
  const mult = RISK_MULTIPLIERS[input.risk];

  const types = Array.from(new Set([...tenants.map((t) => t.unitType), ...input.vacant.map((v) => v.unitType)]));
  const typeIdx = new Map(types.map((t, i) => [t, i]));
  const tIdx = tenants.map((t) => typeIdx.get(t.unitType)!);
  const band = tenants.map((t) => bandIndex(t.rent, t.street));

  // Monthly chance of leaving for each current tenant, from the stay model...
  const qBase: Float64Array[] = tenants.map((t) => {
    const row = new Float64Array(H);
    for (let m = 0; m < H; m++) row[m] = input.exitProb(t.unitType, t.tenureDays + m * D, D);
    return row;
  });
  // ...reshaped toward tenants far over street, then rescaled per unit type so
  // the number of move-outs stays what the stay model says.
  const scale = types.map((_, ti) => {
    let before = 0;
    let after = 0;
    for (let i = 0; i < n; i++) {
      if (tIdx[i] !== ti) continue;
      before += qBase[i]![0]!;
      after += qBase[i]![0]! * mult[band[i]!]!;
    }
    return after > 0 ? before / after : 1;
  });
  const q: Float64Array[] = qBase.map((row, i) => {
    const k = mult[band[i]!]! * scale[tIdx[i]!]!;
    return row.map((v) => Math.min(MAX_MONTHLY_EXIT, v * k)) as Float64Array;
  });

  // New tenants: their chance of leaving by months since they arrived.
  const newBand = bandIndex(input.replacementRatio, 1);
  const qNew: Float64Array[] = types.map((type, ti) => {
    const row = new Float64Array(H + 1);
    for (let a = 0; a <= H; a++) {
      row[a] = Math.min(MAX_MONTHLY_EXIT, input.exitProb(type, a * D, D) * mult[newBand]! * scale[ti]!);
    }
    return row;
  });

  const batchIdx = new Map<number, number>(); // tenant index -> new rent
  if (input.batch) {
    tenants.forEach((t, i) => {
      const nr = input.batch!.raises[t.ledgerId];
      if (nr !== undefined) batchIdx.set(i, nr);
    });
  }

  const startIncome = tenants.reduce((a, t) => a + t.rent, 0);

  // Occupancy ceiling per unit type.
  const occ0 = types.map((_, ti) => tIdx.filter((x) => x === ti).length);
  const vacant0 = types.map((ty) => input.vacant.filter((v) => v.unitType === ty).length);
  const maxOcc = types.map((_, ti) =>
    Math.max(occ0[ti]!, Math.ceil((input.maxOccupancy ?? 1) * (occ0[ti]! + vacant0[ti]!) - 1e-9))
  );

  // Today's mix, by band.
  const bandStats = PREMIUM_BANDS.map((b, bi) => {
    const members = tenants.filter((_, i) => band[i] === bi);
    return {
      key: b.key,
      label: b.label,
      tenants: members.length,
      rent: members.reduce((a, t) => a + t.rent, 0),
      premium: members.reduce((a, t) => a + Math.max(0, t.rent - t.street), 0),
      exits: 0,
      premiumLost: 0,
      turnoverLoss: 0,
    };
  });

  const incomeBy: number[][] = Array.from({ length: H }, () => new Array(sims));
  const cumBy: number[][] = Array.from({ length: H }, () => new Array(sims));
  const occBy: number[][] = Array.from({ length: H }, () => new Array(sims));
  let exitsTotal = 0;

  const rng = mulberry32(input.seed);
  for (let s = 0; s < sims; s++) {
    const alive = new Uint8Array(n).fill(1);
    const rent = Float64Array.from(tenants.map((t) => t.rent));
    // Vacant pool: street rate of each empty unit, per type.
    const pools: number[][] = types.map(() => []);
    for (const v of input.vacant) pools[typeIdx.get(v.unitType)!]!.push(v.street);
    // Tenants who arrived during the run.
    const newType: number[] = [];
    const newRent: number[] = [];
    const newAge: number[] = [];
    const newAlive: number[] = [];
    const occType = occ0.slice();

    let cum = 0;
    for (let m = 0; m < H; m++) {
      const month = m + 1;
      const b = input.batch;
      if (b && month === b.effectiveMonth) {
        for (const [i, nr] of batchIdx) if (alive[i]) rent[i] = nr;
      }
      const upliftOn = !!b && month >= b.effectiveMonth && month < b.effectiveMonth + b.upliftMonths;

      let income = 0;
      let occupied = 0;
      for (let i = 0; i < n; i++) {
        if (!alive[i]) continue;
        let p = q[i]![m]!;
        if (upliftOn && batchIdx.has(i)) p = Math.min(MAX_MONTHLY_EXIT, p * (1 + b!.exitUplift));
        if (rng() < p) {
          alive[i] = 0;
          occType[tIdx[i]!]!--;
          income += 0.5 * rent[i]!; // leaves mid-month
          const street = tenants[i]!.street;
          pools[tIdx[i]!]!.push(street);
          const bs = bandStats[band[i]!]!;
          bs.exits += 1;
          bs.premiumLost += Math.max(0, rent[i]! - street);
          bs.turnoverLoss += rent[i]! - street * input.replacementRatio;
          exitsTotal += 1;
        } else {
          income += rent[i]!;
          occupied++;
        }
      }
      for (let j = 0; j < newType.length; j++) {
        if (!newAlive[j]) continue;
        if (rng() < qNew[newType[j]!]![Math.min(H, newAge[j]!)]!) {
          newAlive[j] = 0;
          occType[newType[j]!]!--;
          income += 0.5 * newRent[j]!;
          pools[newType[j]!]!.push(newRent[j]! / input.replacementRatio);
        } else {
          income += newRent[j]!;
          occupied++;
        }
        newAge[j]!++;
      }
      // New tenants move in at this type's pace, into vacant units.
      for (let ti = 0; ti < types.length; ti++) {
        const pool = pools[ti]!;
        const room = Math.max(0, maxOcc[ti]! - occType[ti]!);
        const arrivals = Math.min(pool.length, room, poisson(rng, input.moveInsPerMonth(types[ti]!, month)));
        for (let k = 0; k < arrivals; k++) {
          const pick = Math.floor(rng() * pool.length);
          const street = pool[pick]!;
          pool[pick] = pool[pool.length - 1]!;
          pool.pop();
          const r = street * input.replacementRatio;
          newType.push(ti);
          newRent.push(r);
          newAge.push(0);
          newAlive.push(1);
          occType[ti]!++;
          income += 0.5 * r; // arrives mid-month
          occupied++;
        }
      }
      cum += income;
      incomeBy[m]![s] = income;
      cumBy[m]![s] = cum;
      occBy[m]![s] = occupied;
    }
  }

  return {
    startIncome,
    income: incomeBy.map(summarize),
    cumulative: cumBy.map(summarize),
    occupied: occBy.map(summarize),
    bands: bandStats.map((b) => ({
      key: b.key,
      label: b.label,
      tenants: b.tenants,
      rent: b.rent,
      premium: b.premium,
      expectedExits: b.exits / sims,
      premiumLost: b.premiumLost / sims,
      turnoverLoss: b.turnoverLoss / sims,
    })),
    expectedExits: exitsTotal / sims,
  };
}
