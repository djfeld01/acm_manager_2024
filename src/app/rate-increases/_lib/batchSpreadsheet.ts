import { dayNum } from "./analytics";
import { summarizeBatch, type BatchRules } from "./batch";
import { STREET_BASIS_LABEL, streetRateOf } from "./street";
import { noteOf, type Row } from "./tableView";
import { buildWorkbook, type Cell, type CellFormat, type Column } from "./xlsxWriter";
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
  { header: "Current rent", format: "money2", width: 13 },
  { header: "Street rate", format: "money2", width: 12 },
  { header: "Current vs street", format: "pct", width: 16 },
  { header: "In this batch", format: "text", width: 13 },
  { header: "New rent", format: "money2", width: 11 },
  { header: "Increase $", format: "money2", width: 11 },
  { header: "Increase %", format: "pct", width: 10 },
  { header: "New rent vs street", format: "pct", width: 17 },
  { header: "Note", format: "text", width: 34 },
  { header: "Eligible from", format: "date", width: 13 },
  { header: "Balance owed", format: "money2", width: 13 },
  { header: "Scheduled move-out", format: "date", width: 18 },
];

const unitSort = (a: string | null, b: string | null) =>
  (a ?? "").localeCompare(b ?? "", undefined, { numeric: true, sensitivity: "base" });

const vsStreet = (rent: number, street: number) => (street > 0 ? rent / street - 1 : null);

/** The Note column: why a tenant is or isn't in the batch, including hand changes. */
function noteFor(r: Row, rules: BatchRules): string {
  const c = r.c;
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
    .map((x) => x.cells);

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
    ["Totals", null, "text"],
    ["Units in rent roll", rows.length + vacant.length, "int"],
    ["Occupied units", rows.length, "int"],
    ["Tenants in this batch", s.count, "int"],
    ["Occupied, not in this batch", rows.length - s.count, "int"],
    ["Vacant or not rentable", vacant.length, "int"],
    ["Added rent per month", s.monthlyGain, "money"],
    ["Added rent per year", s.annualGain, "money"],
    ["Average increase", s.avgIncreaseDollars, "money2"],
    ["Average increase %", s.avgIncreasePct, "pct"],
    ["", null, "text"],
    ["Why occupied units are not in the batch", null, "text"],
    ...[...notes.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]): [string, Cell, CellFormat] => [k, n, "int"]),
  ];

  const typeRows = [...byType.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t, g]) => [t, g.units, g.occupied, g.inBatch, g.gain]);

  return buildWorkbook([
    {
      name: "Summary",
      rows: pairs.map(([k, v]) => [k, v]),
      formats: pairs.map(([k, v, f]) => [k && v === null ? "heading" : "text", f]),
      widths: [40, 60],
    },
    { name: "All units", columns: COLUMNS, rows: unitRows },
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

