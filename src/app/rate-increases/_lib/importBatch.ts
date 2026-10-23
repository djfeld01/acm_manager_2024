import { isoFromDayNum } from "./analytics";
import type { BatchTenant } from "./batch";
import { readWorkbookText, type SheetText } from "./xlsxReader";

/**
 * Read a batch back from a spreadsheet someone edited: either SiteLink's
 * Tenant Rate Management export (new rents in ScheduledRate(EDIT)) or the
 * review spreadsheet this tool downloads (In this batch / New rent). Runs in
 * the browser; only ledger IDs, rents and short notes are kept, never names.
 */

export type ImportFormat = "sitelink" | "review";

export const FORMAT_LABEL: Record<ImportFormat, string> = {
  sitelink: "SiteLink tenant rate export",
  review: "Review spreadsheet from this page",
};

export interface ImportRow {
  ledgerId: string;
  /** Current rent according to the file. */
  fileRent: number | null;
  /** Rent the file proposes; null when the row proposes no change. */
  newRent: number | null;
  /** Text someone typed where a number belongs, or in a column of their own (e.g. "Hold?"). */
  flag: string | null;
}

export interface ImportSheet {
  name: string;
  format: ImportFormat;
  rows: ImportRow[];
  /** Effective date found in the file (scheduled dates or a date in the sheet name). */
  effectiveDate: string | null;
}

// Columns of SiteLink's export that hold text by design; text anywhere else is a note someone added.
const SITELINK_TEXT_COLUMNS = new Set([
  "Division",
  "LocationCode(REQUIRED)",
  "SiteName",
  "UnitType(REQUIRED)",
  "UnitName(REQUIRED)",
  "Size",
  "LastName(REQUIRED)",
  "FirstName",
  "Company",
  "TenantZip",
  "FacilityZip",
]);

const num = (s: string | undefined): number | null => {
  const t = (s ?? "").trim().replace(/[$,]/g, "");
  return t !== "" && Number.isFinite(Number(t)) ? Number(t) : null;
};
const id = (s: string | undefined) => (s ?? "").trim().replace(/\.0+$/, "");

