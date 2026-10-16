import { dayNum, isoFromDayNum } from "./analytics";
import { SCHEDULE } from "./config";

/** One current tenant, as the batch builder sees them. No name/email. */
export interface BatchTenant {
  ledgerId: string;
  tenantId: string | null;
  unitId: string;
  unitName: string | null;
  unitType: string;
  size: string;
  rent: number;
  standardRate: number;
  rentLastChanged: string | null;
  leaseDate: string | null;
  /** Months of move-in discount; null = no matching move-in record found. */
  specialMonths: number | null;
  schedRent: number | null;
  schedRentStart: string | null;
  schedOut: string | null;
  chargeBalance: number | null;
  /** Baseline (no rate increase) chance of leaving in the next 30/60/90 days. */
  exit30: number;
  exit60: number;
  exit90: number;
}

export interface BatchRules {
  /** Date the new rent takes effect, YYYY-MM-DD. */
  effectiveDate: string;
  /** Wait after the special ends before the first increase. */
  firstWaitMonths: number;
  /** Wait after the last rent change for later increases. */
  repeatWaitMonths: number;
  /** Increase as a share of current rent (0.06 = 6%). */
  increasePct: number;
  /** Largest dollar increase per tenant; null = no cap. */
  maxIncreaseDollars: number | null;
  /** Smallest increase worth sending a notice for. */
  minIncreaseDollars: number;
  /** New rent may not exceed street x (1 + this). 0.25 = 25% over street. */
  maxOverStreetPct: number;
  excludeWithBalance: boolean;
  excludeScheduledMoveOut: boolean;
  excludedUnitTypes: string[];
  excludedSizes: string[];
  /** Cap on tenants in the suggested batch; null = everyone eligible. */
  targetCount: number | null;
}

export const DEFAULT_RULES: Omit<BatchRules, "effectiveDate"> = {
  firstWaitMonths: SCHEDULE.firstIncreaseMonthsAfterSpecial,
  repeatWaitMonths: SCHEDULE.nextIncreaseMonths,
  increasePct: 0.06,
  maxIncreaseDollars: 20,
  minIncreaseDollars: 3,
  maxOverStreetPct: 0.25,
  excludeWithBalance: true,
  excludeScheduledMoveOut: true,
  excludedUnitTypes: [],
  excludedSizes: [],
  targetCount: null,
};

export type ExclusionReason =
  | "not-yet-eligible"
  | "existing-scheduled-change"
  | "scheduled-move-out"
  | "open-balance"
  | "at-street-cap"
  | "increase-too-small"
  | "unit-type-excluded"
  | "size-excluded"
  | "missing-rate"
  | "over-target";

export const REASON_LABEL: Record<ExclusionReason, string> = {
  "not-yet-eligible": "Not eligible yet",
  "existing-scheduled-change": "Already has a scheduled change",
  "scheduled-move-out": "Scheduled to move out",
  "open-balance": "Open balance",
  "at-street-cap": "Already at the over-street cap",
  "increase-too-small": "Increase too small",
  "unit-type-excluded": "Unit type excluded",
  "size-excluded": "Size excluded",
  "missing-rate": "Missing rent or street rate",
  "over-target": "Over the batch size target",
};

export interface Candidate {
  tenant: BatchTenant;
  /** First date this tenant can take an increase under the schedule. */
  eligibleFrom: string | null;
  /** Never raised since move-in (the 6-months-after-special clock applies). */
  neverRaised: boolean;
  /** No move-in record, so the special was assumed to be none. */
  specialAssumed: boolean;
  newRent: number | null;
  increase: number;
  /** Rent / street rate, before the increase. */
  ratio: number | null;
  newRatio: number | null;
  /** Why this tenant is not in the suggested batch; null = suggested. */
  reason: ExclusionReason | null;
}

/** Add whole months to an ISO date, clamping to month end (Jan 31 + 1mo = Feb 28). */
export function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export function eligibleFrom(
  t: Pick<BatchTenant, "leaseDate" | "rentLastChanged" | "specialMonths">,
  rules: Pick<BatchRules, "firstWaitMonths" | "repeatWaitMonths">
): { date: string | null; neverRaised: boolean; specialAssumed: boolean } {
  if (!t.leaseDate) return { date: null, neverRaised: false, specialAssumed: false };
  const neverRaised = !t.rentLastChanged || t.rentLastChanged <= t.leaseDate;
  if (neverRaised) {
    const specialAssumed = t.specialMonths === null;
    const specialEnds = addMonthsIso(t.leaseDate, t.specialMonths ?? 0);
    return { date: addMonthsIso(specialEnds, rules.firstWaitMonths), neverRaised, specialAssumed };
  }
  return {
    date: addMonthsIso(t.rentLastChanged!, rules.repeatWaitMonths),
    neverRaised,
    specialAssumed: false,
  };
}

