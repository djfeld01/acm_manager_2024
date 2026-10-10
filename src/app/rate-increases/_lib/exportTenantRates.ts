import JSZip from "jszip";

/**
 * Fill SiteLink's Tenant Rate Management export (.xlsx) with a batch's new
 * rents and effective date, ready to import back into SiteLink.
 *
 * Runs in the browser on a file the user uploads, because SiteLink's import
 * requires tenant last names and we deliberately never store them: the names
 * come from the user's own export and never reach our server.
 *
 * Only the two (EDIT) columns are touched; every other cell is left exactly
 * as SiteLink wrote it.
 */

export interface ExportLine {
  ledgerId: string;
  tenantId: string | null;
  unitId: string;
  unitName: string | null;
  oldRent: number;
  newRent: number;
}

export type LineStatus =
  | "written"
  | "not-in-file"
  | "rent-changed"
  | "id-mismatch"
  | "already-scheduled";

export const LINE_STATUS_LABEL: Record<LineStatus, string> = {
  written: "Added to the file",
  "not-in-file": "Not found in the uploaded file",
  "rent-changed": "Rent in the file differs from the batch",
  "id-mismatch": "Tenant/unit IDs in the file don't match",
  "already-scheduled": "File already has a scheduled change",
};

export interface ExportResult {
  data: Uint8Array;
  lines: { line: ExportLine; status: LineStatus; detail?: string }[];
  written: number;
  /** Rows in the uploaded file (all facilities). */
  fileRows: number;
  /** Rows in the file we produced, excluding the header. */
  outputRows: number;
}

const REQUIRED_HEADERS = [
  "LedgerID(REQUIRED)",
  "TenantID(REQUIRED)",
  "UnitID(REQUIRED)",
  "TenantRate(REQUIRED)",
  "ScheduledRate(EDIT)",
  "ScheduledDate(EDIT)",
] as const;

const unescapeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + ch.charCodeAt(0) - 64;
  return n;
}

/** Excel serial day number for an ISO date (whole days, no time part). */
export function excelSerial(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569;
}

function sharedStringsOf(xml: string): string[] {
  const out: string[] = [];
  const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    let text = "";
    const tre = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let t: RegExpExecArray | null;
    while (m[1] && (t = tre.exec(m[1]))) text += t[1];
    out.push(unescapeXml(text));
  }
  return out;
}

/** The cell element for `ref` inside a row, or null if the row lacks it. */
function findCell(rowXml: string, ref: string): RegExpExecArray | null {
  return new RegExp(`<c r="${ref}"(?:\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`).exec(rowXml);
}

function readCell(cell: string | null, strings: string[]): string {
  if (!cell) return "";
  const type = /\bt="(\w+)"/.exec(cell)?.[1];
  if (type === "inlineStr") {
    return unescapeXml((/<t\b[^>]*>([\s\S]*?)<\/t>/.exec(cell)?.[1] ?? "").trim());
  }
  const v = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1];
  if (v === undefined) return "";
  return type === "s" ? (strings[Number(v)] ?? "") : unescapeXml(v);
}

function setNumber(rowXml: string, col: string, rowNum: number, value: number): string {
  const ref = `${col}${rowNum}`;
  const existing = findCell(rowXml, ref);
  const style = existing ? /\bs="(\d+)"/.exec(existing[0])?.[1] : undefined;
  const cell = `<c r="${ref}"${style !== undefined ? ` s="${style}"` : ""}><v>${value}</v></c>`;
  if (existing) return rowXml.replace(existing[0], () => cell);

  // The row has no cell there: insert it in column order.
  const target = colIndex(col);
  const cellRe = /<c r="([A-Z]+)\d+"/g;
  let m: RegExpExecArray | null;
  while ((m = cellRe.exec(rowXml))) {
    if (colIndex(m[1]) > target) return rowXml.slice(0, m.index) + cell + rowXml.slice(m.index);
  }
  return rowXml.replace(/<\/row>\s*$/, () => cell + "</row>");
}

function renumberRow(rowXml: string, n: number): string {
  return rowXml.replace(/\br="([A-Z]*)\d+"/g, (_m, col: string) => `r="${col}${n}"`);
}

async function firstSheetPath(zip: JSZip): Promise<string> {
  const wb = await zip.file("xl/workbook.xml")?.async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  const rid = wb && /<sheet\b[^>]*\br:id="([^"]+)"/.exec(wb)?.[1];
  if (rels && rid) {
    for (const rel of rels.match(/<Relationship\b[^>]*>/g) ?? []) {
      if (new RegExp(`\\bId="${rid}"`).test(rel)) {
        const target = /\bTarget="([^"]+)"/.exec(rel)?.[1];
        if (target) return target.startsWith("/") ? target.slice(1) : `xl/${target}`;
      }
    }
  }
  return "xl/worksheets/sheet1.xml";
}

