import { dayNum, isoFromDayNum } from "./analytics";
import { SCHEDULE } from "./config";
import type { StreetBasis } from "./street";

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
  /** SiteLink's push rate for the unit; 0 when none is on file. */
  pushRate: number;
  rentLastChanged: string | null;
  leaseDate: string | null;
  /** Months of move-in discount; null = no matching move-in record found. */
  specialMonths: number | null;
  schedRent: number | null;
  schedRentStart: string | null;
  schedOut: string | null;
  chargeBalance: number | null;
  /** In a finalized batch whose new rent the rent roll doesn't show yet. */
  inOtherBatch: boolean;
  /** Baseline (no rate increase) chance of leaving in the next 30/60/90 days. */
  exit30: number;
  exit60: number;
  exit90: number;
}

/**
 * How a tenant becomes eligible:
 * - "schedule": first increase N months after the move-in special ends, then
 *   every M months from the last rent change.
 * - "tenure": simply here at least N months by the effective date (optionally
 *   only if never raised since move-in, or not raised within M months).
 */
export type EligibilityMode = "schedule" | "tenure";

export interface BatchRules {
  /** Date the new rent takes effect, YYYY-MM-DD. */
  effectiveDate: string;
  /** Which rate counts as street: the standard rate or the push rate. */
  streetBasis: StreetBasis;
  eligibility: EligibilityMode;

  // --- schedule mode
  /** Wait after the special ends before the first increase. */
  firstWaitMonths: number;
  /** Wait after the last rent change for later increases. */
  repeatWaitMonths: number;

  // --- tenure mode
  /** Months in the unit by the effective date. */
  minTenureMonths: number;
  /** Only tenants whose rent hasn't changed since move-in. */
  onlyNeverRaised: boolean;
  /** Skip tenants whose rent changed within this many months (0 = ignore). */
  minMonthsSinceLastChange: number;

  /** Increase as a share of current rent (0.06 = 6%). */
  increasePct: number;

  // --- guardrails; null / 0 / false = off
  /** Largest dollar increase per tenant. */
  maxIncreaseDollars: number | null;
  /** Smallest increase worth sending a notice for. */
  minIncreaseDollars: number;
  /** Raise tenants who are below street all the way to street if that takes
   *  more than the percentage. Tenants at or above street get the percentage. */
  raiseToStreet: boolean;
  /** New rent may not exceed street x (1 + this). 0.25 = 25% over street. */
  maxOverStreetPct: number | null;
  excludeWithBalance: boolean;
  excludeScheduledMoveOut: boolean;
  excludedUnitTypes: string[];
  excludedSizes: string[];
  /** Cap on tenants in the suggested batch; null = everyone eligible. */
  targetCount: number | null;
}

type RuleSet = Omit<BatchRules, "effectiveDate" | "streetBasis">;

/** The original plan: after the special ends, then every 9 months, with guardrails. */
export const SCHEDULE_RULES: RuleSet = {
  eligibility: "schedule",
  firstWaitMonths: SCHEDULE.firstIncreaseMonthsAfterSpecial,
  repeatWaitMonths: SCHEDULE.nextIncreaseMonths,
  minTenureMonths: 6,
  onlyNeverRaised: false,
  minMonthsSinceLastChange: 0,
  increasePct: 0.06,
  maxIncreaseDollars: 20,
  minIncreaseDollars: 3,
  raiseToStreet: false,
  maxOverStreetPct: 0.25,
  excludeWithBalance: true,
  excludeScheduledMoveOut: true,
  excludedUnitTypes: [],
  excludedSizes: [],
  targetCount: null,
};

/** A flat 6% for everyone here 6+ months, no guardrails. */
export const ACROSS_THE_BOARD_RULES: RuleSet = {
  ...SCHEDULE_RULES,
  eligibility: "tenure",
  minTenureMonths: 6,
  onlyNeverRaised: false,
  minMonthsSinceLastChange: 0,
  maxIncreaseDollars: null,
  minIncreaseDollars: 0,
  maxOverStreetPct: null,
  excludeWithBalance: false,
  excludeScheduledMoveOut: false,
};