/** The new rent for a tenant under the guardrails, or why there is none. */
export function suggestRent(
  t: Pick<BatchTenant, "rent" | "standardRate">,
  rules: Pick<BatchRules, "increasePct" | "maxIncreaseDollars" | "minIncreaseDollars" | "maxOverStreetPct">
): { newRent: number | null; reason: ExclusionReason | null } {
  if (!(t.rent > 0) || !(t.standardRate > 0)) return { newRent: null, reason: "missing-rate" };
  let inc = t.rent * rules.increasePct;
  if (rules.maxIncreaseDollars !== null) inc = Math.min(inc, rules.maxIncreaseDollars);
  let target = Math.round(t.rent + inc);
  const ceiling = Math.floor(t.standardRate * (1 + rules.maxOverStreetPct));
  if (target > ceiling) target = ceiling;
  const increase = target - t.rent;
  if (ceiling <= t.rent) return { newRent: null, reason: "at-street-cap" };
  if (increase < rules.minIncreaseDollars) {
    // Capped down to something not worth a notice.
    return { newRent: null, reason: target < Math.round(t.rent + inc) ? "at-street-cap" : "increase-too-small" };
  }
  return { newRent: target, reason: null };
}

/**
 * Evaluate every tenant against the rules. Tenants that pass are ordered
 * lowest-risk first (least over street, then longest overdue); when a batch
 * size target is set, the first N of that order are suggested and the rest
 * are marked "over-target".
 */
export function evaluateCandidates(tenants: BatchTenant[], rules: BatchRules): Candidate[] {
  const out: Candidate[] = tenants.map((t) => {
    const el = eligibleFrom(t, rules);
    const ratio = t.rent > 0 && t.standardRate > 0 ? t.rent / t.standardRate : null;
    const base: Candidate = {
      tenant: t,
      eligibleFrom: el.date,
      neverRaised: el.neverRaised,
      specialAssumed: el.specialAssumed,
      newRent: null,
      increase: 0,
      ratio,
      newRatio: null,
      reason: null,
    };
    const exclude = (reason: ExclusionReason): Candidate => ({ ...base, reason });

    if (rules.excludedUnitTypes.includes(t.unitType)) return exclude("unit-type-excluded");
    if (rules.excludedSizes.includes(t.size)) return exclude("size-excluded");
    if (t.schedRent !== null && t.schedRentStart) return exclude("existing-scheduled-change");
    if (rules.excludeScheduledMoveOut && t.schedOut) return exclude("scheduled-move-out");
    if (rules.excludeWithBalance && (t.chargeBalance ?? 0) > 0.5) return exclude("open-balance");
    if (!el.date || el.date > rules.effectiveDate) return exclude("not-yet-eligible");

    const s = suggestRent(t, rules);
    if (s.reason || s.newRent === null) return exclude(s.reason ?? "missing-rate");
    return {
      ...base,
      newRent: s.newRent,
      increase: s.newRent - t.rent,
      newRatio: s.newRent / t.standardRate,
    };
  });

  if (rules.targetCount !== null) {
    const ok = out
      .filter((c) => c.reason === null)
      .sort(
        (a, b) =>
          (a.ratio ?? 9) - (b.ratio ?? 9) ||
          (a.eligibleFrom ?? "").localeCompare(b.eligibleFrom ?? "") ||
          a.tenant.ledgerId.localeCompare(b.tenant.ledgerId)
      );
    for (const c of ok.slice(rules.targetCount)) c.reason = "over-target";
  }
  return out;
}

export interface BatchSummary {
  count: number;
  monthlyGain: number;
  annualGain: number;
  avgIncreasePct: number;
  avgIncreaseDollars: number;
  /** Tenants in the batch already paying more than street, before / after. */
  overStreetBefore: number;
  overStreetAfter: number;
  /** Expected move-outs from this group with NO increase (baseline). */
  baselineExits: { d30: number; d60: number; d90: number };
  /** Tenants whose rent, if lost and never replaced, equals the monthly gain. */
  breakEvenTenants: number;
}

export function summarizeBatch(items: { tenant: BatchTenant; newRent: number }[]): BatchSummary {
  const count = items.length;
  const gain = items.reduce((a, i) => a + (i.newRent - i.tenant.rent), 0);
  const oldRent = items.reduce((a, i) => a + i.tenant.rent, 0);
  const exits = { d30: 0, d60: 0, d90: 0 };
  let before = 0;
  let after = 0;
  for (const i of items) {
    exits.d30 += i.tenant.exit30;
    exits.d60 += i.tenant.exit60;
    exits.d90 += i.tenant.exit90;
    if (i.tenant.rent > i.tenant.standardRate) before++;
    if (i.newRent > i.tenant.standardRate) after++;
  }
  const avgRent = count ? oldRent / count : 0;
  return {
    count,
    monthlyGain: gain,
    annualGain: gain * 12,
    avgIncreasePct: oldRent ? gain / oldRent : 0,
    avgIncreaseDollars: count ? gain / count : 0,
    overStreetBefore: before,
    overStreetAfter: after,
    baselineExits: exits,
    breakEvenTenants: avgRent ? gain / avgRent : 0,
  };
}

/** First day of the month that is at least `minDays` after `fromIso`. */
export function firstOfMonthAtLeast(fromIso: string, minDays: number): string {
  const earliest = isoFromDayNum(dayNum(fromIso) + minDays);
  const [y, m, d] = earliest.split("-").map(Number);
  return d === 1 ? earliest : addMonthsIso(`${y}-${String(m).padStart(2, "0")}-01`, 1);
}
