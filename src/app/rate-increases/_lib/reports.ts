import { normalizeSize, normalizeUnitType } from "./unitTypes";

/**
 * Readers for two SiteLink reports that describe past rent increases:
 *
 * - Tenant Increase Tracking: per month, units raised, dollars, average %,
 *   position vs street, and SiteLink's count of raised units that moved out
 *   within 0-30 / 31-60 / 61-90 days, by unit type and size.
 * - Rate Management History: per month, occupied units and rents, by unit
 *   type and size.
 *
 * Both are UTF-16 tab-delimited text, and both are summaries — they carry no
 * tenant names. These functions are plain (no browser or server calls) so the
 * same code runs when a file is chosen and in tests.
 */

export type ReportKind = "tracking" | "history";

/** "ALL" in both unit type and size marks a facility total. */
export const ALL = "ALL";

export interface WaveMonthRow {
  sitelinkId: string;
  /** YYYY-MM-01 */
  month: string;
  unitType: string;
  size: string;
  unitsRaised: number;
  dollarsAdded: number;
  avgPct: number;
  atStandard: number;
  belowStandard: number;
  aboveStandard: number;
  moveouts0to30: number;
  moveouts31to60: number;
  moveouts61to90: number;
  moveouts0to30Rent: number;
  moveouts31to60Rent: number;
  moveouts61to90Rent: number;
}

export interface OccupancyRow {
  sitelinkId: string;
  month: string;
  unitType: string;
  size: string;
  unitsOccupied: number;
  totalUnits: number;
  grossOccupied: number;
  actualOccupied: number;
}

export interface ParsedReport<R> {
  kind: ReportKind;
  /** Date the report was run, YYYY-MM-DD. */
  reportDate: string;
  sites: { sitelinkId: string; months: string[]; rows: R[]; warnings: string[] }[];
}

/* ---------- reading the file ---------- */

/** SiteLink's text exports are UTF-16 with a byte-order mark; fall back to UTF-8. */
export function decodeReport(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const utf16 = bytes.length > 1 && ((bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff));
  const text = new TextDecoder(utf16 ? (bytes[0] === 0xfe ? "utf-16be" : "utf-16le") : "utf-8").decode(bytes);
  return text.replace(/^﻿/, "");
}

const linesOf = (text: string) => text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

export function detectReportKind(text: string): ReportKind | null {
  const first = (linesOf(text)[0] ?? "").split("\t");
  if (first[0] === "iCat" && first[1] === "SiteID") return "tracking";
  if (first.includes("SiteID") && first.includes("dcM1") && first.includes("iRowType")) return "history";
  return null;
}

/** SiteLink names reports ..._YYYYMMDD_YYYYMMDD_HHMMSS; the first date is the run date. */
export function reportDateFromFilename(name: string): string | null {
  const m = /_(\d{4})(\d{2})(\d{2})_/.exec(name);
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = Number(mo);
  const day = Number(d);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? `${y}-${mo}-${d}` : null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "Oct||2026" -> "2026-10-01" */
function monthFromLabel(label: string): string | null {
  const m = /^([A-Za-z]{3})\w*\|\|(\d{4})$/.exec(label.trim());
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1]!.toLowerCase());
  return idx < 0 ? null : `${m[2]}-${String(idx + 1).padStart(2, "0")}-01`;
}

