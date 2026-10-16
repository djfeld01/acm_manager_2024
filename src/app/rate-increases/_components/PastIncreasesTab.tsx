"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { detectablePct } from "../_lib/cohort";
import { compareSizes } from "../_lib/unitTypes";
import type { WaveResponse } from "../_lib/waves";
import { getPastIncreases, type WaveGroup } from "../actions/pastIncreases";
import { breakdownNoun, breakdownTitle, type Breakdown } from "./Breakdown";
import { fmtMoney, fmtNum, fmtPct } from "./format";
import { ReportImport } from "./ReportImport";
import { Stat, TabLoading } from "./Stat";

const pct = (x: number, digits = 0) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(digits)}%`;
const monthName = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

function groupBy(groups: WaveGroup[], by: Breakdown) {
  const m = new Map<string, WaveGroup & { n: number }>();
  for (const g of groups) {
    const key = by === "size" ? g.size : g.unitType;
    const cur = m.get(key) ?? { ...g, unitType: key, size: key, unitsRaised: 0, avgPct: 0, aboveStandard: 0, moveouts90: 0, n: 0 };
    cur.avgPct = cur.unitsRaised + g.unitsRaised ? (cur.avgPct * cur.unitsRaised + g.avgPct * g.unitsRaised) / (cur.unitsRaised + g.unitsRaised) : 0;
    cur.unitsRaised += g.unitsRaised;
    cur.aboveStandard += g.aboveStandard;
    cur.moveouts90 += g.moveouts90;
    m.set(key, cur);
  }
  const rows = Array.from(m.entries()).map(([label, g]) => ({ label, ...g }));
  return by === "size" ? rows.sort((a, b) => compareSizes(a.label, b.label)) : rows.sort((a, b) => b.unitsRaised - a.unitsRaised);
}

function WaveRow({ w, selected, onSelect }: { w: WaveResponse; selected: boolean; onSelect: () => void }) {
  const r = w.response;
  return (
    <TableRow className={selected ? "bg-muted/50" : "cursor-pointer"} onClick={onSelect}>
      <TableCell className="font-medium">{monthName(w.month)}</TableCell>
      <TableCell className="text-right">{fmtNum(w.unitsRaised)}</TableCell>
      <TableCell className="text-right">{w.share === null ? "—" : fmtPct(w.share)}</TableCell>
      <TableCell className="text-right">{w.avgPct.toFixed(1)}%</TableCell>
      <TableCell className="text-right">{w.aboveStreetShare === null ? "—" : fmtPct(w.aboveStreetShare)}</TableCell>
      <TableCell className="text-right">{fmtMoney(w.dollarsAdded)}</TableCell>
      <TableCell className="text-right">{r ? `${r.exits} vs ${fmtNum(r.expected, 1)}` : "—"}</TableCell>
      <TableCell className="text-right">
        {r ? (
          <span className={r.excessLow > 0 ? "font-semibold text-destructive" : ""}>
            {pct(r.excess)} <span className="text-xs text-muted-foreground">({pct(r.excessLow)} to {pct(r.excessHigh)})</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{w.note}</span>
        )}
      </TableCell>
      <TableCell className="text-right text-xs">{r ? r.perMonth.map((p) => `${p.ratio.toFixed(2)}×`).join("  ") : "—"}</TableCell>
      <TableCell className="text-right">
        {w.occupancyBefore !== null && w.occupancyAfter !== null ? `${w.occupancyBefore} → ${w.occupancyAfter}` : "—"}
      </TableCell>
    </TableRow>
  );
}

export function PastIncreasesTab({ by }: { by: Breakdown }) {
  const q = useQuery({ queryKey: ["rateInc", "past"], queryFn: () => getPastIncreases() });
  const [picked, setPicked] = useState<string | null>(null);
  const [pickedWave, setPickedWave] = useState<string | null>(null);

  const data = q.data;
  const fac = data ? (data.facilities.find((f) => f.sitelinkId === picked) ?? data.facilities[0]) : undefined;
  const waves = fac?.waves.filter((w) => w.isWave) ?? [];
  const small = fac?.waves.filter((w) => !w.isWave) ?? [];
  const wave = waves.find((w) => w.month === pickedWave) ?? waves[0];
  const detail = fac && wave ? groupBy(data!.groups[`${fac.sitelinkId}|${wave.month}`] ?? [], by) : [];
  const summary = data?.imports.find((i) => i.sitelinkId === fac?.sitelinkId);

  return (
    <div className="space-y-6">
      <ReportImport />

      {!data ? (
        <TabLoading isLoading={q.isLoading} error={q.error} />
      ) : data.facilities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing imported yet. Upload the two reports above and past increases will show up here.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>What past increases did to move-outs</CardTitle>
              <CardDescription>
                For each big increase, move-outs in the three months from the increase compared with the same facility&apos;s
                usual rate in months with no increase nearby. Move-outs come from our own records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.pooled ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Stat
                      label="Move-outs vs usual"
                      value={pct(data.pooled.excess)}
                      sub={`95% range ${pct(data.pooled.excessLow)} to ${pct(data.pooled.excessHigh)}`}
                    />
                    <Stat
                      label="Based on"
                      value={`${data.pooled.waves} increase${data.pooled.waves === 1 ? "" : "s"}`}
                      sub={`${data.pooled.facilities} facilit${data.pooled.facilities === 1 ? "y" : "ies"} · ${data.pooled.exits} move-outs vs ${fmtNum(data.pooled.expected, 0)} usual`}
                    />
                    <Stat
                      label="Smallest effect detectable"
                      value={(() => {
                        const d = detectablePct(data.pooled.expected);
                        return d === null ? "—" : `~${Math.round(d)}%`;
                      })()}
                      sub="Smaller effects can't be told from chance with this much data"
                    />
                  </div>
                  <p className="text-muted-foreground">
                    {data.pooled.waves < 3
                      ? "Only a few increases so far, so treat this as a rough guide, not a forecast. Each report you add makes it sturdier."
                      : "This pools every measured increase. Individual increases will vary around it."}{" "}
                    The comparison ignores season and how long tenants had been in their units, so it is approximate; the Length
                    of Stay tab accounts for both.
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No increase has a measurable result yet. One needs three full months after it and a few comparison months
                  without an increase, from both reports.
                </p>
              )}
            </CardContent>
          </Card>

          {data.facilities.length > 1 && (
            <div className="flex flex-wrap gap-2 text-sm">
              {data.facilities.map((f) => (
                <Button key={f.sitelinkId} size="sm" variant={f.sitelinkId === fac?.sitelinkId ? "default" : "outline"} onClick={() => { setPicked(f.sitelinkId); setPickedWave(null); }}>
                  {f.name}
                </Button>
              ))}
            </div>
          )}

          {fac && (
            <Card>
              <CardHeader>
                <CardTitle>{fac.name}</CardTitle>
                <CardDescription>
                  {summary?.waveMonths && `Increases: ${monthName(summary.waveMonths.from)} to ${monthName(summary.waveMonths.to)}. `}
                  {summary?.occupancyMonths && `Occupancy: ${monthName(summary.occupancyMonths.from)} to ${monthName(summary.occupancyMonths.to)}. `}
                  {fac.referenceRate !== null
                    ? `Usual move-out rate: ${(fac.referenceRate * 100).toFixed(1)}% of occupied units a month (${fac.referenceMonths.length} comparison months, ${fac.referenceExits} move-outs).`
                    : "Not enough comparison months without an increase to say what is usual."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 overflow-x-auto">
                {waves.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No large increase in the months imported. {small.length > 0 && "Only small ones (listed below)."}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Increase month</TableHead>
                        <TableHead className="text-right">Units raised</TableHead>
                        <TableHead className="text-right">Of occupied</TableHead>
                        <TableHead className="text-right">Avg increase</TableHead>
                        <TableHead className="text-right">Above street</TableHead>
                        <TableHead className="text-right">Added/mo</TableHead>
                        <TableHead className="text-right">Move-outs, 3 mo</TableHead>
                        <TableHead className="text-right">Vs usual (95% range)</TableHead>
                        <TableHead className="text-right">Month by month</TableHead>
                        <TableHead className="text-right">Occupied units</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waves.map((w) => (
                        <WaveRow key={w.month} w={w} selected={w.month === wave?.month} onSelect={() => setPickedWave(w.month)} />
                      ))}
                    </TableBody>
                  </Table>
                )}
                {small.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Smaller changes, too small to count as an increase wave:{" "}
                    {small.map((s) => `${monthName(s.month)} (${s.unitsRaised})`).join(", ")}.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {fac && wave && detail.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {monthName(wave.month)} increase, by {breakdownNoun(by)} <Badge variant="outline">SiteLink&apos;s counts</Badge>
                </CardTitle>
                <CardDescription>
                  Move-outs here are SiteLink&apos;s own count of raised units that moved out within 90 days. They don&apos;t
                  line up exactly with our records (SiteLink may measure the windows differently), so use them to compare{" "}
                  {breakdownNoun(by)}s with each other, not as the headline number above.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{breakdownTitle(by)}</TableHead>
                      <TableHead className="text-right">Units raised</TableHead>
                      <TableHead className="text-right">Avg increase</TableHead>
                      <TableHead className="text-right">Above street</TableHead>
                      <TableHead className="text-right">Moved out within 90 days</TableHead>
                      <TableHead className="text-right">Share of raised</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.map((g) => (
                      <TableRow key={g.label}>
                        <TableCell>{g.label}</TableCell>
                        <TableCell className="text-right">{g.unitsRaised}</TableCell>
                        <TableCell className="text-right">{g.avgPct.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{g.unitsRaised ? fmtPct(g.aboveStandard / g.unitsRaised) : "—"}</TableCell>
                        <TableCell className="text-right">{g.moveouts90}</TableCell>
                        <TableCell className="text-right">{g.unitsRaised ? fmtPct(g.moveouts90 / g.unitsRaised, 1) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