/** The monthly follow-up: tenants who have reached 6 months and never been raised. */
export const NEW_TENANT_RULES: RuleSet = {
  ...ACROSS_THE_BOARD_RULES,
  onlyNeverRaised: true,
};

export type PolicyKey = "across-the-board" | "new-tenants" | "schedule";

export const POLICIES: Record<PolicyKey, { label: string; description: string; rules: RuleSet }> = {
  "across-the-board": {
    label: "Across the board",
    description: "Flat increase for everyone who has been here the minimum time, no matter when they were last raised.",
    rules: ACROSS_THE_BOARD_RULES,
  },
  "new-tenants": {
    label: "New tenants at 6 months",
    description: "Run monthly: tenants who have just reached 6 months and have never had an increase.",
    rules: NEW_TENANT_RULES,
  },
  schedule: {
    label: "After special, then every 9 months",
    description: "The original schedule, with the guardrails on.",
    rules: SCHEDULE_RULES,
  },
};

/** What to fill in for any rule a saved batch predates. */
export const LEGACY_RULES: Omit<BatchRules, "effectiveDate"> = { ...SCHEDULE_RULES, streetBasis: "standard" };

export type ExclusionReason =
  | "not-yet-eligible"
  | "already-raised"
  | "in-other-batch"
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
  "already-raised": "Already had an increase",
  "in-other-batch": "Already in another batch",
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
  /** Set when the raise-to-street option decided the new rent: "full" if it
   *  reached street, "capped" if a dollar cap stopped it short. */
  streetLift: "full" | "capped" | null;
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

/**
 * Eligibility under whichever mode the rules use. `blocked` is set when the
 * tenant can never qualify under the rules (e.g. "only never-raised tenants"
 * and this one has been raised), as opposed to merely not yet.
 */
export function eligibility(
  t: Pick<BatchTenant, "leaseDate" | "rentLastChanged" | "specialMonths">,
  rules: Pick<
    BatchRules,
    | "eligibility"
    | "firstWaitMonths"
    | "repeatWaitMonths"
    | "minTenureMonths"
    | "onlyNeverRaised"
    | "minMonthsSinceLastChange"
  >
): { date: string | null; neverRaised: boolean; specialAssumed: boolean; blocked: ExclusionReason | null } {
  if (rules.eligibility === "schedule") return { ...eligibleFrom(t, rules), blocked: null };

  if (!t.leaseDate) return { date: null, neverRaised: false, specialAssumed: false, blocked: null };
  const neverRaised = !t.rentLastChanged || t.rentLastChanged <= t.leaseDate;
  if (rules.onlyNeverRaised && !neverRaised) {
    return { date: null, neverRaised, specialAssumed: false, blocked: "already-raised" };
  }
  let date = addMonthsIso(t.leaseDate, rules.minTenureMonths);
  if (!neverRaised && rules.minMonthsSinceLastChange > 0) {
    const afterChange = addMonthsIso(t.rentLastChanged!, rules.minMonthsSinceLastChange);
    if (afterChange > date) date = afterChange;
  }
  return { date, neverRaised, specialAssumed: false, blocked: null };
}

/** The new rent for a tenant under the guardrails, or why there is none. */
export function suggestRent(
  t: Pick<BatchTenant, "rent" | "standardRate">,
  rules: Pick<
    BatchRules,
    "increasePct" | "maxIncreaseDollars" | "minIncreaseDollars" | "maxOverStreetPct" | "raiseToStreet"
  >
): { newRent: number | null; reason: ExclusionReason | null; streetLift: "full" | "capped" | null } {
  const none = (reason: ExclusionReason) => ({ newRent: null, reason, streetLift: null });
  if (!(t.rent > 0)) return none("missing-rate");
  // Street rate is only needed when something is measured against it.
  if ((rules.maxOverStreetPct !== null || rules.raiseToStreet) && !(t.standardRate > 0)) return none("missing-rate");

  let inc = t.rent * rules.increasePct;
  if (rules.maxIncreaseDollars !== null) inc = Math.min(inc, rules.maxIncreaseDollars);
  const wanted = Math.round(t.rent + inc);
  let target = wanted;

  // Street floor: the percentage, or whatever it takes to reach street if more.
  // A dollar cap, if on, still limits it. Street is rounded up to a whole dollar.
  let streetLift: "full" | "capped" | null = null;
  if (rules.raiseToStreet) {
    const street = Math.ceil(t.standardRate - 1e-9);
    const reachable = rules.maxIncreaseDollars !== null ? Math.min(street, t.rent + rules.maxIncreaseDollars) : street;
    if (reachable > target) {
      target = reachable;
      streetLift = reachable >= street ? "full" : "capped";
    }
  }

  const beforeCap = target;
  if (rules.maxOverStreetPct !== null) {
    const ceiling = Math.floor(t.standardRate * (1 + rules.maxOverStreetPct));
    if (ceiling <= t.rent) return none("at-street-cap");
    if (target > ceiling) target = ceiling;
  }
  // Always at least a dollar: a "0" increase is not an increase.
  if (target - t.rent < Math.max(1, rules.minIncreaseDollars)) {
    return none(target < beforeCap ? "at-street-cap" : "increase-too-small");
  }
  return { newRent: target, reason: null, streetLift: target === beforeCap ? streetLift : null };
}

