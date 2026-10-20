/**
 * Facilities the rate-increase tools are switched on for. Columbus was the
 * pilot; Sylvania was added next. Adding a store is one line here (its
 * SiteLink ID), plus uploading that store's rent roll on the page.
 */
export const RATE_INCREASE_FACILITY_IDS = ["33884", "50552"] as const;

export function isRateIncreaseFacility(sitelinkId: string): boolean {
  return (RATE_INCREASE_FACILITY_IDS as readonly string[]).includes(sitelinkId);
}

/** Our move-out records begin here; stays that ended earlier are invisible
 *  to us, which the survival math accounts for (left-truncation). */
export const OBSERVATION_START = "2024-01-01";

/** Rate-increase schedule, from the pilot plan. Used by later phases. */
export const SCHEDULE = {
  firstIncreaseMonthsAfterSpecial: 6,
  nextIncreaseMonths: 9,
  noticeDays: 30,
} as const;

/** Demand-health status cutoffs on the coverage ratio (expected move-ins /
 *  expected move-outs). v1 values, to be tuned against real results. */
export const DEMAND_THRESHOLDS = { healthy: 1.1, watch: 0.9 } as const;