/** "Proposed 12-1-2026" -> "2026-12-01". */
function dateInName(name: string): string | null {
  const m = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(name);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

const serialToIso = (serial: number) => isoFromDayNum(Math.floor(serial) - 25569);

function headerIndex(sheet: SheetText): Map<string, number> {
  const out = new Map<string, number>();
  (sheet.rows[0] ?? []).forEach((h, i) => {
    const k = h.trim();
    if (k && !out.has(k)) out.set(k, i);
  });
  return out;
}

function parseSiteLink(sheet: SheetText, col: Map<string, number>): ImportSheet {
  const at = (row: string[], h: string) => (col.has(h) ? row[col.get(h)!] : undefined);
  const noteCols = [...col.entries()].filter(([h]) => !SITELINK_TEXT_COLUMNS.has(h)).map(([, i]) => i);
  const dates = new Set<string>();
  const rows: ImportRow[] = [];
  for (const row of sheet.rows.slice(1)) {
    const ledgerId = id(at(row, "LedgerID(REQUIRED)"));
    if (!ledgerId) continue;
    const fileRent = num(at(row, "TenantRate(REQUIRED)"));
    const sched = num(at(row, "ScheduledRate(EDIT)"));
    const flag = noteCols.map((i) => (row[i] ?? "").trim()).find((v) => v !== "" && num(v) === null) ?? null;
    const sd = num(at(row, "ScheduledDate(EDIT)"));
    if (sched !== null && sd !== null) dates.add(serialToIso(sd));
    rows.push({ ledgerId, fileRent, newRent: sched !== null && sched > 0 && sched !== fileRent ? sched : null, flag });
  }
  return {
    name: sheet.name,
    format: "sitelink",
    rows,
    effectiveDate: dates.size === 1 ? [...dates][0] : dateInName(sheet.name),
  };
}

function parseReview(sheet: SheetText, col: Map<string, number>, effectiveDate: string | null): ImportSheet {
  const at = (row: string[], h: string) => (col.has(h) ? row[col.get(h)!] : undefined);
  const rows: ImportRow[] = [];
  for (const row of sheet.rows.slice(1)) {
    const ledgerId = id(at(row, "Ledger ID"));
    if (!ledgerId) continue;
    const yes = /^y/i.test((at(row, "In this batch") ?? "").trim());
    const newRent = num(at(row, "New rent"));
    rows.push({ ledgerId, fileRent: num(at(row, "Current rent")), newRent: yes ? newRent : null, flag: null });
  }
  return { name: sheet.name, format: "review", rows, effectiveDate };
}

/** Every sheet in the file that looks like a batch, in workbook order. */
export async function parseBatchWorkbook(file: ArrayBuffer | Uint8Array): Promise<ImportSheet[]> {
  const sheets = await readWorkbookText(file);
  // The review spreadsheet keeps its effective date on the Summary sheet.
  const summary = sheets.find((s) => s.name === "Summary");
  const effRow = summary?.rows.find((r) => r[0] === "Effective date");
  const reviewDate = effRow && num(effRow[1]) !== null ? serialToIso(num(effRow[1])!) : null;

  const out: ImportSheet[] = [];
  for (const sheet of sheets) {
    const col = headerIndex(sheet);
    if (col.has("LedgerID(REQUIRED)") && col.has("ScheduledRate(EDIT)")) out.push(parseSiteLink(sheet, col));
    else if (col.has("Ledger ID") && col.has("In this batch") && col.has("New rent")) out.push(parseReview(sheet, col, reviewDate));
  }
  return out;
}

export interface ImportPlan {
  /** Tenants the batch will include, with the rent from the file. */
  include: { ledgerId: string; newRent: number; flagged: boolean }[];
  /** Rows left out because of a note (when notes mean "leave out"). */
  held: { ledgerId: string; flag: string }[];
  /** Rows that propose a rent at or below what the tenant pays now. */
  notAnIncrease: ImportRow[];
  /** Rows whose ledger ID isn't a current tenant in the rent roll. */
  notFound: ImportRow[];
  /** Included rows where the file's current rent differs from the rent roll. */
  rentDiffers: { row: ImportRow; rollRent: number }[];
  /** Current tenants with no proposed increase in the file. */
  notInFile: number;
}

/** Match a parsed sheet against the current tenants. */
export function planImport(sheet: ImportSheet, tenants: BatchTenant[], opts: { leaveOutFlagged: boolean }): ImportPlan {
  const byLedger = new Map(tenants.map((t) => [t.ledgerId, t]));
  const plan: ImportPlan = { include: [], held: [], notAnIncrease: [], notFound: [], rentDiffers: [], notInFile: 0 };
  const seen = new Set<string>();
  for (const row of sheet.rows) {
    if (row.newRent === null) continue;
    const t = byLedger.get(row.ledgerId);
    if (!t) {
      plan.notFound.push(row);
      continue;
    }
    if (row.flag && opts.leaveOutFlagged) {
      plan.held.push({ ledgerId: row.ledgerId, flag: row.flag });
      continue;
    }
    if (row.newRent <= t.rent) {
      plan.notAnIncrease.push(row);
      continue;
    }
    if (row.fileRent !== null && Math.abs(row.fileRent - t.rent) > 0.005) plan.rentDiffers.push({ row, rollRent: t.rent });
    plan.include.push({ ledgerId: row.ledgerId, newRent: row.newRent, flagged: !!row.flag });
    seen.add(row.ledgerId);
  }
  const held = new Set(plan.held.map((h) => h.ledgerId));
  plan.notInFile = tenants.filter((t) => !seen.has(t.ledgerId) && !held.has(t.ledgerId)).length;
  return plan;
}

/** The distinct notes in a sheet's proposed rows, most common first (e.g. ["Hold?"]). */
export function flagsIn(sheet: ImportSheet): { flag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of sheet.rows) if (r.newRent !== null && r.flag) counts.set(r.flag, (counts.get(r.flag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([flag, count]) => ({ flag, count }));
}
