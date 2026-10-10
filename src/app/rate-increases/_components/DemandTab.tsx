"use client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart } from "@/components/charts";
import { DEMAND_THRESHOLDS } from "../_lib/config";
import type { DemandSegment, DemandStatus } from "../_lib/demand";
import { getDemandHealth } from "../actions/getDemandHealth";
import { fmtNum, fmtPct } from "./format";
import { Stat, TabLoading } from "./Stat";
import { breakdownNoun, breakdownTitle, type Breakdown } from "./Breakdown";

const STATUS_LABEL: Record<DemandStatus, string> = { healthy: "Healthy", watch: "Watch", low: "Low" };
const STATUS_CLASS: Record<DemandStatus, string> = {
  healthy: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  watch: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function StatusBadge({ s }: { s: DemandSegment }) {
  if (!s.status) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[s.status]}`}>{STATUS_LABEL[s.status]}</span>
      {s.lowSample && <Badge variant="outline" title="Fewer than 12 move-ins in 6 months — treat as rough">small sample</Badge>}
    </span>
  );
}

export function DemandTab({ sitelinkId, by }: { sitelinkId: string; by: Breakdown }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rateInc", "demand", sitelinkId],
    queryFn: () => getDemandHealth(sitelinkId),
  });
  if (!data?.health) return <TabLoading isLoading={isLoading} error={error} />;
  const h = data.health;
  const o = h.overall;
  const segments = by === "size" ? h.bySize : h.byType;
  const rows = [...segments, o];
  const series = o.series.map((p) => ({ month: p.month, Inquiries: p.inquiries, "Move-ins": p.moveIns }));

  return (
    <>
      <p className="text-sm text-muted-foreground">
        <strong>Coverage</strong> = expected move-ins per month ÷ expected move-outs per month. At or above{" "}
        {DEMAND_THRESHOLDS.healthy} demand comfortably refills what leaves; {DEMAND_THRESHOLDS.watch}–
        {DEMAND_THRESHOLDS.healthy} is watch; below {DEMAND_THRESHOLDS.watch} occupancy is likely to slide. Move-ins
        come from the last 6 months of leases, adjusted for the season ahead (factor {fmtNum(h.seasonalFactor, 2)}).
        Thresholds are a first draft — we&apos;ll tune them together.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Overall demand" value={o.status ? STATUS_LABEL[o.status] : "—"} sub={`Coverage ${fmtNum(o.coverage, 2)}`} />
        <Stat label="Room for extra move-outs" value={o.cushion == null ? "—" : `${o.cushion >= 0 ? "+" : ""}${fmtPct(o.cushion)}`} sub="Move-outs above expected before coverage drops below 1.0" />
        <Stat label="Inquiries, last 90 days" value={fmtNum(o.inquiriesLast90)} sub={o.inquiriesYoY == null ? "" : `${o.inquiriesYoY >= 0 ? "+" : ""}${fmtPct(o.inquiriesYoY)} vs same period last year`} />
        <Stat label="Days to refill vacancies" value={o.absorptionDays == null ? "—" : fmtNum(o.absorptionDays)} sub={`${o.vacantUnits} vacant units · conversion ${fmtPct(o.conversion)}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demand health by {breakdownNoun(by)}</CardTitle>
          <CardDescription>Expected = per month, seasonally adjusted.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{breakdownTitle(by)}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
                <TableHead className="text-right">Cushion</TableHead>
                <TableHead className="text-right">Exp. move-ins</TableHead>
                <TableHead className="text-right">Exp. move-outs</TableHead>
                <TableHead className="text-right">Vacant</TableHead>
                <TableHead className="text-right">Days to fill</TableHead>
                <TableHead className="text-right">Inquiries 90d</TableHead>
                <TableHead className="text-right">YoY</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.label} className={s === o ? "font-semibold" : ""}>
                  <TableCell>{s === o ? "All" : s.label}</TableCell>
                  <TableCell><StatusBadge s={s} /></TableCell>
                  <TableCell className="text-right">{fmtNum(s.coverage, 2)}</TableCell>
                  <TableCell className="text-right">{s.cushion == null ? "—" : fmtPct(s.cushion)}</TableCell>
                  <TableCell className="text-right">{fmtNum(s.expectedMoveInsPerMonth, 1)}</TableCell>
                  <TableCell className="text-right">{fmtNum(s.expectedMoveOutsPerMonth, 1)}</TableCell>
                  <TableCell className="text-right">{s.vacantUnits}</TableCell>
                  <TableCell className="text-right">{s.absorptionDays == null ? "—" : fmtNum(s.absorptionDays)}</TableCell>
                  <TableCell className="text-right">{s.inquiriesLast90}</TableCell>
                  <TableCell className="text-right">{s.inquiriesYoY == null ? "—" : fmtPct(s.inquiriesYoY)}</TableCell>
                  <TableCell className="text-right">{fmtPct(s.conversion)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LineChart
        title="Inquiries and move-ins by month"
        description="All unit types, Columbus."
        data={series}
        xAxisKey="month"
        height={300}
        lines={[
          { dataKey: "Inquiries", color: "#3b82f6" },
          { dataKey: "Move-ins", color: "#22c55e" },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {segments
          .filter((s) => !s.lowSample)
          .map((s) => (
            <LineChart
              key={s.label}
              title={s.label}
              data={s.series.map((p) => ({ month: p.month, Inquiries: p.inquiries, "Move-ins": p.moveIns }))}
              xAxisKey="month"
              height={220}
              lines={[
                { dataKey: "Inquiries", color: "#3b82f6", dot: false },
                { dataKey: "Move-ins", color: "#22c55e", dot: false },
              ]}
            />
          ))}
      </div>
    </>
  );
}
