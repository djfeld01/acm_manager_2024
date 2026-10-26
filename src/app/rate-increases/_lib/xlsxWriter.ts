import JSZip from "jszip";
import { excelSerial } from "./exportTenantRates";

/**
 * A minimal .xlsx writer: a few sheets of plain values with a bold, frozen,
 * filterable header row, 12pt text with light borders on every cell, column
 * widths, number formats, highlighted columns
 * and an optional filter that is already applied when the file opens. Enough
 * for a review spreadsheet without pulling in a full spreadsheet library.
 */

/** "heading" is bold text on a shaded background, like the header row. */
export type CellFormat = "text" | "heading" | "int" | "money" | "money2" | "pct" | "date";

export interface Column {
  header: string;
  format: CellFormat;
  /** Approximate width in characters. */
  width: number;
  /** Shade the whole column (header and cells) so it stands out. */
  highlight?: boolean;
}

/** A cell value: text, a number, an ISO date (for "date" columns) or empty. */
export type Cell = string | number | null;

export interface Sheet {
  name: string;
  /** When set, the first row is a bold header with filters and stays in view. */
  columns?: Column[];
  rows: Cell[][];
  /** Per-column formats for sheets without a header (e.g. label/value pairs). */
  formats?: CellFormat[][];
  widths?: number[];
  /** Filter already applied on open: only rows whose value in `column` is one of `show` are visible. */
  filter?: { column: number; show: string[] };
}

// Style indexes into cellXfs below; the highlighted version of each is HIGHLIGHT higher.
const STYLE: Record<CellFormat | "header", number> = {
  text: 0,
  header: 1,
  heading: 1,
  int: 2,
  money: 3,
  money2: 4,
  pct: 5,
  date: 6,
};
const HIGHLIGHT = 7;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0"/><numFmt numFmtId="165" formatCode="&quot;$&quot;#,##0.00"/><numFmt numFmtId="166" formatCode="yyyy-mm-dd"/></numFmts>
<fonts count="2"><font><sz val="12"/><name val="Calibri"/></font><font><b/><sz val="12"/><name val="Calibri"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F2EE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE699"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyBorder="1" applyFont="1" applyFill="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="10" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyBorder="1" applyFill="1"/>
<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyBorder="1" applyFont="1" applyFill="1"/>
<xf numFmtId="3" fontId="0" fillId="3" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyFill="1"/>
<xf numFmtId="165" fontId="0" fillId="3" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyFill="1"/>
<xf numFmtId="10" fontId="0" fillId="3" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyFill="1"/>
<xf numFmtId="166" fontId="0" fillId="3" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1" applyFill="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function colLetters(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function cellXml(ref: string, v: Cell, format: CellFormat, header = false, highlight = false): string {
  const shift = highlight ? HIGHLIGHT : 0;
  const s = (header ? STYLE.header : STYLE[format]) + shift;
  const textStyle = (header || format === "heading" ? STYLE.header : STYLE.text) + shift;
  // Empty cells are still written so they keep their border (and shading, in a highlighted column).
  if (v === null || v === "") return `<c r="${ref}" s="${s}"/>`;
  if (format === "date" && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return `<c r="${ref}" s="${s}"><v>${excelSerial(v)}</v></c>`;
  }
  if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}" s="${s}"><v>${v}</v></c>`;
  return `<c r="${ref}" s="${textStyle}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(v))}</t></is></c>`;
}

function sheetXml(sheet: Sheet): string {
  const cols = sheet.columns;
  const widths = cols ? cols.map((c) => c.width) : sheet.widths ?? [];
  const lines: string[] = [];
  let r = 1;
  if (cols) {
    lines.push(`<row r="1">${cols.map((c, i) => cellXml(`${colLetters(i)}1`, c.header, "text", true, c.highlight)).join("")}</row>`);
    r = 2;
  }
  const filter = sheet.filter;
  sheet.rows.forEach((row, ri) => {
    const cells = row
      .map((v, i) =>
        cellXml(`${colLetters(i)}${r}`, v, cols ? cols[i]?.format ?? "text" : sheet.formats?.[ri]?.[i] ?? "text", false, !!cols?.[i]?.highlight)
      )
      .join("");
    // Excel doesn't re-run a saved filter on open, so rows it would hide are written hidden.
    const hidden = filter && !filter.show.includes(String(row[filter.column] ?? ""));
    lines.push(`<row r="${r}"${hidden ? ' hidden="1"' : ""}>${cells}</row>`);
    r++;
  });
  const lastCol = colLetters(Math.max(0, (cols?.length ?? 1) - 1));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${cols ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' : ""}
${widths.length ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.round(w * 1.1 * 10) / 10}" customWidth="1"/>`).join("")}</cols>` : ""}
<sheetData>${lines.join("")}</sheetData>
${cols && sheet.rows.length ? autoFilterXml(`A1:${lastCol}${sheet.rows.length + 1}`, filter) : ""}
</worksheet>`;
}

function autoFilterXml(ref: string, filter: Sheet["filter"]): string {
  if (!filter) return `<autoFilter ref="${ref}"/>`;
  const values = filter.show.map((v) => `<filter val="${escapeXml(v)}"/>`).join("");
  return `<autoFilter ref="${ref}"><filterColumn colId="${filter.column}"><filters>${values}</filters></filterColumn></autoFilter>`;
}

/** Build an .xlsx workbook from the given sheets. */
export async function buildWorkbook(sheets: Sheet[]): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map((s, i) => `<sheet name="${escapeXml(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("")}</sheets>${sheets
      .map((s, i) =>
        s.columns && s.rows.length
          ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${escapeXml(s.name.slice(0, 31))}'!$A$1:$${colLetters(s.columns.length - 1)}$${s.rows.length + 1}</definedName></definedNames>`
          : ""
      )
      .join("")
      .replace(/<\/definedNames><definedNames>/g, "")}</workbook>`
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
  );
  zip.file("xl/styles.xml", STYLES_XML);
  sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)));
  return zip.generateAsync({ type: "uint8array" });
}
