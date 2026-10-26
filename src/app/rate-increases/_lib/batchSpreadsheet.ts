import { dayNum } from "./analytics";
import { summarizeBatch, type BatchRules } from "./batch";
import { STREET_BASIS_LABEL, streetRateOf } from "./street";
import { noteOf, type Row } from "./tableView";
import { buildWorkbook, colLetters, isFormula, type Cell, type CellFormat, type Column, type Formula } from "./xlsxWriter";
import type { VacantUnit } from "../actions/getBatchData";

/**
 * A review spreadsheet for a batch, draft or final: every unit in the rent
 * roll (tenants in the batch, tenants who aren't, and vacant units) plus a
 * summary sheet. Built in the browser; it carries IDs and rents, no names.
 */

export interface BatchSheetMeta {
  facilityName: string;
  /** Saved name, or empty for a batch that hasn't been saved. */
  batchName: string;
  status: "final" | "draft" | "unsaved";
  snapshotDate: string;
}

const STATUS_LABEL: Record<BatchSheetMeta["status"], string> = {
  final: "Finalized",
  draft: "Draft",
  unsaved: "Not saved yet",
};

const COLUMNS: Column[] = [
  { header: "Unit", format: "text", width: 9 },
  { header: "Unit type", format: "text", width: 20 },
  { header: "Size", format: "text", width: 9 },
  { header: "Occupied", format: "text", width: 10 },
  { header: "Ledger ID", format: "text", width: 11 },
  { header: "Move-in date", format: "date", width: 13 },
  { header: "Months here", format: "int", width: 12 },
  { header: "Last rent change", format: "date", width: 16 },
  { header: "Current rent", format: "money2", width: 13, highlight: true },
  { header: "Street rate", format: "money2", width: 12, highlight: true },
  { header: "Current vs street", format: "pct", width: 16 },
  { header: "In this batch", format: "text", width: 13 },
  { header: "New rent", format: "money2", width: 11, highlight: true },
  { header: "Increase $", format: "money2", width: 11, highlight: true },
  { header: "Increase %", format: "pct", width: 10 },
  { header: "New rent vs street", format: "pct", width: 17 },
  { header: "Note", format: "text", width: 34 },
  { header: "Eligible from", format: "date", width: 13 },
  { header: "Balance owed", format: "money2", width: 13 },
  { header: "Scheduled move-out", format: "date", width: 18 },
];

/** Column letter on the All units sheet, by header. */
const L = (header: string) => colLetters(COLUMNS.findIndex((c) => c.header === header));
const UNITS = "'All units'";
/** A whole column of the All units sheet, e.g. 'All units'!$L:$L. */
const ALL = (header: string) => `${UNITS}!$${L(header)}:$${L(header)}`;
/** Text as a COUNTIFS criterion: quoted, with Excel's wildcards (* ? ~) taken literally. */
const crit = (text: string) => `"${text.replace(/[~*?]/g, (c) => `~${c}`).replace(/"/g, '""')}"`;
const cached = (v: Cell) => (isFormula(v) ? v.v : v);

/**
 * Turn the derived columns of an All units row into formulas, so editing a
 * rent or "In this batch" in Excel updates the row and the totals.
 */
function withRowFormulas(cells: Cell[], r: number): Cell[] {
  const at = (h: string) => `${L(h)}${r}`;
  const set = (h: string, f: string) => {
    const i = COLUMNS.findIndex((c) => c.header === h);
    cells[i] = { f, v: cached(cells[i]) ?? "" } satisfies Formula;
  };
  const [cur, street, inBatch, newRent, inc] = [at("Current rent"), at("Street rate"), at("In this batch"), at("New rent"), at("Increase $")];
  set("Current vs street", `IF(AND(ISNUMBER(${cur}),ISNUMBER(${street}),${street}>0),${cur}/${street}-1,"")`);
  set("Increase $", `IF(AND(${inBatch}="Yes",ISNUMBER(${newRent}),ISNUMBER(${cur})),${newRent}-${cur},"")`);
  set("Increase %", `IF(AND(ISNUMBER(${inc}),${cur}>0),${inc}/${cur},"")`);
  set("New rent vs street", `IF(AND(ISNUMBER(${inc}),ISNUMBER(${street}),${street}>0),${newRent}/${street}-1,"")`);
  return cells;
}

const unitSort = (a: string | null, b: string | null) =>
  (a ?? "").localeCompare(b ?? "", undefined, { numeric: true, sensitivity: "base" });

const vsStreet = (rent: number, street: number) => (street > 0 ? rent / street - 1 : null);

/** The Note column: why a tenant is or isn't in the batch, including hand changes. */
function noteFor(r: Row, rules: BatchRules): string {
  const c = r.c;
  if (r.fileNote) return noteOf(r, rules).label;
  if (c.reason === null && !r.included) return "Taken out by hand";
  if (c.reason === null && r.included && r.newRent !== c.newRent) return "Rent changed by hand";
  return noteOf(r, rules).label;
}