/** The first of the month `back` months before the month of `iso`. */
export function monthsBefore(iso: string, back: number): string {
  const [y, m] = iso.split("-").map(Number);
  const total = y! * 12 + (m! - 1) - back;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

const num = (s: string | undefined) => {
  const v = Number((s ?? "").trim());
  return Number.isFinite(v) ? v : 0;
};

/* ---------- Tenant Increase Tracking ---------- */

type Cat =
  | "units"
  | "dollars"
  | "avgPct"
  | "atStandard"
  | "belowStandard"
  | "aboveStandard"
  | "mo30"
  | "mo60"
  | "mo90"
  | "mo30Rent"
  | "mo60Rent"
  | "mo90Rent";

const CATEGORY: Record<string, Cat> = {
  "Rent Increase Units": "units",
  "Rent Increase $": "dollars",
  "Rent Increase Avg %": "avgPct",
  "At Standard Rate": "atStandard",
  "Below Standard Rate": "belowStandard",
  "Above Standard Rate": "aboveStandard",
  "Moveouts, 0-30 days": "mo30",
  "Moveouts, 31-60 days": "mo60",
  "Moveouts, 61-91 days": "mo90",
  "Moveouts, 61-90 days": "mo90",
  "Moveouts, 0-30 days $": "mo30Rent",
  "Moveouts, 31-60 days $": "mo60Rent",
  "Moveouts, 61-90 days $": "mo90Rent",
  "Moveouts, 61-91 days $": "mo90Rent",
};

const blankMetrics = () => ({
  unitsRaised: 0,
  dollarsAdded: 0,
  avgPct: 0,
  atStandard: 0,
  belowStandard: 0,
  aboveStandard: 0,
  moveouts0to30: 0,
  moveouts31to60: 0,
  moveouts61to90: 0,
  moveouts0to30Rent: 0,
  moveouts31to60Rent: 0,
  moveouts61to90Rent: 0,
});

type Series = Partial<Record<Cat, number[]>>;

export function parseTrackingReport(text: string, reportDate: string): ParsedReport<WaveMonthRow> {
  const lines = linesOf(text);
  if (detectReportKind(text) !== "tracking") throw new Error("This isn't a Tenant Increase Tracking report.");

  // Month labels per site: the rows right under the "iCat / SiteID / 1..14" header.
  const monthsBySite = new Map<string, string[]>();
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i]!.split("\t");
    if (!lines[i]!.trim()) break;
    if (/^\d+$/.test(p[0] ?? "") && p[1]) {
      const months = p.slice(2).map(monthFromLabel);
      if (months.length && months.every((m) => m)) monthsBySite.set(p[1]!, months as string[]);
    }
  }
  if (!monthsBySite.size) throw new Error("Couldn't find the month labels in this report.");

  // Per site: raw group series keyed by type|size, plus the facility totals.
  const groups = new Map<string, Map<string, { type: string; size: string; series: Series }>>();
  const totals = new Map<string, Series>();
  const unknownCategories = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]!.startsWith("Category\tMonth1\t")) continue;
    const header = lines[i]!.split("\t");
    const col = (name: string) => header.indexOf(name);
    const monthCols = header.map((h, k) => ({ h, k })).filter(({ h }) => /^Month\d+$/.test(h)).map(({ k }) => k);
    const siteCol = col("SiteID");
    const typeCol = col("sTypeName");
    const sizeCol = col("Size");
    for (i++; i < lines.length && lines[i]!.trim(); i++) {
      const p = lines[i]!.split("\t");
      const cat = CATEGORY[p[0] ?? ""];
      if (!cat) {
        unknownCategories.add(p[0] ?? "");
        continue;
      }
      const site = (p[siteCol] ?? "").trim();
      if (!site) continue;
      const values = monthCols.map((k) => num(p[k]));
      if (typeCol >= 0 && sizeCol >= 0) {
        const type = (p[typeCol] ?? "").trim();
        const size = (p[sizeCol] ?? "").trim();
        const bySite = groups.get(site) ?? new Map();
        const key = `${type}|${size}`;
        const g = bySite.get(key) ?? { type, size, series: {} as Series };
        g.series[cat] = values;
        bySite.set(key, g);
        groups.set(site, bySite);
      } else {
        const s = totals.get(site) ?? {};
        s[cat] = values;
        totals.set(site, s);
      }
    }
  }

  const sites: ParsedReport<WaveMonthRow>["sites"] = [];
  for (const [site, months] of monthsBySite) {
    const warnings: string[] = [];
    const rows = new Map<string, WaveMonthRow & { _avgWeight: number }>();
    const get = (month: string, type: string, size: string) => {
      const key = `${month}|${type}|${size}`;
      let r = rows.get(key);
      if (!r) {
        r = { sitelinkId: site, month, unitType: type, size, ...blankMetrics(), _avgWeight: 0 };
        rows.set(key, r);
      }
      return r;
    };
    const apply = (r: WaveMonthRow & { _avgWeight: number }, s: Series, k: number, exactAvg: boolean) => {
      const at = (c: Cat) => s[c]?.[k] ?? 0;
      const units = at("units");
      r.unitsRaised += units;
      r.dollarsAdded += at("dollars");
      r.atStandard += at("atStandard");
      r.belowStandard += at("belowStandard");
      r.aboveStandard += at("aboveStandard");
      r.moveouts0to30 += at("mo30");
      r.moveouts31to60 += at("mo60");
      r.moveouts61to90 += at("mo90");
      r.moveouts0to30Rent += at("mo30Rent");
      r.moveouts31to60Rent += at("mo60Rent");
      r.moveouts61to90Rent += at("mo90Rent");
      if (exactAvg) r.avgPct = at("avgPct");
      else {
        r.avgPct += at("avgPct") * units; // weighted below
        r._avgWeight += units;
      }
    };

    // Groups, folded into the app's unit-type groups and normalized sizes.
    for (const g of groups.get(site)?.values() ?? []) {
      const type = normalizeUnitType(g.type);
      const size = normalizeSize(g.size);
      months.forEach((month, k) => apply(get(month, type, size), g.series, k, false));
    }
    // Group percentages are folded together weighted by units raised. SiteLink's
    // own facility total is kept as stated: it runs about half a point higher
    // than its groups imply (its units and dollars do add up exactly).
    for (const r of rows.values()) {
      r.avgPct = r._avgWeight > 0 ? r.avgPct / r._avgWeight : 0;
    }

    // Keep only groups that had something happen that month.
    const out: WaveMonthRow[] = [];
    const groupSums = new Map<string, number>();
    for (const r of rows.values()) {
      groupSums.set(r.month, (groupSums.get(r.month) ?? 0) + r.unitsRaised);
      if (r.unitsRaised !== 0 || r.moveouts0to30 + r.moveouts31to60 + r.moveouts61to90 !== 0) {
        const { _avgWeight: _w, ...clean } = r;
        void _w;
        out.push(clean);
      }
    }

    // Facility totals, one row per month (zeros kept: they say "no increases").
    const t = totals.get(site);
    if (t) {
      months.forEach((month, k) => {
        const r = { sitelinkId: site, month, unitType: ALL, size: ALL, ...blankMetrics(), _avgWeight: 0 };
        apply(r, t, k, true);
        const { _avgWeight: _w, ...clean } = r;
        void _w;
        out.push(clean);
        const sum = groupSums.get(month) ?? 0;
        if (Math.abs(sum - clean.unitsRaised) > 0.5) {
          warnings.push(`${month.slice(0, 7)}: unit types and sizes add to ${sum} raised units but the total says ${clean.unitsRaised}.`);
        }
      });
    } else {
      warnings.push("This report has no facility totals; month totals will be added up from the unit types.");
      const byMonth = new Map<string, WaveMonthRow>();
      for (const r of out) {
        const cur = byMonth.get(r.month) ?? { sitelinkId: site, month: r.month, unitType: ALL, size: ALL, ...blankMetrics() };
        const w = cur.unitsRaised + r.unitsRaised;
        cur.avgPct = w ? (cur.avgPct * cur.unitsRaised + r.avgPct * r.unitsRaised) / w : 0;
        cur.unitsRaised = w;
        cur.dollarsAdded += r.dollarsAdded;
        cur.atStandard += r.atStandard;
        cur.belowStandard += r.belowStandard;
        cur.aboveStandard += r.aboveStandard;
        cur.moveouts0to30 += r.moveouts0to30;
        cur.moveouts31to60 += r.moveouts31to60;
        cur.moveouts61to90 += r.moveouts61to90;
        cur.moveouts0to30Rent += r.moveouts0to30Rent;
        cur.moveouts31to60Rent += r.moveouts31to60Rent;
        cur.moveouts61to90Rent += r.moveouts61to90Rent;
        byMonth.set(r.month, cur);
      }
      out.push(...byMonth.values());
    }
    if (unknownCategories.size) {
      warnings.push(`Ignored rows we don't recognise: ${Array.from(unknownCategories).join(", ")}.`);
    }
    sites.push({ sitelinkId: site, months, rows: out, warnings });
  }
  return { kind: "tracking", reportDate, sites };
}

