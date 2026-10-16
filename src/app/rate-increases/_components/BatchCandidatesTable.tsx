"use client";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type BatchRules, type ExclusionReason } from "../_lib/batch";
import {
  NO_FILTERS,
  applyFilters,
  facets,
  hasExtraFilters,
  noteOf,
  sortRows,
  type Filters,
  type Row,
  type SortDir,
  type SortKey,
  type StatusFilter,
} from "../_lib/tableView";
import { fmtMoney, fmtPct } from "./format";

export type { Row } from "../_lib/tableView";

/** Reasons that mean there is no sensible rent to send, so a tenant can't be added by hand. */
const HARD_REASONS: ExclusionReason[] = ["missing-rate", "existing-scheduled-change", "in-other-batch", "at-street-cap", "increase-too-small"];

interface Props {
  rows: Row[];
  rules: BatchRules;
  locked: boolean;
  onToggle: (ledgerId: string, include: boolean) => void;
  onRent: (ledgerId: string, rent: number) => void;
}

const PAGE = 100;

const COLUMNS: { key: SortKey; label: string; right?: boolean }[] = [
  { key: "unit", label: "Unit" },
  { key: "type", label: "Type" },
  { key: "size", label: "Size" },
  { key: "rent", label: "Rent", right: true },
  { key: "street", label: "Street", right: true },
  { key: "vsStreet", label: "Vs street", right: true },
  { key: "lastChanged", label: "Last changed" },
  { key: "eligible", label: "Eligible from" },
  { key: "newRent", label: "New rent", right: true },
  { key: "after", label: "After vs street", right: true },
  { key: "risk", label: "Leave in 90d", right: true },
  { key: "note", label: "Note" },
];

/** First click on a column: the direction people usually want first. */
const FIRST_DIR: Partial<Record<SortKey, SortDir>> = { risk: "desc", included: "desc" };

const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

