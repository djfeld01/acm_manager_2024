export const UNIT_TYPE_GROUPS = [
  "Drive-Up",
  "Inside Non-Climate",
  "Climate Controlled",
  "Climate - Convenience+",
  "Climate - Economy",
  "Parking",
] as const;

export type UnitTypeGroup = (typeof UNIT_TYPE_GROUPS)[number] | "Other";

/**
 * SiteLink's unit-type names are inconsistent across the rent roll, the
 * `unit` table, and `tenant_activity` (e.g. "Climate Control" vs "Climate
 * Controlled", and the same non-climate outdoor units appear as "Drive-Up"
 * in the rent roll but "Self Storage" in the unit table). Collapse them to a
 * small, stable set so every view groups the same way.
 */
export function normalizeUnitType(raw: string | null | undefined): UnitTypeGroup {
  const t = (raw ?? "").toLowerCase().trim();
  if (!t) return "Other";
  if (/parking|\brv\b|boat|trailer/.test(t)) return "Parking";
  if (/non[\s-]*climate/.test(t) || /\binside\b/.test(t)) return "Inside Non-Climate";
  if (/climate/.test(t)) {
    // Some facilities sell climate units as separate products with their own
    // prices (e.g. Sylvania's Convenience+ and Economy); keep those apart.
    if (/convenience/.test(t)) return "Climate - Convenience+";
    if (/economy/.test(t)) return "Climate - Economy";
    return "Climate Controlled";
  }
  if (/drive|self storage/.test(t)) return "Drive-Up";
  return "Other";
}

/**
 * Unit sizes arrive as "10x10" (rent roll) and "10.0x10.0" (unit table,
 * activity feed). Normalize to "WxL" with trailing ".0" dropped.
 */
export function normalizeSize(raw: string | null | undefined): string {
  const m = /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i.exec(raw ?? "");
  if (!m) return "Unknown";
  return `${Number(m[1])}x${Number(m[2])}`;
}

/** Square footage of a normalized size, for ordering small -> large. */
export function sizeArea(size: string): number {
  const m = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/.exec(size);
  return m ? Number(m[1]) * Number(m[2]) : Number.MAX_SAFE_INTEGER;
}

export const compareSizes = (a: string, b: string) => sizeArea(a) - sizeArea(b) || a.localeCompare(b);
