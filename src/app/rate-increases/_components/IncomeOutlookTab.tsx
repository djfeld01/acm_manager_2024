"use client";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RISK_LABEL, type PremiumRisk } from "../_lib/outlook";
import { STREET_BASIS_LABEL, type StreetBasis } from "../_lib/street";
import { listBatches } from "../actions/batches";
import { getIncomeOutlook } from "../actions/getIncomeOutlook";
import { FanChart, type FanLine } from "./FanChart";
import { fmtMoney, fmtNum, fmtPct } from "./format";
import { Stat, TabLoading } from "./Stat";

const HORIZONS = [12, 18, 24] as const;
const UPLIFTS = [0, 10, 25, 50, 100] as const;
const RISKS: PremiumRisk[] = ["none", "moderate", "strong"];
const RISK_SHORT: Record<PremiumRisk, string> = { none: "Equal", moderate: "Moderate", strong: "Strong" };

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmtMoney(Math.abs(n))}`;
const k = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1000) return `${sign}$${(a / 1000).toFixed(a % 1000 === 0 ? 0 : 1)}k`;
  return fmtMoney(n);
};

export function IncomeOutlookTab({ sitelinkId, street }: { sitelinkId: string; street: StreetBasis }) {
  const [horizon, setHorizon] = useState<number>(12);
  const [risk, setRisk] = useState<PremiumRisk>("moderate");
  const [batchId, setBatchId] = useState<number | null>(null);
  const [uplift, setUplift] = useState<number>(25);
  const [cumView, setCumView] = useState<"gap" | "total">("gap");

  const batchesQ = useQuery({ queryKey: ["rateInc", "batches", sitelinkId], queryFn: () => listBatches(sitelinkId) });
  const q = useQuery({
    queryKey: ["rateInc", "outlook", sitelinkId, street, horizon, batchId, uplift],
    queryFn: () => getIncomeOutlook(sitelinkId, { basis: street, horizon, batchId, upliftPct: uplift }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
  const o = q.data;

  const charts = useMemo(() => {
    if (!o) return null;
    const sel = o.runs[risk];
    const alts = RISKS.filter((r) => r !== risk);
    const hasBatch = !!sel.withBatch;
    const monthly = o.months.map((m, i) => {
      const row: Record<string, number | string | [number, number]> = {
        label: m.label,
        band: [sel.base.income[i]!.p10, sel.base.income[i]!.p90],
        median: sel.base.income[i]!.p50,
      };
      if (hasBatch) {
        row.bandB = [sel.withBatch!.income[i]!.p10, sel.withBatch!.income[i]!.p90];
        row.medianB = sel.withBatch!.income[i]!.p50;
      }
      for (const a of alts) row[`alt_${a}`] = o.runs[a].base.income[i]!.p50;
      return row;
    });
    const cumulative = o.months.map((m, i) => {
      const flat = o.startIncome * (i + 1);
      const adj = (v: number) => (cumView === "gap" ? v - flat : v);
      const row: Record<string, number | string | [number, number]> = {
        label: m.label,
        band: [adj(sel.base.cumulative[i]!.p10), adj(sel.base.cumulative[i]!.p90)],
        median: adj(sel.base.cumulative[i]!.p50),
      };
      if (hasBatch) {
        row.bandB = [adj(sel.withBatch!.cumulative[i]!.p10), adj(sel.withBatch!.cumulative[i]!.p90)];
        row.medianB = adj(sel.withBatch!.cumulative[i]!.p50);
      }
      for (const a of alts) row[`alt_${a}`] = adj(o.runs[a].base.cumulative[i]!.p50);
      if (cumView === "total") row.flat = flat;
      return row;
    });
    return { monthly, cumulative, hasBatch, alts };
  }, [o, risk, cumView]);

  if (!o || !charts) {
    return q.isLoading ? (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Simulating the next {horizon} months…
      </div>
    ) : (
      <TabLoading isLoading={false} error={q.error ?? new Error("Upload a rent roll first.")} />
    );
  }

  const sel = o.runs[risk];
  const H = o.horizon;
  const last = H - 1;
  const flatTotal = o.startIncome * H;
  const endTotal = sel.base.cumulative[last]!;
  const totalPremium = sel.bands.reduce((a, b) => a + b.premium, 0);
  const totalRent = sel.bands.reduce((a, b) => a + b.rent, 0);
  const batch = o.batch;
  const bt = sel.withBatch?.cumulative[last];

  const monthlyLines: FanLine[] = [
    { key: "median", name: batch ? "No increase (middle outcome)" : "Middle outcome", color: "#3b82f6" },
    ...(charts.hasBatch ? [{ key: "medianB", name: `With ${batch!.name} (middle)`, color: "#f59e0b" } as FanLine] : []),
    ...charts.alts.map((a) => ({ key: `alt_${a}`, name: `If: ${RISK_LABEL[a].toLowerCase()}`, color: "#64748b", dashed: true, thin: true }) as FanLine),
  ];
  const cumLines: FanLine[] = [
    ...monthlyLines,
    ...(cumView === "total" ? [{ key: "flat", name: "Today's rent roll, never changing", color: "#94a3b8", dashed: true } as FanLine] : []),
  ];
  const bandsDef = [
    { key: "band", name: batch ? "No increase: middle 80% of outcomes" : "Middle 80% of outcomes", color: "#3b82f6" },
    ...(charts.hasBatch ? [{ key: "bandB", name: "With the increase: middle 80%", color: "#f59e0b" }] : []),
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        A projection of rental income for {H} months, built by following every tenant: each can leave in any month, a vacated
        unit is re-let at about street rate, and a tenant paying well above street takes the extra with them when they go.
        It is run {fmtNum(400)} times with random draws; the shaded band is the middle 80% of those runs. Street rate here is the{" "}
        <strong>{STREET_BASIS_LABEL[street].toLowerCase()}</strong> (change it at the top of the page). Rent roll as of {o.asOf}.
      </p>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-x-8 gap-y-4 pt-6 text-sm">
          <div className="space-y-1">
            <div className="font-medium">Months ahead</div>
            <div className="inline-flex rounded-md border p-0.5">
              {HORIZONS.map((h) => (
                <Button key={h} size="sm" className="h-7 px-3" variant={horizon === h ? "default" : "ghost"} onClick={() => setHorizon(h)}>
                  {h}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="font-medium" title="How much more likely tenants far over street are to leave than tenants near street. Not measured anywhere, so try all three.">
              Tenants far over street are…
            </div>
            <div className="inline-flex rounded-md border p-0.5">
              {RISKS.map((r) => (
                <Button key={r} size="sm" className="h-7 px-3" variant={risk === r ? "default" : "ghost"} onClick={() => setRisk(r)} title={RISK_LABEL[r]}>
                  {r === "none" ? "equally likely to leave" : r === "moderate" ? "moderately more likely" : "much more likely"}
                </Button>
              ))}
            </div>
          </div>
          <label className="space-y-1">
            <div className="font-medium">Compare with a rate increase</div>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={batchId ?? ""}
              onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">None</option>
              {(batchesQ.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.effectiveDate} · {b.tenants} tenants ({b.status})
                </option>
              ))}
            </select>
          </label>
          {batchId !== null && (
            <label className="space-y-1">
              <div className="font-medium">Extra move-outs for 3 months after it</div>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={uplift} onChange={(e) => setUplift(Number(e.target.value))}>
                {UPLIFTS.map((u) => (
                  <option key={u} value={u}>
                    {u === 0 ? "none" : `${u}% more than usual`}
                  </option>
                ))}
              </select>
            </label>
          )}
          {q.isFetching && <Loader2 className="mb-2 h-4 w-4 animate-spin text-muted-foreground" />}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Rental income today" value={`${fmtMoney(o.startIncome)}/mo`} sub={`${o.tenants} tenants · ${o.vacantUnits} vacant units`} />
        <Stat
          label={`Income in month ${H}`}
          value={`${fmtMoney(sel.base.income[last]!.p50)}/mo`}
          sub={`Range ${fmtMoney(sel.base.income[last]!.p10)} to ${fmtMoney(sel.base.income[last]!.p90)}`}
        />
        <Stat
          label={`Total over ${H} months`}
          value={fmtMoney(endTotal.p50)}
          sub={`${signed(endTotal.p50 - flatTotal)} vs today's rent roll held flat · range ${k(endTotal.p10)} to ${k(endTotal.p90)}`}
        />
        <Stat
          label="Premium above street today"
          value={`${fmtMoney(totalPremium)}/mo`}
          sub={`${fmtPct(totalRent ? totalPremium / totalRent : 0)} of income — goes when these tenants leave`}
        />
      </div>

      {batch && bt && (
        <Card>
          <CardHeader>
            <CardTitle>
              {batch.name}: {signed(bt.p50 - endTotal.p50)} over {H} months
            </CardTitle>
            <CardDescription>
              {batch.tenants} tenants, +{fmtMoney(batch.monthlyGain)}/mo if nobody left, effective {batch.effectiveDate} (month {batch.effectiveMonth}).
              {uplift > 0 ? ` Assumes ${uplift}% more of them leave than usual for the first 3 months.` : " Assumes no extra move-outs."}{" "}
              Total with it: {fmtMoney(bt.p50)} (range {k(bt.p10)} to {k(bt.p90)}) against {fmtMoney(endTotal.p50)} without.
              {!batch.visible && ` The increase starts after the ${H} months shown, so it has no effect here — pick a longer horizon.`}
            </CardDescription>
          </CardHeader>
          {o.sensitivity && (
            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">How many more move-outs before it stops paying?</div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Extra move-outs after the increase</TableHead>
                      {o.sensitivity.map((s) => (
                        <TableHead key={s.uplift} className="text-right">
                          {s.uplift === 0 ? "None" : `${Math.round(s.uplift * 100)}% more`}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Change in income over {H} months</TableCell>
                      {o.sensitivity.map((s) => (
                        <TableCell key={s.uplift} className={`text-right font-medium ${s.delta < 0 ? "text-destructive" : ""}`}>
                          {signed(s.delta)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-muted-foreground">
                {o.breakEvenUplift !== null
                  ? `The increase stops paying if the raised tenants leave about ${Math.round(o.breakEvenUplift * 100)}% more than usual for three months. For reference, the April 2026 increase at Columbus was followed by roughly 25% more.`
                  : "Within the range tried, the increase still pays for itself."}{" "}
                (Moderate assumption about who leaves.)
              </p>
            </CardContent>
          )}
        </Card>
      )}

      <FanChart
        title="Monthly rental income"
        description={`${RISK_LABEL[risk]}. The dashed grey lines show the middle outcome if tenants far over street were more or less likely to leave.`}
        data={charts.monthly as never}
        bands={bandsDef}
        lines={monthlyLines}
        reference={{ value: o.startIncome, label: "Today" }}
        format={(n) => fmtMoney(n)}
        axisFormat={k}
      />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Cumulative income, shown as</span>
          <div className="inline-flex rounded-md border p-0.5">
            <Button size="sm" className="h-7 px-3" variant={cumView === "gap" ? "default" : "ghost"} onClick={() => setCumView("gap")}>
              Versus holding today&apos;s income flat
            </Button>
            <Button size="sm" className="h-7 px-3" variant={cumView === "total" ? "default" : "ghost"} onClick={() => setCumView("total")}>
              Running total
            </Button>
          </div>
        </div>
        <FanChart
          title={cumView === "gap" ? "Cumulative income versus holding today's income flat" : "Cumulative income"}
          description={
            cumView === "gap"
              ? "Zero means income stayed exactly where it is today. Below zero is income lost to turnover (and, if a rate increase is picked, above zero is what it adds)."
              : "Total rental income collected from now to each month."
          }
          data={charts.cumulative as never}
          bands={bandsDef}
          lines={cumLines}
          reference={cumView === "gap" ? { value: 0, label: "No change" } : undefined}
          format={(n) => (cumView === "gap" ? signed(n) : fmtMoney(n))}
          axisFormat={cumView === "gap" ? (n) => (n === 0 ? "$0" : k(n)) : k}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Where the premium sits</CardTitle>
          <CardDescription>
            Tenants grouped by how far their rent is above street. When one leaves, the unit is re-let at about street, so the
            &quot;premium&quot; is what the store loses. Below-street tenants are the opposite: their units re-let for more.
            Over {H} months, under the assumption selected above.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rent versus street</TableHead>
                <TableHead className="text-right">Tenants</TableHead>
                <TableHead className="text-right">Monthly rent</TableHead>
                <TableHead className="text-right">Premium above street</TableHead>
                <TableHead className="text-right">Expected to leave</TableHead>
                <TableHead className="text-right">Premium lost</TableHead>
                <TableHead className="text-right">Rent change when re-let</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sel.bands.map((b) => (
                <TableRow key={b.key}>
                  <TableCell>{b.label}</TableCell>
                  <TableCell className="text-right">{b.tenants}</TableCell>
                  <TableCell className="text-right">{fmtMoney(b.rent)}</TableCell>
                  <TableCell className="text-right">{b.premium > 0 ? fmtMoney(b.premium) : "—"}</TableCell>
                  <TableCell className="text-right">
                    {fmtNum(b.expectedExits, 0)}
                    <span className="text-xs text-muted-foreground"> ({fmtPct(b.tenants ? b.expectedExits / b.tenants : 0)})</span>
                  </TableCell>
                  <TableCell className="text-right">{b.premiumLost > 0 ? `${fmtMoney(b.premiumLost)}/mo` : "—"}</TableCell>
                  <TableCell className={`text-right ${b.turnoverLoss < 0 ? "text-green-700 dark:text-green-400" : ""}`}>
                    {b.expectedExits ? `${b.turnoverLoss > 0 ? "−" : "+"}${fmtMoney(Math.abs(b.turnoverLoss))}/mo` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>All tenants</TableCell>
                <TableCell className="text-right">{o.tenants}</TableCell>
                <TableCell className="text-right">{fmtMoney(totalRent)}</TableCell>
                <TableCell className="text-right">{fmtMoney(totalPremium)}</TableCell>
                <TableCell className="text-right">{fmtNum(sel.bands.reduce((a, b) => a + b.expectedExits, 0), 0)}</TableCell>
                <TableCell className="text-right">{fmtMoney(sel.bands.reduce((a, b) => a + b.premiumLost, 0))}/mo</TableCell>
                <TableCell className="text-right">
                  {(() => {
                    const t = sel.bands.reduce((a, b) => a + b.turnoverLoss, 0);
                    return `${t > 0 ? "−" : "+"}${fmtMoney(Math.abs(t))}/mo`;
                  })()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What this assumes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              How likely each tenant is to leave comes from the length-of-stay model (Length of Stay tab). The{" "}
              <strong>total number</strong> of move-outs is that model&apos;s; the &quot;far over street&quot; setting only moves{" "}
              <em>who</em> leaves toward the high-rent tenants. How much more likely they are to leave <strong>has not been
              measured</strong> — that&apos;s why there are three settings. Month-end rent rolls kept over time would let us measure it.
            </li>
            <li>
              New tenants arrive at each unit type&apos;s pace over the last 6 months, adjusted for the season, into vacant units. They
              pay {fmtPct(o.replacementRatio)} of street, which is what recent move-ins here actually pay ({o.replacementSample} of
              them). Occupancy won&apos;t go above 95% of units (or today&apos;s level if higher).
            </li>
            <li>
              Not included: move-in specials (a free first month would trim income from new tenants), changes to street rates, increases
              other than the one you pick, and tenants who stop paying.
            </li>
            <li>
              The band shows chance alone: who happens to leave, and when. It does not cover being wrong about the assumptions — the
              three settings do that.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
