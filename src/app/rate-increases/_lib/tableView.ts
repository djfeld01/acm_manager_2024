import { RATE_BUCKETS } from "./analytics";
import { REASON_LABEL, type BatchRules, type Candidate } from "./batch";
import { ratioBand } from "./cohort";
import { compareSizes } from "./unitTypes";

export interface Row {
  c: Candidate;
  included: boolean;
  /** Rent that will be sent if included; null when no rent can be worked out. */
  newRent: number | null;
}

export type SortKey =
  | "included"
  | "unit"
  | "type"
  | "size"
  | "rent"
  | "street"
  | "vsStreet"
  | "lastChanged"
  | "eligible"
  | "newRent"
  | "after"
  | "risk"
  | "note";

export type SortDir = "asc" | "desc";

export type StatusFilter = "included" | "excluded" | "all";

export interface Filters {
  status: StatusFilter;
  query: string;
  unitType: string; // "" = any
  size: string;
  /** A note key from `noteOf`, or "" for any. */
  note: string;
  /** A street-position band key, or "" for any. */
  band: string;
}

export const NO_FILTERS: Filters = { status: "included", query: "", unitType: "", size: "", note: "", band: "" };

/** True when any filter other than the In batch / Not in batch / All choice is set. */
export const hasExtraFilters = (f: Filters) => !!(f.query.trim() || f.unitType || f.size || f.note || f.band);

/** A row's warning when a hand-edited rent breaks the rules in force. */
export function rowWarning(r: Row, rules: BatchRules): string | null {
  if (!r.included || r.newRent === null) return null;
  const t = r.c.tenant;
  if (r.newRent <= t.rent) return "Not an increase";
  if (rules.maxOverStreetPct !== null && r.newRent > t.standardRate * (1 + rules.maxOverStreetPct) + 0.5) {
    return "Over the street cap";
  }
  if (rules.maxIncreaseDollars !== null && r.newRent - t.rent > rules.maxIncreaseDollars) {
    return "Over the max increase";
  }
  return null;
}

/** What the Note column says for a row, as a stable key plus its text. */
export function noteOf(r: Row, rules: BatchRules): { key: string; label: string } {
  const w = rowWarning(r, rules);
  if (w) return { key: "warning", label: w };
  if (r.c.reason && r.included) return { key: "by-hand", label: "Added by hand" };
  if (r.c.reason) return { key: r.c.reason, label: REASON_LABEL[r.c.reason] };
  return { key: "suggested", label: "" };
}

export const BAND_LABEL: Record<string, string> = {
  ...Object.fromEntries(RATE_BUCKETS.map((b) => [b.key, b.label])),
  unknown: "No street rate",
};

const afterRatio = (r: Row): number | null =>
  r.included && r.newRent !== null && r.c.tenant.standardRate > 0 ? r.newRent / r.c.tenant.standardRate : null;

export function applyFilters(rows: Row[], f: Filters, rules: BatchRules): Row[] {
  const q = f.query.trim().toLowerCase();
  return rows.filter((r) => {
    const t = r.c.tenant;
    if (f.status === "included" && !r.included) return false;
    if (f.status === "excluded" && r.included) return false;
    if (f.unitType && t.unitType !== f.unitType) return false;
    if (f.size && t.size !== f.size) return false;
    if (f.band && ratioBand(r.c.ratio) !== f.band) return false;
    if (f.note && noteOf(r, rules).key !== f.note) return false;
    if (q) {
      const hay = `${t.unitName ?? ""} ${t.unitType} ${t.size}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** Rows ordered by a column. Empty values always sort last, whichever way. */
export function sortRows(rows: Row[], key: SortKey, dir: SortDir, rules: BatchRules): Row[] {
  const value = (r: Row): number | string | null => {
    const t = r.c.tenant;
    switch (key) {
      case "included":
        return r.included ? 1 : 0;
      case "unit":
        return t.unitName ?? null;
      case "type":
        return t.unitType;
      case "size":
        return t.size;
      case "rent":
        return t.rent;
      case "street":
        return t.standardRate > 0 ? t.standardRate : null;
      case "vsStreet":
        return r.c.ratio;
      case "lastChanged":
        return t.rentLastChanged;
      case "eligible":
        return r.c.eligibleFrom;
      case "newRent":
        return r.included ? r.newRent : null;
      case "after":
        return afterRatio(r);
      case "risk":
        return t.exit90;
      case "note":
        return noteOf(r, rules).label || null;
    }
  };
  const cmp = (a: number | string, b: number | string): number => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (key === "size") return compareSizes(String(a), String(b));
    return natural.compare(String(a), String(b));
  };
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va === null && vb === null) return natural.compare(a.c.tenant.unitName ?? "", b.c.tenant.unitName ?? "");
    if (va === null) return 1;
    if (vb === null) return -1;
    return sign * cmp(va, vb) || natural.compare(a.c.tenant.unitName ?? "", b.c.tenant.unitName ?? "");
  });
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/** Choices for the dropdown filters, with how many tenants each covers. */
export function facets(rows: Row[], rules: BatchRules) {
  const tally = (pick: (r: Row) => { value: string; label: string } | null): FacetOption[] => {
    const m = new Map<string, FacetOption>();
    for (const r of rows) {
      const p = pick(r);
      if (!p) continue;
      const cur = m.get(p.value);
      if (cur) cur.count++;
      else m.set(p.value, { ...p, count: 1 });
    }
    return Array.from(m.values());
  };
  return {
    types: tally((r) => ({ value: r.c.tenant.unitType, label: r.c.tenant.unitType })).sort((a, b) => b.count - a.count),
    sizes: tally((r) => ({ value: r.c.tenant.size, label: r.c.tenant.size })).sort((a, b) => compareSizes(a.value, b.value)),
    notes: tally((r) => {
      const n = noteOf(r, rules);
      return n.key === "suggested" ? { value: "suggested", label: "Suggested by the rules" } : { value: n.key, label: n.label };
    }).sort((a, b) => b.count - a.count),
    bands: tally((r) => {
      const k = ratioBand(r.c.ratio);
      return { value: k, label: BAND_LABEL[k] ?? k };
    }),
  };
}