function tenantRow(r: Row, rules: BatchRules, asOf: string): Cell[] {
  const t = r.c.tenant;
  const months = t.leaseDate ? Math.floor((dayNum(asOf) - dayNum(t.leaseDate)) / 30.44) : null;
  const inBatch = r.included && r.newRent !== null;
  const inc = inBatch ? r.newRent! - t.rent : null;
  return [
    t.unitName,
    t.unitType,
    t.size,
    "Yes",
    t.ledgerId,
    t.leaseDate,
    months,
    t.rentLastChanged,
    t.rent,
    t.standardRate || null,
    vsStreet(t.rent, t.standardRate),
    inBatch ? "Yes" : "No",
    inBatch ? r.newRent : null,
    inc,
    inc !== null && t.rent > 0 ? inc / t.rent : null,
    inBatch ? vsStreet(r.newRent!, t.standardRate) : null,
    noteFor(r, rules),
    r.c.eligibleFrom,
    t.chargeBalance && t.chargeBalance > 0.5 ? t.chargeBalance : null,
    t.schedOut,
  ];
}

function vacantRow(u: VacantUnit, rules: BatchRules): Cell[] {
  const street = streetRateOf(u, rules.streetBasis) ?? 0;
  const note = !u.isRentable ? "Not rentable" : u.daysVacant != null ? `Vacant ${u.daysVacant} days` : "Vacant";
  return [u.unitName, u.unitType, u.size, "No", null, null, null, null, null, street || null, null, "No", null, null, null, null, note, null, null, null];
}

function eligibilityText(rules: BatchRules): string {
  if (rules.eligibility === "tenure") {
    let s = `Here at least ${rules.minTenureMonths} months by the effective date`;
    if (rules.onlyNeverRaised) s += ", never raised since moving in";
    else if (rules.minMonthsSinceLastChange > 0) s += `, not raised in the last ${rules.minMonthsSinceLastChange} months`;
    return s;
  }
  return `First increase ${rules.firstWaitMonths} months after the move-in special ends, then every ${rules.repeatWaitMonths} months`;
}