/**
 * Evaluate every tenant against the rules. Tenants that pass are ordered
 * lowest-risk first (least over street, then longest overdue); when a batch
 * size target is set, the first N of that order are suggested and the rest
 * are marked "over-target".
 */
export function evaluateCandidates(tenants: BatchTenant[], rules: BatchRules): Candidate[] {
  const out: Candidate[] = tenants.map((t) => {
    const el = eligibility(t, rules);
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
      streetLift: null,
      reason: null,
    };
    const exclude = (reason: ExclusionReason): Candidate => ({ ...base, reason });

    if (rules.excludedUnitTypes.includes(t.unitType)) return exclude("unit-type-excluded");
    if (rules.excludedSizes.includes(t.size)) return exclude("size-excluded");
    if (t.schedRent !== null && t.schedRentStart) return exclude("existing-scheduled-change");
    if (rules.excludeScheduledMoveOut && t.schedOut) return exclude("scheduled-move-out");
    if (t.inOtherBatch) return exclude("in-other-batch");
    if (rules.excludeWithBalance && (t.chargeBalance ?? 0) > 0.5) return exclude("open-balance");
    if (el.blocked) return exclude(el.blocked);
    if (!el.date || el.date > rules.effectiveDate) return exclude("not-yet-eligible");

    const s = suggestRent(t, rules);
    if (s.reason || s.newRent === null) return exclude(s.reason ?? "missing-rate");
    return {
      ...base,
      newRent: s.newRent,
      increase: s.newRent - t.rent,
      newRatio: t.standardRate > 0 ? s.newRent / t.standardRate : null,
      streetLift: s.streetLift,
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

/** A saved batch line, as much of it as the reopen check needs. */
export interface SavedLine {
  ledgerId: string;
  unitName: string | null;
  oldRent: number;
  newRent: number;
}

/** What changed for a saved batch's tenants in a newer rent roll. */
export interface ReopenChanges {
  /** No longer a tenant in the rent roll; dropped from the batch. */
  movedOut: SavedLine[];
  /** Rent differs from when the batch was saved, but the saved new rent is still an increase. */
  rentChanged: { line: SavedLine; rent: number }[];
  /** Rent is now at or above the saved new rent, so it is no longer an increase. */
  noLongerIncrease: { line: SavedLine; rent: number }[];
}

export function reopenChanges(lines: SavedLine[], tenants: BatchTenant[]): ReopenChanges {
  const byLedger = new Map(tenants.map((t) => [t.ledgerId, t]));
  const out: ReopenChanges = { movedOut: [], rentChanged: [], noLongerIncrease: [] };
  for (const line of lines) {
    const t = byLedger.get(line.ledgerId);
    if (!t) out.movedOut.push(line);
    else if (line.newRent <= t.rent) out.noLongerIncrease.push({ line, rent: t.rent });
    else if (Math.abs(t.rent - line.oldRent) > 0.005) out.rentChanged.push({ line, rent: t.rent });
  }
  return out;
}

export const hasReopenChanges = (c: ReopenChanges) =>
  c.movedOut.length + c.rentChanged.length + c.noLongerIncrease.length > 0;