/* ---------- Rate Management History ---------- */

const HISTORY_ROWS = new Set(["Units Occupied", "Gross Occupied", "Actual Occupied"]);

export function parseHistoryReport(text: string, reportDate: string): ParsedReport<OccupancyRow> {
  const lines = linesOf(text);
  if (detectReportKind(text) !== "history") throw new Error("This isn't a Rate Management History report.");
  const header = lines[0]!.split("\t");
  const ix = (name: string) => header.indexOf(name);
  const need = ["SiteID", "sTypeName", "sSize", "sDescription", "sSubtotalDesc", "dcM1", "dcM14", "iUnitsM1"];
  const missing = need.filter((n) => ix(n) < 0);
  if (missing.length) throw new Error(`The report is missing columns: ${missing.join(", ")}.`);

  // M1 is the month the report was run; M2 the month before, and so on.
  const monthAt = (k: number) => monthsBefore(reportDate, k);
  const values = (p: string[], prefix: string) => Array.from({ length: 14 }, (_, k) => num(p[ix(`${prefix}${k + 1}`)]));

  const acc = new Map<string, Map<string, OccupancyRow>>(); // site -> key -> row
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const p = line.split("\t");
    const desc = (p[ix("sDescription")] ?? "").trim();
    if (!HISTORY_ROWS.has(desc) || (p[ix("sSubtotalDesc")] ?? "").trim() || !(p[ix("sSize")] ?? "").trim()) continue;
    const site = (p[ix("SiteID")] ?? "").trim();
    if (!site) continue;
    const type = normalizeUnitType(p[ix("sTypeName")]);
    const size = normalizeSize(p[ix("sSize")]);
    const dc = values(p, "dcM");
    const units = desc === "Units Occupied" ? values(p, "iUnitsM") : null;
    const bySite = acc.get(site) ?? new Map<string, OccupancyRow>();
    for (let k = 0; k < 14; k++) {
      const month = monthAt(k);
      const key = `${month}|${type}|${size}`;
      const r =
        bySite.get(key) ??
        { sitelinkId: site, month, unitType: type, size, unitsOccupied: 0, totalUnits: 0, grossOccupied: 0, actualOccupied: 0 };
      if (desc === "Units Occupied") {
        r.unitsOccupied += dc[k]!;
        r.totalUnits += units![k]!;
      } else if (desc === "Gross Occupied") r.grossOccupied += dc[k]!;
      else r.actualOccupied += dc[k]!;
      bySite.set(key, r);
    }
    acc.set(site, bySite);
  }
  if (!acc.size) throw new Error("No occupancy rows found in this report.");

  const sites = Array.from(acc, ([sitelinkId, rows]) => ({
    sitelinkId,
    months: Array.from({ length: 14 }, (_, k) => monthAt(k)),
    rows: Array.from(rows.values()),
    warnings: [] as string[],
  }));
  return { kind: "history", reportDate, sites };
}

/** Run whichever reader fits the file. */
export function parseReport(text: string, reportDate: string): ParsedReport<WaveMonthRow> | ParsedReport<OccupancyRow> {
  const kind = detectReportKind(text);
  if (kind === "tracking") return parseTrackingReport(text, reportDate);
  if (kind === "history") return parseHistoryReport(text, reportDate);
  throw new Error(
    "This isn't a Tenant Increase Tracking or Rate Management History report. Upload the .txt version SiteLink exports."
  );
}
