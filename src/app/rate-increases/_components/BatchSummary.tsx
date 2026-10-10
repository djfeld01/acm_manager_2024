"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BatchSummary as Summary, BatchTenant } from "../_lib/batch";
import type { SegmentContext } from "../actions/getBatchData";
import { breakdownNoun, breakdownTitle, type Breakdown } from "./Breakdown";
import { fmtMoney, fmtNum, fmtPct } from "./format";
import { Stat } from "./Stat";

interface Props {
  summary: Summary;
  selected: { tenant: BatchTenant; newRent: number }[];
  overall: SegmentContext | null;
  segments: SegmentContext[];
  by: Breakdown;
  excluded: string[];
  onToggleExcluded: (label: string) => void;
  locked: boolean;
}

const STATUS_CLASS = {
  healthy: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  watch: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
} as const;

export function BatchSummary({ summary, selected, overall, segments, by, excluded, onToggleExcluded, locked }: Props) {
  // How many MORE tenants than baseline leave because of the increase. Unknown
  // until Phase 3 measures it, so it is an input, not a claim.
  const [uplift, setUplift] = useState(25);
  const extraExits = summary.baselineExits.d90 * (uplift / 100);
  const avgRent = summary.count ? selected.reduce((a, s) => a + s.tenant.rent, 0) / summary.count : 0;
  const spareRefill90 = overall ? Math.max(0, overall.expectedMoveInsPerMonth - overall.expectedMoveOutsPerMonth) * 3 : 0;
  // Rent lost from the extra leavers if their units sit empty, per month.
  const lostPerMonth = extraExits * avgRent;

  const rowFor = (seg: SegmentContext) => {
    const inSeg = selected.filter((s) => (by === "size" ? s.tenant.size : s.tenant.unitType) === seg.label);
    return {
      seg,
      n: inSeg.length,
      gain: inSeg.reduce((a, s) => a + s.newRent - s.tenant.rent, 0),
      exits90: inSeg.reduce((a, s) => a + s.tenant.exit90, 0),
    };
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tenants in batch" value={fmtNum(summary.count)} sub={`${fmtPct(summary.avgIncreasePct, 1)} average increase (${fmtMoney(summary.avgIncreaseDollars, 2)})`} />
        <Stat label="Added rent" value={`${fmtMoney(summary.monthlyGain)}/mo`} sub={`${fmtMoney(summary.annualGain)} per year`} />
        <Stat label="Over street after" value={`${summary.overStreetAfter}`} sub={`${summary.overStreetBefore} today`} />
        <Stat label="Expected move-outs, 90 days" value={fmtNum(summary.baselineExits.d90, 1)} sub="From this group with no increase (baseline)" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What if the increase makes more people leave?</CardTitle>
          <CardDescription>
            We don&apos;t yet know how much a rate increase raises move-outs; the Tracking tab will measure it from real
            batches. For a rough guide, the April 2026 increase was followed by move-outs about 25–35% above normal for
            two months, then back to normal — suggestive, not proof.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label className="flex flex-wrap items-center gap-2">
            Suppose
            <Input
              type="number"
              min="0"
              className="w-24"
              value={uplift}
              onChange={(e) => setUplift(Math.max(0, Number(e.target.value) || 0))}
            />
            % more of these tenants leave than the baseline.
          </label>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              That is about <strong>{fmtNum(extraExits, 1)} extra move-outs</strong> over 90 days (on top of{" "}
              {fmtNum(summary.baselineExits.d90, 1)} expected anyway).
            </li>
            <li>
              Marketing can refill roughly <strong>{fmtNum(spareRefill90, 1)}</strong> more units than are leaving over
              the same 90 days{overall?.status ? ` (overall demand: ${overall.status})` : ""}.
            </li>
            <li>
              If those extra units sat empty, they would cost about <strong>{fmtMoney(lostPerMonth)}/mo</strong> against{" "}
              <strong>{fmtMoney(summary.monthlyGain)}/mo</strong> gained
              {lostPerMonth > summary.monthlyGain ? (
                <span className="text-destructive"> — the batch would lose money until they refill.</span>
              ) : (
                "."
              )}
            </li>
            <li>
              Break-even: if more than <strong>{fmtNum(summary.breakEvenTenants, 1)} tenants</strong> leave and are never
              replaced, the gain is gone.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batch by {breakdownNoun(by)}</CardTitle>
          <CardDescription>
            Demand status is how well marketing refills that {breakdownNoun(by)}. Exclude any you want to hold back.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{breakdownTitle(by)}</TableHead>
                <TableHead>Demand</TableHead>
                <TableHead className="text-right">In batch</TableHead>
                <TableHead className="text-right">of tenants</TableHead>
                <TableHead className="text-right">Added rent/mo</TableHead>
                <TableHead className="text-right">Exp. move-outs 90d (batch)</TableHead>
                <TableHead className="text-right">Vacant now</TableHead>
                <TableHead className="text-right">Hold back</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((seg) => {
                const r = rowFor(seg);
                const isOut = excluded.includes(seg.label);
                return (
                  <TableRow key={seg.label} className={isOut ? "opacity-60" : ""}>
                    <TableCell>{seg.label}</TableCell>
                    <TableCell>
                      {seg.status ? (
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[seg.status]}`}>
                          {seg.status}
                        </span>
                      ) : (
                        "—"
                      )}
                      {seg.lowSample && (
                        <Badge variant="outline" className="ml-1">
                          small sample
                        </Badge>
                      )}
                      {seg.status === "low" && r.n > 0 && (
                        <span className="ml-2 text-xs text-destructive">refill risk</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{r.n}</TableCell>
                    <TableCell className="text-right">{seg.tenants}</TableCell>
                    <TableCell className="text-right">{fmtMoney(r.gain)}</TableCell>
                    <TableCell className="text-right">{fmtNum(r.exits90, 1)}</TableCell>
                    <TableCell className="text-right">{seg.vacantUnits}</TableCell>
                    <TableCell className="text-right">
                      <input
                        type="checkbox"
                        aria-label={`Hold back ${seg.label}`}
                        disabled={locked}
                        checked={isOut}
                        onChange={() => onToggleExcluded(seg.label)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