export async function buildBatchSpreadsheet(
  rows: Row[],
  vacant: VacantUnit[],
  rules: BatchRules,
  meta: BatchSheetMeta
): Promise<Uint8Array> {
  const tenantRows = [...rows].sort((a, b) => unitSort(a.c.tenant.unitName, b.c.tenant.unitName));
  const unitRows: Cell[][] = [
    ...tenantRows.map((r) => ({ unit: r.c.tenant.unitName, cells: tenantRow(r, rules, meta.snapshotDate) })),
    ...vacant.map((u) => ({ unit: u.unitName, cells: vacantRow(u, rules) })),
  ]
    .sort((a, b) => unitSort(a.unit, b.unit))
    .map((x, i) => withRowFormulas(x.cells, i + 2));

  const selected = rows.filter((r) => r.included && r.newRent !== null).map((r) => ({ tenant: r.c.tenant, newRent: r.newRent! }));
  const s = summarizeBatch(selected);

  const notes = new Map<string, number>();
  for (const r of rows) {
    if (r.included && r.newRent !== null) continue;
    const n = noteFor(r, rules) || "Not in batch";
    notes.set(n, (notes.get(n) ?? 0) + 1);
  }

  const byType = new Map<string, { units: number; occupied: number; inBatch: number; gain: number }>();
  const typeOf = (t: string) => {
    if (!byType.has(t)) byType.set(t, { units: 0, occupied: 0, inBatch: 0, gain: 0 });
    return byType.get(t)!;
  };
  for (const r of rows) {
    const g = typeOf(r.c.tenant.unitType);
    g.units++;
    g.occupied++;
    if (r.included && r.newRent !== null) {
      g.inBatch++;
      g.gain += r.newRent - r.c.tenant.rent;
    }
  }
  for (const u of vacant) typeOf(u.unitType).units++;

  const pairs: [string, Cell, CellFormat][] = [
    ["Store", meta.facilityName, "text"],
    ["Batch", meta.batchName || "(not saved yet)", "text"],
    ["Status", STATUS_LABEL[meta.status], "text"],
    ["Effective date", rules.effectiveDate, "date"],
    ["Rent roll date", meta.snapshotDate, "date"],
    ["Street rate", STREET_BASIS_LABEL[rules.streetBasis], "text"],
    ["", null, "text"],
    ["Rules", null, "text"],
    ["Who is eligible", eligibilityText(rules), "text"],
    ["Increase", rules.increasePct, "pct"],
    ["Raise below-street tenants to street", rules.raiseToStreet ? "Yes" : "No", "text"],
    ["Largest increase", rules.maxIncreaseDollars ?? "No limit", rules.maxIncreaseDollars === null ? "text" : "money"],
    ["Smallest increase", rules.minIncreaseDollars || "No minimum", rules.minIncreaseDollars ? "money" : "text"],
    ["Most over street after increase", rules.maxOverStreetPct ?? "No limit", rules.maxOverStreetPct === null ? "text" : "pct"],
    ["Skip tenants with a balance", rules.excludeWithBalance ? "Yes" : "No", "text"],
    ["Skip scheduled move-outs", rules.excludeScheduledMoveOut ? "Yes" : "No", "text"],
    ["Unit types left out", rules.excludedUnitTypes.join(", ") || "None", "text"],
    ["Sizes left out", rules.excludedSizes.join(", ") || "None", "text"],
    ["Batch size limit", rules.targetCount ?? "None", rules.targetCount === null ? "text" : "int"],
    ["", null, "text"],
    ["Totals (update as the All units sheet is edited)", null, "text"],
  ];
  // Summary rows are numbered from 1 (no header); totals refer to each other by row.
  const at = (label: string) => `B${pairs.findIndex(([k]) => k === label) + 1}`;
  const [occ, inB, cur, inc] = [ALL("Occupied"), ALL("In this batch"), ALL("Current rent"), ALL("Increase $")];
  const add = (label: string, f: string, v: number, format: CellFormat) => pairs.push([label, { f, v }, format]);
  add("Units in rent roll", `COUNTIF(${occ},"Yes")+COUNTIF(${occ},"No")`, rows.length + vacant.length, "int");
  add("Occupied units", `COUNTIF(${occ},"Yes")`, rows.length, "int");
  add("Tenants in this batch", `COUNTIF(${inB},"Yes")`, s.count, "int");
  add("Occupied, not in this batch", `COUNTIFS(${occ},"Yes",${inB},"No")`, rows.length - s.count, "int");
  add("Vacant or not rentable", `COUNTIF(${occ},"No")`, vacant.length, "int");
  add("Added rent per month", `SUMIFS(${inc},${inB},"Yes")`, s.monthlyGain, "money");
  add("Added rent per year", `${at("Added rent per month")}*12`, s.annualGain, "money");
  add("Average increase", `IFERROR(${at("Added rent per month")}/${at("Tenants in this batch")},0)`, s.avgIncreaseDollars, "money2");
  add("Average increase %", `IFERROR(SUMIFS(${inc},${inB},"Yes")/SUMIFS(${cur},${inB},"Yes"),0)`, s.avgIncreasePct, "pct");
  pairs.push(["", null, "text"], ["Why occupied units are not in the batch", null, "text"]);
  for (const [k, n] of [...notes.entries()].sort((a, b) => b[1] - a[1])) {
    // "Not in batch" stands for an empty Note cell.
    const note = k === "Not in batch" ? '""' : crit(k);
    add(k, `COUNTIFS(${occ},"Yes",${inB},"No",${ALL("Note")},${note})`, n, "int");
  }
  // Tenants taken out in the spreadsheet keep their old note, so they land here.
  const firstReason = pairs.length - notes.size + 1;
  add(
    "Other (changed in this spreadsheet)",
    notes.size
      ? `${at("Occupied, not in this batch")}-SUM(B${firstReason}:B${pairs.length})`
      : at("Occupied, not in this batch"),
    0,
    "int"
  );

  const type = ALL("Unit type");
  const typeRows: Cell[][] = [...byType.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t, g], i) => {
      const a = `$A${i + 2}`;
      return [
        t,
        { f: `COUNTIF(${type},${a})`, v: g.units },
        { f: `COUNTIFS(${type},${a},${occ},"Yes")`, v: g.occupied },
        { f: `COUNTIFS(${type},${a},${inB},"Yes")`, v: g.inBatch },
        { f: `SUMIFS(${inc},${type},${a},${inB},"Yes")`, v: g.gain },
      ];
    });

  return buildWorkbook([
    {
      name: "Summary",
      rows: pairs.map(([k, v]) => [k, v]),
      formats: pairs.map(([k, v, f]) => [k && v === null ? "heading" : "text", f]),
      widths: [40, 60],
    },
    {
      name: "All units",
      columns: COLUMNS,
      rows: unitRows,
      // Vacant units are in the file but filtered out on open; clear the Occupied filter to see them.
      filter: { column: COLUMNS.findIndex((c) => c.header === "Occupied"), show: ["Yes"] },
    },
    {
      name: "By unit type",
      columns: [
        { header: "Unit type", format: "text", width: 24 },
        { header: "Units", format: "int", width: 8 },
        { header: "Occupied", format: "int", width: 10 },
        { header: "In this batch", format: "int", width: 12 },
        { header: "Added rent per month", format: "money", width: 20 },
      ],
      rows: typeRows,
    },
  ]);
}