export async function buildTenantRateExport(
  file: ArrayBuffer | Uint8Array,
  lines: ExportLine[],
  opts: { effectiveDate: string; onlyBatchRows: boolean }
): Promise<ExportResult> {
  const zip = await JSZip.loadAsync(file).catch(() => {
    throw new Error("That doesn't look like an Excel (.xlsx) file. Upload the Tenant Rate Management export from SiteLink.");
  });
  const sheetPath = await firstSheetPath(zip);
  const sheetXml = await zip.file(sheetPath)?.async("string");
  if (!sheetXml) throw new Error("Couldn't read the worksheet in this file.");
  const strings = sharedStringsOf((await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "");

  const dataStart = sheetXml.indexOf("<sheetData>");
  const dataEnd = sheetXml.indexOf("</sheetData>");
  if (dataStart < 0 || dataEnd < 0) throw new Error("This doesn't look like a SiteLink tenant rate export.");
  const head = sheetXml.slice(0, dataStart + "<sheetData>".length);
  const tail = sheetXml.slice(dataEnd);
  const rows = sheetXml.slice(dataStart + "<sheetData>".length, dataEnd).match(/<row\b[\s\S]*?<\/row>/g) ?? [];
  if (rows.length < 2) throw new Error("The file has no tenant rows.");

  // Column letters by header text, so a reordered export still works.
  const colOf: Record<string, string> = {};
  const cre = /<c r="([A-Z]+)1"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g;
  let cm: RegExpExecArray | null;
  const headerRow = rows[0]!;
  while ((cm = cre.exec(headerRow))) colOf[readCell(cm[0], strings)] = cm[1]!;
  const missing = REQUIRED_HEADERS.filter((h) => !colOf[h]);
  if (missing.length) {
    throw new Error(
      `This doesn't look like a SiteLink tenant rate export (missing columns: ${missing.join(", ")}).`
    );
  }

  const byLedger = new Map(lines.map((l) => [l.ledgerId, l]));
  const status = new Map<string, { status: LineStatus; detail?: string }>();
  const serial = excelSerial(opts.effectiveDate);
  const norm = (s: string) => s.trim().replace(/\.0+$/, "");

  const outRows: string[] = [headerRow];
  const touched: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    let row = rows[i];
    const rowNum = Number(/<row\b[^>]*\br="(\d+)"/.exec(row)?.[1] ?? i + 1);
    const cell = (header: string) => readCell(findCell(row, `${colOf[header]}${rowNum}`)?.[0] ?? null, strings);

    const ledger = norm(cell("LedgerID(REQUIRED)"));
    const line = byLedger.get(ledger);
    if (!line) {
      if (!opts.onlyBatchRows) outRows.push(row);
      continue;
    }
    const setStatus = (s: LineStatus, detail?: string) => status.set(ledger, { status: s, detail });

    if (
      (line.tenantId && norm(cell("TenantID(REQUIRED)")) !== norm(line.tenantId)) ||
      norm(cell("UnitID(REQUIRED)")) !== norm(line.unitId)
    ) {
      setStatus("id-mismatch");
    } else if (Math.abs(Number(cell("TenantRate(REQUIRED)")) - line.oldRent) > 0.005) {
      setStatus("rent-changed", `file ${cell("TenantRate(REQUIRED)")}, batch ${line.oldRent}`);
    } else if (cell("ScheduledRate(EDIT)") !== "" || cell("ScheduledDate(EDIT)") !== "") {
      setStatus("already-scheduled");
    } else {
      row = setNumber(row, colOf["ScheduledRate(EDIT)"]!, rowNum, line.newRent);
      row = setNumber(row, colOf["ScheduledDate(EDIT)"]!, rowNum, serial);
      setStatus("written");
      touched.push(ledger);
    }
    // Rows we could not safely edit are left out of a batch-only file, so a
    // stale or conflicting row can never be imported by accident.
    if (!opts.onlyBatchRows || status.get(ledger)!.status === "written") outRows.push(row);
  }

  let finalRows = outRows;
  let newHead = head;
  if (opts.onlyBatchRows) {
    finalRows = outRows.map((r, idx) => renumberRow(r, idx + 1));
    const lastCol = Object.values(colOf).sort((a, b) => colIndex(b) - colIndex(a))[0];
    newHead = head.replace(/<dimension ref="[^"]*"\s*\/>/, `<dimension ref="A1:${lastCol}${finalRows.length}" />`);
  }
  zip.file(sheetPath, newHead + finalRows.join("") + tail);

  const resultLines = lines.map((l) => ({
    line: l,
    ...(status.get(l.ledgerId) ?? { status: "not-in-file" as LineStatus }),
  }));
  return {
    data: await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" }),
    lines: resultLines,
    written: touched.length,
    fileRows: rows.length - 1,
    outputRows: finalRows.length - 1,
  };
}
