/**
 * Kaplan-Meier survival analysis for tenant length of stay.
 *
 * Handles the two things that make naive "average stay of people who left"
 * wrong:
 *  - right-censoring: current tenants haven't left yet; they count as "still
 *    here at tenure X", not as stays that ended.
 *  - left-truncation (delayed entry): our move-out records only begin on a
 *    given date, so a tenant who moved in years earlier only enters the risk
 *    set at the tenure they had when observation began. Anyone who left
 *    before observation began is (correctly) absent.
 */

export interface StayRecord {
  /** Tenure in days when this tenant started being observed (0 for tenants
   *  who moved in during the observation window). */
  entry: number;
  /** Tenure in days at move-out, or at the snapshot date if still here. */
  time: number;
  /** true = moved out (observed exit), false = still here (censored). */
  event: boolean;
}

export interface KMPoint {
  /** Tenure in days at which an event occurred. */
  t: number;
  /** Survival probability just after t. */
  s: number;
  lo: number;
  hi: number;
  atRisk: number;
  events: number;
}

export interface KMCurve {
  points: KMPoint[];
  nStays: number;
  nEvents: number;
  /** Largest event time that still has a trustworthy risk set. Beyond this
   *  the curve is extrapolated with a constant tail hazard. */
  reliableMaxT: number;
  /** Daily hazard applied beyond reliableMaxT. */
  tailHazard: number;
}

const MIN_AT_RISK = 20;
const TAIL_WINDOW_DAYS = 365;

export function kaplanMeier(stays: StayRecord[]): KMCurve {
  const valid = stays.filter((s) => s.time > s.entry && Number.isFinite(s.time));
  const eventTimes = Array.from(
    new Set(valid.filter((s) => s.event).map((s) => s.time))
  ).sort((a, b) => a - b);

  const points: KMPoint[] = [];
  let surv = 1;
  let greenwood = 0;

  for (const t of eventTimes) {
    let atRisk = 0;
    let events = 0;
    for (const s of valid) {
      // At risk at t if observation began before t and hasn't ended before t.
      if (s.entry < t && s.time >= t) {
        atRisk++;
        if (s.event && s.time === t) events++;
      }
    }
    if (atRisk === 0 || events === 0) continue;
    surv *= 1 - events / atRisk;
    if (atRisk > events) greenwood += events / (atRisk * (atRisk - events));
    const se = surv * Math.sqrt(greenwood);
    points.push({
      t,
      s: surv,
      lo: Math.max(0, surv - 1.96 * se),
      hi: Math.min(1, surv + 1.96 * se),
      atRisk,
      events,
    });
  }

  const reliable = points.filter((p) => p.atRisk >= MIN_AT_RISK);
  const reliableMaxT = reliable.length ? reliable[reliable.length - 1].t : 0;
  const tailHazard = estimateTailHazard(points, reliableMaxT);

  return {
    points,
    nStays: valid.length,
    nEvents: valid.filter((s) => s.event).length,
    reliableMaxT,
    tailHazard,
  };
}

function stepSurvival(points: KMPoint[], t: number): number {
  let s = 1;
  for (const p of points) {
    if (p.t <= t) s = p.s;
    else break;
  }
  return s;
}

function estimateTailHazard(points: KMPoint[], reliableMaxT: number): number {
  if (!reliableMaxT) return 0;
  const sEnd = stepSurvival(points, reliableMaxT);
  const sStart = stepSurvival(points, Math.max(0, reliableMaxT - TAIL_WINDOW_DAYS));
  if (sEnd <= 0 || sStart <= 0 || sEnd >= sStart) return 0;
  return Math.log(sStart / sEnd) / Math.min(TAIL_WINDOW_DAYS, reliableMaxT);
}

/** S(t): chance a tenancy lasts beyond t days. Extrapolates past the
 *  reliable range with a constant hazard. */
export function survivalAt(curve: KMCurve, t: number): number {
  if (t <= 0) return 1;
  if (!curve.points.length) return 1;
  if (t <= curve.reliableMaxT || !curve.reliableMaxT) {
    return stepSurvival(curve.points, t);
  }
  const base = stepSurvival(curve.points, curve.reliableMaxT);
  return base * Math.exp(-curve.tailHazard * (t - curve.reliableMaxT));
}

/** Chance a tenant who has already stayed `tenureDays` leaves within the
 *  next `horizonDays`:  1 - S(a+h)/S(a). */
export function exitProbability(curve: KMCurve, tenureDays: number, horizonDays: number): number {
  const sNow = survivalAt(curve, tenureDays);
  if (sNow <= 0) return 1;
  const sLater = survivalAt(curve, tenureDays + horizonDays);
  return Math.min(1, Math.max(0, 1 - sLater / sNow));
}

/** Median stay in days, or null if the curve never drops to 50% within the
 *  reliable range. */
export function medianStay(curve: KMCurve): number | null {
  for (const p of curve.points) {
    if (p.t > curve.reliableMaxT) break;
    if (p.s <= 0.5) return p.t;
  }
  return null;
}

/** Restricted mean stay: expected days stayed within `horizonDays` (area
 *  under the survival curve). Unlike a plain average of leavers, this
 *  accounts for tenants who are still here. */
export function restrictedMeanStay(curve: KMCurve, horizonDays: number): number {
  if (!curve.points.length) return 0;
  let area = 0;
  let prevT = 0;
  let prevS = 1;
  for (const p of curve.points) {
    if (p.t >= horizonDays) break;
    area += prevS * (p.t - prevT);
    prevT = p.t;
    prevS = p.s;
  }
  // Remainder to horizon: flat until reliableMaxT, then decaying.
  const flatEnd = Math.min(horizonDays, Math.max(curve.reliableMaxT, prevT));
  if (flatEnd > prevT) {
    area += prevS * (flatEnd - prevT);
    prevT = flatEnd;
  }
  if (horizonDays > prevT) {
    if (curve.tailHazard > 0) {
      const dt = horizonDays - prevT;
      area += (prevS * (1 - Math.exp(-curve.tailHazard * dt))) / curve.tailHazard;
    } else {
      area += prevS * (horizonDays - prevT);
    }
  }
  return area;
}

/** Wilson score interval for a proportion k/n. */
export function wilsonInterval(k: number, n: number, z = 1.96): { lo: number; hi: number } {
  if (n === 0) return { lo: 0, hi: 0 };
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { lo: Math.max(0, center - half), hi: Math.min(1, center + half) };
}
