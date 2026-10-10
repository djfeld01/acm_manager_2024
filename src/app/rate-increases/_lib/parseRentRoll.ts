import Papa from "papaparse";
import { normalizeUnitType } from "./unitTypes";

/** One unit as stored in a rent roll snapshot. No tenant name/email/company. */
export interface RentRollRow {
  sitelinkId: string;
  unitId: string;
  unitName: string | null;
  ledgerId: string | null;
  tenantId: string | null;
  unitType: string;
  rawUnitType: string | null;
  size: string | null;
  area: number | null;
  isRentable: boolean;
  isRented: boolean;
  rent: number | null;
  standardRate: number | null;
  webRate: number | null;
  pushRate: number | null;
  pushRateAtMoveIn: number | null;
  rentLastChanged: string | null;
  leaseDate: string | null;
  paidThru: string | null;
  schedRentStart: string | null;
  schedRent: number | null;
  schedOut: string | null;
  chargeBalance: number | null;
  daysVacant: number | null;
}

export interface ParsedRentRoll {
  /** Rows for the requested site only. */
  rows: RentRollRow[];
  /** Units per SiteID found in the whole file (for sanity-checking). */
  siteCounts: Record<string, number>;
  /** YYYY-MM-DD guessed from a filename like RentRoll_20261010_..., or null. */
  suggestedSnapshotDate: string | null;
}

function decode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let text: string;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) text = new TextDecoder("utf-16le").decode(buf);
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) text = new TextDecoder("utf-16be").decode(buf);
  else text = new TextDecoder("utf-8").decode(buf);
  return text.replace(/^﻿/, "");
}

/** "4/1/2026 12:00:00 AM" -> "2026-04-01"; blanks and unusable values -> null. */
export function toIsoDate(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [, mo, d, y] = m;
  if (parseInt(y, 10) < 2000) return null;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function num(raw: string | undefined): number | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function str(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  return s ? s : null;
}

/**
 * Parses a SiteLink rent roll export (tab-delimited, usually UTF-16). Only the
 * columns needed for rate analysis are read — `sTenant`, `sCompany` and
 * `sEmail` are never touched, so nothing personally identifying can leave the
 * browser.
 */
export async function parseRentRoll(file: File, sitelinkId: string): Promise<ParsedRentRoll> {
  const text = decode(await file.arrayBuffer());
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: "\t",
    transformHeader: (h) => h.trim(),
  });

  const siteCounts: Record<string, number> = {};
  const rows: RentRollRow[] = [];

  for (const r of data) {
    const site = (r["SiteID"] ?? "").trim();
    if (!site) continue;
    siteCounts[site] = (siteCounts[site] ?? 0) + 1;
    if (site !== sitelinkId) continue;

    const unitId = (r["UnitID"] ?? "").trim();
    // The export includes a facility header line carrying the site's ID; real units have numeric IDs.
    if (!/^\d+$/.test(unitId)) continue;
    const rawType = str(r["sTypeName"]);
    const isRented = (r["bRented"] ?? "").trim().toLowerCase() === "true";

    rows.push({
      sitelinkId: site,
      unitId,
      unitName: str(r["sUnit"]),
      ledgerId: isRented ? str(r["LedgerID"]) : null,
      tenantId: isRented ? str(r["TenantID"]) : null,
      unitType: normalizeUnitType(rawType),
      rawUnitType: rawType,
      size: str(r["sSize"]),
      area: num(r["Area"]),
      isRentable: (r["bRentable"] ?? "").trim().toLowerCase() === "true",
      isRented,
      rent: isRented ? num(r["dcRent"]) : null,
      standardRate: num(r["dcStdRate"]),
      webRate: num(r["dcWebRate"]),
      pushRate: num(r["dcPushRate"]),
      pushRateAtMoveIn: isRented ? num(r["dcPushRateAtMoveIn"]) : null,
      rentLastChanged: isRented ? toIsoDate(r["dRentLastChanged"]) : null,
      leaseDate: isRented ? toIsoDate(r["dLeaseDate"]) : null,
      paidThru: isRented ? toIsoDate(r["dPaidThru"]) : null,
      schedRentStart: isRented ? toIsoDate(r["dSchedRentStrt"]) : null,
      schedRent: isRented ? num(r["dcSchedRent"]) : null,
      schedOut: isRented ? toIsoDate(r["dSchedOut"]) : null,
      chargeBalance: isRented ? num(r["dcChargeBalance"]) : null,
      daysVacant: isRented ? null : num(r["iDaysVacant"]),
    });
  }

  const nameMatch = file.name.match(/(\d{4})(\d{2})(\d{2})/);
  const suggestedSnapshotDate = nameMatch ? `${nameMatch[1]}-${nameMatch[2]}-${nameMatch[3]}` : null;

  return { rows, siteCounts, suggestedSnapshotDate };
}