function SortHeader({
  col,
  sort,
  onSort,
}: {
  col: { key: SortKey; label: string; right?: boolean };
  sort: { key: SortKey; dir: SortDir };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === col.key;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={col.right ? "text-right" : ""}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(col.key)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${col.right ? "flex-row-reverse" : ""} ${
          active ? "text-foreground" : ""
        }`}
      >
        {col.label}
        <Icon className={`h-3 w-3 ${active ? "" : "opacity-40"}`} />
      </button>
    </TableHead>
  );
}

export function BatchCandidatesTable({ rows, rules, locked, onToggle, onRent }: Props) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "vsStreet", dir: "asc" });
  const [limit, setLimit] = useState(PAGE);

  const change = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  };
  const onSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: FIRST_DIR[key] ?? "asc" }));
    setLimit(PAGE);
  };

  const options = useMemo(() => facets(rows, rules), [rows, rules]);
  const shown = useMemo(
    () => sortRows(applyFilters(rows, filters, rules), sort.key, sort.dir, rules),
    [rows, filters, sort, rules]
  );

  const inBatchCount = rows.filter((r) => r.included).length;
  const shownIncluded = shown.filter((r) => r.included && r.newRent !== null);
  const shownGain = shownIncluded.reduce((a, r) => a + (r.newRent! - r.c.tenant.rent), 0);
  const sortLabel = COLUMNS.find((c) => c.key === sort.key)?.label ?? (sort.key === "included" ? "In batch" : "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants</CardTitle>
        <CardDescription>
          Click a column heading to sort; use the filters to narrow the list. Tick or untick to adjust the batch; edit a
          new rent to override the rule. {locked && "This batch is finalized and can't be changed."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {(["included", "excluded", "all"] as StatusFilter[]).map((f) => (
            <Button key={f} size="sm" variant={filters.status === f ? "default" : "outline"} onClick={() => change({ status: f })}>
              {f === "included"
                ? `In batch (${inBatchCount})`
                : f === "excluded"
                  ? `Not in batch (${rows.length - inBatchCount})`
                  : `All (${rows.length})`}
            </Button>
          ))}
          <Input
            className="w-52"
            placeholder="Search unit, type, size"
            value={filters.query}
            onChange={(e) => change({ query: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select aria-label="Filter by unit type" className={selectClass} value={filters.unitType} onChange={(e) => change({ unitType: e.target.value })}>
            <option value="">All unit types</option>
            {options.types.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
          <select aria-label="Filter by size" className={selectClass} value={filters.size} onChange={(e) => change({ size: e.target.value })}>
            <option value="">All sizes</option>
            {options.sizes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
          <select aria-label="Filter by street position" className={selectClass} value={filters.band} onChange={(e) => change({ band: e.target.value })}>
            <option value="">Any street position</option>
            {options.bands.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
          <select aria-label="Filter by note" className={selectClass} value={filters.note} onChange={(e) => change({ note: e.target.value })}>
            <option value="">Any note</option>
            {options.notes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
          {hasExtraFilters(filters) && (
            <Button size="sm" variant="ghost" onClick={() => change({ query: "", unitType: "", size: "", note: "", band: "" })}>
              Clear filters
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {shown.length} of {rows.length} tenants
          {shownIncluded.length > 0 &&
            ` · ${shownIncluded.length} in the batch here, adding ${fmtMoney(shownGain)}/mo`}
          {` · sorted by ${sortLabel.toLowerCase()} (${sort.dir === "asc" ? "low to high" : "high to low"})`}
        </p>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" aria-sort={sort.key === "included" ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                  <button
                    type="button"
                    title="Sort by in batch"
                    aria-label="Sort by in batch"
                    onClick={() => onSort("included")}
                    className="inline-flex items-center"
                  >
                    {sort.key === "included" ? (
                      sort.dir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                </TableHead>
                {COLUMNS.map((col) => (
                  <SortHeader key={col.key} col={col} sort={sort} onSort={onSort} />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.slice(0, limit).map((r) => {
                const t = r.c.tenant;
                const hard = r.c.reason !== null && HARD_REASONS.includes(r.c.reason);
                const note = noteOf(r, rules);
                return (
                  <TableRow key={t.ledgerId} className={r.included ? "" : "text-muted-foreground"}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Include unit ${t.unitName}`}
                        disabled={locked || (hard && !r.included)}
                        checked={r.included}
                        onChange={(e) => onToggle(t.ledgerId, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>{t.unitName}</TableCell>
                    <TableCell>{t.unitType}</TableCell>
                    <TableCell>{t.size}</TableCell>
                    <TableCell className="text-right">{fmtMoney(t.rent)}</TableCell>
                    <TableCell className="text-right">{fmtMoney(t.standardRate)}</TableCell>
                    <TableCell className="text-right">{r.c.ratio === null ? "—" : fmtPct(r.c.ratio - 1)}</TableCell>
                    <TableCell>{t.rentLastChanged ?? "—"}</TableCell>
                    <TableCell>
                      {r.c.eligibleFrom ?? "—"}
                      {r.c.specialAssumed && <span title="No move-in record, so no special was assumed"> *</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.included && !locked ? (
                        <Input
                          type="number"
                          className="h-8 w-24 text-right"
                          value={r.newRent ?? ""}
                          onChange={(e) => onRent(t.ledgerId, Math.round(Number(e.target.value)))}
                        />
                      ) : (
                        fmtMoney(r.included ? r.newRent : null)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.included && r.newRent !== null && t.standardRate > 0 ? fmtPct(r.newRent / t.standardRate - 1) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{fmtPct(t.exit90, 1)}</TableCell>
                    <TableCell>
                      {note.key === "warning" ? (
                        <Badge variant="destructive">{note.label}</Badge>
                      ) : note.key === "by-hand" ? (
                        <Badge variant="outline">{note.label}</Badge>
                      ) : note.key !== "suggested" ? (
                        <span className="text-xs">{note.label}</span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {shown.length > limit && (
          <Button variant="outline" size="sm" onClick={() => setLimit(limit + PAGE)}>
            Show more ({shown.length - limit} left)
          </Button>
        )}
        {shown.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No tenants match.</p>}
      </CardContent>
    </Card>
  );
}
