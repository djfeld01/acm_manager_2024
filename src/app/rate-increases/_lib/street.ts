/**
 * Which rate counts as "street" when judging whether a tenant is above or
 * below the market:
 * - standard: the unit's rate-card (standard) rate
 * - push: SiteLink's push rate, the rate currently being asked of new tenants
 *   (set per unit type and size; at or above the standard rate)
 */
export type StreetBasis = "standard" | "push";

export const STREET_BASIS_LABEL: Record<StreetBasis, string> = {
  standard: "Standard rate",
  push: "Push rate",
};

/** The street rate for one unit under a basis. Falls back to the standard
 *  rate when a unit has no push rate on file. */
export function streetRateOf(
  r: { standardRate: number | null; pushRate?: number | null },
  basis: StreetBasis
): number | null {
  if (basis === "push" && (r.pushRate ?? 0) > 0) return r.pushRate!;
  return r.standardRate;
}

/**
 * Copies of the rows with `standardRate` set to the chosen street rate, so
 * everything downstream that measures against "street" (street position,
 * raise-to-street, the over-street cap, the Vs street columns) follows the
 * setting without each place needing to know about it.
 */
export function withStreetRate<T extends { standardRate: number | null; pushRate?: number | null }>(
  rows: T[],
  basis: StreetBasis
): T[] {
  if (basis === "standard") return rows;
  return rows.map((r) => ({ ...r, standardRate: streetRateOf(r, basis) }));
}
