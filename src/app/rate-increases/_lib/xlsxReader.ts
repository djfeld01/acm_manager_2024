import JSZip from "jszip";
import { colIndex, readCell, sharedStringsOf } from "./exportTenantRates";

/** One worksheet as text: rows[r][c], 0-based, using each cell's saved value (formulas give their result). */
export interface SheetText {
  name: string;
  rows: string[][];
}

/** Read every worksheet of an .xlsx file as text. Runs in the browser or Node. */
export async function readWorkbookText(file: ArrayBuffer | Uint8Array): Promise<SheetText[]> {
  const zip = await JSZip.loadAsync(file).catch(() => {
    throw new Error("That doesn't look like an Excel (.xlsx) file.");
  });
  const wb = (await zip.file("xl/workbook.xml")?.async("string")) ?? "";
  const rels = (await zip.file("xl/_rels/workbook.xml.rels")?.async("string")) ?? "";
  const strings = sharedStringsOf((await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "");

  const targets = new Map<string, string>();
  for (const rel of rels.match(/<Relationship\b[^>]*>/g) ?? []) {
    const id = /\bId="([^"]+)"/.exec(rel)?.[1];
    const target = /\bTarget="([^"]+)"/.exec(rel)?.[1];
    if (id && target) targets.set(id, target.startsWith("/") ? target.slice(1) : `xl/${target}`);
  }

  const sheets: SheetText[] = [];
  for (const tag of wb.match(/<sheet\b[^>]*>/g) ?? []) {
    const name = readCell(`<c t="inlineStr"><is><t>${/\bname="([^"]*)"/.exec(tag)?.[1] ?? ""}</t></is></c>`, []);
    const path = targets.get(/\br:id="([^"]+)"/.exec(tag)?.[1] ?? "");
    const xml = path ? await zip.file(path)?.async("string") : undefined;
    if (!xml) continue;
    const rows: string[][] = [];
    for (const rowXml of xml.match(/<row\b[\s\S]*?<\/row>|<row\b[^>]*\/>/g) ?? []) {
      const r = Number(/<row\b[^>]*\br="(\d+)"/.exec(rowXml)?.[1] ?? rows.length + 1) - 1;
      const row: string[] = [];
      for (const cell of rowXml.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []) {
        const ref = /\br="([A-Z]+)\d+"/.exec(cell)?.[1];
        if (ref) row[colIndex(ref) - 1] = readCell(cell, strings);
      }
      rows[r] = Array.from(row, (v) => v ?? "");
    }
    sheets.push({ name, rows: Array.from(rows, (r) => r ?? []) });
  }
  return sheets;
}
