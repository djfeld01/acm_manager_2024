"use client";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REASON_LABEL, type BatchRules, type Candidate, type ExclusionReason } from "../_lib/batch";
import { fmtMoney, fmtPct } from "./format";

export interface Row {
  c: Candidate;
  included: boolean;
  /** Rent that will be sent if included; null when no rent can be worked out. */
  newRent: number | null;
}

/** Reasons that mean there is no sensible rent to send, so a tenant can't be added by hand. */
const HARD_REASONS: ExclusionReason[] = ["missing-rate", "existing-scheduled-change", "at-street-cap", "increase-too-small"];

interface Props {
  rows: Row[];
  rules: BatchRules;
  locked: boolean;
  onToggle: (ledgerId: string, include: boolean) => void;
  onRent: (ledgerId: string, rent: number) => void;
}

type Filter = "included" | "excluded" | "all";
const PAGE = 100;

export function BatchCandidatesTable({ rows, rules, locked, onToggle, onRent }: Props) {
  const [filter, setFilter] = useState<Filter>("included");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (filter === "all" ? true : filter === "included" ? r.included : !r.included))
      .filter((r) => !q || (r.c.tenant.unitName ?? "").toLowerCase().includes(q) || r.c.tenant.unitType.toLowerCase().includes(q) || r.c.tenant.size.includes(q))
      .sort((a, b) => (a.c.ratio ?? 9) - (b.c.ratio ?? 9));
  }, [rows, filter, query]);

  const warn = (r: Row): string | null => {
    if (!r.included || r.newRent === null) return null;
    const t = r.c.tenant;
    if (r.newRent <= t.rent) return "Not an increase";
    if (r.newRent > t.standardRate * (1 + rules.maxOverStreetPct) + 0.5) return "Over the street cap";
    if (rules.maxIncreaseDollars !== null && r.newRent - t.rent > rules.maxIncreaseDollars) return "Over the max increase";
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants</CardTitle>
        <CardDescription>
          Sorted by how far each tenant is over street, lowest first. Tick or untick to adjust the batch; edit a new
          rent to override the rule. {locked && "This batch is finalized and can't be changed."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {(["included", "excluded", "all"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => { setFilter(f); setLimit(PAGE); }}>
              {f === "included" ? `In batch (${rows.filter((r) => r.included).length})` : f === "excluded" ? `Not in batch (${rows.filter((r) => !r.included).length})` : `All (${rows.length})`}
            </Button>
          ))}
          <Input className="w-56" placeholder="Search unit, type, size" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Unit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Rent</TableHead>
                <TableHead className="text-right">Street</TableHead>
                <TableHead className="text-right">Vs street</TableHead>
                <TableHead>Last changed</TableHead>
                <TableHead>Eligible from</TableHead>
                <TableHead className="text-right">New rent</TableHead>
                <TableHead className="text-right">After vs street</TableHead>
                <TableHead className="text-right">Leave in 90d</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.slice(0, limit).map((r) => {
                const t = r.c.tenant;
                const hard = r.c.reason !== null && HARD_REASONS.includes(r.c.reason);
                const w = warn(r);
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
                      {r.included && r.newRent !== null ? fmtPct(r.newRent / t.standardRate - 1) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{fmtPct(t.exit90, 1)}</TableCell>
                    <TableCell>
                      {w ? (
                        <Badge variant="destructive">{w}</Badge>
                      ) : r.c.reason && !r.included ? (
                        <span className="text-xs">{REASON_LABEL[r.c.reason]}</span>
                      ) : r.c.reason && r.included ? (
                        <Badge variant="outline">Added by hand</Badge>
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
