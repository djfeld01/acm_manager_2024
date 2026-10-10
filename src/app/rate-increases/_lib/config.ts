/**
 * Facilities on (or piloting) the faster rate-increase schedule. Columbus is
 * the pilot. Kept as a list so adding a facility later is a one-line change.
 */
export const PILOT_FACILITY_IDS = ["33884"] as const;

export function isPilotFacility(sitelinkId: string): boolean {
  return (PILOT_FACILITY_IDS as readonly string[]).includes(sitelinkId);
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
