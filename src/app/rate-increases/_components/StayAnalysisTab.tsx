"use client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, LineChart } from "@/components/charts";
import { getStayAnalysis } from "../actions/getStayAnalysis";
import { daysToMonths, fmtNum, fmtPct } from "./format";
import { Stat, TabLoading } from "./Stat";
import { breakdownNoun, breakdownTitle, type Breakdown } from "./Breakdown";

const months = (d: number | null) => (d == null ? "—" : `${fmtNum(daysToMonths(d), 1)} mo`);

export function StayAnalysisTab({ sitelinkId, by }: { sitelinkId: string; by: Breakdown }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rateInc", "stay", sitelinkId],
    queryFn: () => getStayAnalysis(sitelinkId),
  });
  if (!data?.analysis) return <TabLoading isLoading={isLoading} error={error} />;
  const a = data.analysis;
  const o = a.overall;
  const segments = by === "size" ? a.bySize : a.byType;

  const curve = o.curve.map((p) => ({
    month: Math.round(p.day / 30.44),
    survival: +(p.s * 100).toFixed(1),
    low: +(p.lo * 100).toFixed(1),
    high: +(p.hi * 100).toFixed(1),
  }));
  const backtest = a.monthly.map((m) => ({
    month: m.month,
    actual: m.actualMoveOuts,
    expectedTenure: +m.expectedTenure.toFixed(1),
    expectedAvg: +m.expectedFacilityAvg.toFixed(1),
  }));
  const totalActual = a.monthly.reduce((s, m) => s + m.actualMoveOuts, 0);
  const totalExpected = a.monthly.reduce((s, m) => s + m.expectedTenure, 0);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Stay length uses Kaplan-Meier survival analysis, so tenants who are still here count as
        &quot;stayed at least this long&quot; instead of being ignored. Move-out history starts{" "}
        {a.windowStart}; tenants who moved in earlier enter the math at the length they had already
        reached then.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Median stay" value={months(o.medianDays)} sub={`${o.nEvents} move-outs, ${o.currentTenants} current tenants`} />
        <Stat label="Expected stay (10-yr avg)" value={months(o.expectedStayDays)} sub="Average months a new tenant stays, up to 10 years" />
        <Stat label="Still here at 12 / 24 mo" value={`${fmtPct(o.survival.m12)} / ${fmtPct(o.survival.m24)}`} sub={`60 mo: ${fmtPct(o.survival.m60)}`} />
        <Stat label="Expected move-outs, next 90 days" value={fmtNum(a.baseline.tenureExpectedMoveOuts.d90)} sub={`Facility-wide average says ${fmtNum(a.baseline.expectedMoveOuts.d90)}`} />
      </div>

      <LineChart
        title="Chance a tenant is still here"
        description="By months since move-in, with 95% confidence band. Dashed lines = band."
        data={curve}
        xAxisKey="month"
        height={320}
        curve="stepAfter"
        lines={[
          { dataKey: "survival", name: "Still here %", color: "#3b82f6", dot: false },
          { dataKey: "high", name: "Upper 95%", color: "#93c5fd", strokeDasharray: "4 4", strokeWidth: 1, dot: false },
          { dataKey: "low", name: "Lower 95%", color: "#93c5fd", strokeDasharray: "4 4", strokeWidth: 1, dot: false },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Stay length and expected move-outs, by {breakdownNoun(by)}</CardTitle>
          <CardDescription>
            Tenure-based = each tenant&apos;s chance of leaving given how long they&apos;ve already stayed.
            Facility-wide = trailing 12-month average exit rate ({fmtPct(a.baseline.avgMonthlyRate, 1)}/month) applied to
            everyone equally. These are baselines <em>without</em> a rate increase.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{breakdownTitle(by)}</TableHead>
                <TableHead className="text-right">Tenants</TableHead>
                <TableHead className="text-right">Move-outs (history)</TableHead>
                <TableHead className="text-right">Median stay</TableHead>
                <TableHead className="text-right">Expected stay</TableHead>
                <TableHead className="text-right">12 mo</TableHead>
                <TableHead className="text-right">Next 30d</TableHead>
                <TableHead className="text-right">Next 60d</TableHead>
                <TableHead className="text-right">Next 90d</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...segments, o].map((s) => (
                <TableRow key={s.label} className={s === o ? "font-semibold" : ""}>
                  <TableCell>
                    {s === o ? "All" : s.label}
                    {s.usedFallback && (
                      <Badge variant="outline" className="ml-2" title="Too few move-outs to fit alone; using the overall Columbus curve">
                        shared curve
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{s.currentTenants}</TableCell>
                  <TableCell className="text-right">{s.nEvents}</TableCell>
                  <TableCell className="text-right">{months(s.medianDays)}</TableCell>
                  <TableCell className="text-right">{months(s.expectedStayDays)}</TableCell>
                  <TableCell className="text-right">{fmtPct(s.survival.m12)}</TableCell>
                  <TableCell className="text-right">{fmtNum(s.expectedMoveOuts.d30, 1)}</TableCell>
                  <TableCell className="text-right">{fmtNum(s.expectedMoveOuts.d60, 1)}</TableCell>
                  <TableCell className="text-right">{fmtNum(s.expectedMoveOuts.d90, 1)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="text-muted-foreground">
                <TableCell>Facility-wide average</TableCell>
                <TableCell colSpan={5} />
                <TableCell className="text-right">{fmtNum(a.baseline.expectedMoveOuts.d30, 1)}</TableCell>
                <TableCell className="text-right">{fmtNum(a.baseline.expectedMoveOuts.d60, 1)}</TableCell>
                <TableCell className="text-right">{fmtNum(a.baseline.expectedMoveOuts.d90, 1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <BarChart
        title="Expected vs actual move-outs by month"
        description={`Checks the model against reality: ${fmtNum(totalActual)} actual vs ${fmtNum(totalExpected)} expected over this period.`}
        data={backtest}
        xAxisKey="month"
        layout="horizontal"
        height={320}
        bars={[
          { dataKey: "actual", name: "Actual", color: "#ef4444" },
          { dataKey: "expectedTenure", name: "Expected (tenure-based)", color: "#3b82f6" },
          { dataKey: "expectedAvg", name: "Expected (facility-wide)", color: "#93c5fd" },
        ]}
      />
    </>
  );
}
