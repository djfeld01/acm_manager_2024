"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getFacilityMarketingDetail,
  type FunnelStage,
} from "../../actions/getFacilityMarketingDetail";
import { getFacilityMonthlySeasonality } from "../../actions/getFacilityMonthlySeasonality";
import { ComparisonLineChart, type LineChartData } from "@/components/charts/LineChart";

interface Props {
  sitelinkId: string;
}

type AggMode = "mean" | "median";

function fmtPct(v: number | null) {
  return v != null ? `${Math.round(v * 100)}%` : "—";
}

function fmtNum(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function StatCard({
  label,
  value,
  compareLabel,
  compareValue,
  rangeText,
}: {
  label: string;
  value: string;
  compareLabel: string;
  compareValue: string;
  rangeText?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {compareLabel}: {compareValue}
          {rangeText ? ` (${rangeText})` : ""}
        </div>
      </CardContent>
    </Card>
  );
}

type CountKey = "placed" | "followedUp" | "leased" | "cancelled";
type RateKey = "followUpRate" | "leaseRate" | "cancelRate";

const STAGE_ROWS: {
  stage: string;
  countKey: CountKey;
  rateKey: RateKey | null;
}[] = [
  { stage: "Inquiries Placed", countKey: "placed", rateKey: null },
  { stage: "Followed Up", countKey: "followedUp", rateKey: "followUpRate" },
  { stage: "Leased", countKey: "leased", rateKey: "leaseRate" },
  { stage: "Cancelled (lost inquiries)", countKey: "cancelled", rateKey: "cancelRate" },
];

export function FacilityMarketingDetailClient({ sitelinkId }: Props) {
  const [aggMode, setAggMode] = useState<AggMode>("mean");
  const [showRange, setShowRange] = useState(false);
  const [seasonalitySource, setSeasonalitySource] = useState<string>("All");

  const { data, isLoading } = useQuery({
    queryKey: ["marketingDetail", sitelinkId],
    queryFn: () => getFacilityMarketingDetail(sitelinkId, 8),
  });

  const { data: seasonality, isLoading: seasonalityLoading } = useQuery({
    queryKey: ["marketingSeasonality", sitelinkId],
    queryFn: () => getFacilityMonthlySeasonality(sitelinkId, 4),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  const lastWeek = data?.weeklySeries[data.weeklySeries.length - 1];
  const funnel = data?.funnel;
  const aggLabel = aggMode === "mean" ? "Mean" : "Median";

  const portfolioInquiriesKey =
    aggMode === "mean" ? "portfolioMeanInquiries" : "portfolioMedianInquiries";
  const portfolioLeasedKey =
    aggMode === "mean" ? "portfolioMeanLeased" : "portfolioMedianLeased";

  const weeklyChartData: LineChartData[] = (data?.weeklySeries ?? []).map((w) => ({
    weekStart: w.weekStart,
    facilityInquiries: w.facilityInquiries,
    portfolioMeanInquiries: w.portfolioMeanInquiries,
    portfolioMedianInquiries: w.portfolioMedianInquiries,
    portfolioMinInquiries: w.portfolioMinInquiries,
    portfolioMaxInquiries: w.portfolioMaxInquiries,
    facilityLeased: w.facilityLeased,
    portfolioMeanLeased: w.portfolioMeanLeased,
    portfolioMedianLeased: w.portfolioMedianLeased,
    portfolioMinLeased: w.portfolioMinLeased,
    portfolioMaxLeased: w.portfolioMaxLeased,
  }));

  const inquiriesCompareKeys = [
    { key: "facilityInquiries", name: "Inquiries (Facility)" },
    { key: portfolioInquiriesKey, name: `Inquiries (Portfolio ${aggLabel})` },
    ...(showRange
      ? [
          { key: "portfolioMinInquiries", name: "Portfolio Min" },
          { key: "portfolioMaxInquiries", name: "Portfolio Max" },
        ]
      : []),
  ];
  const leasedCompareKeys = [
    { key: "facilityLeased", name: "Leases (Facility)" },
    { key: portfolioLeasedKey, name: `Leases (Portfolio ${aggLabel})` },
    ...(showRange
      ? [
          { key: "portfolioMinLeased", name: "Portfolio Min" },
          { key: "portfolioMaxLeased", name: "Portfolio Max" },
        ]
      : []),
  ];
  const rangeColors = ["#475569", "#475569"];
  const inquiriesColors = showRange
    ? ["#3b82f6", "#94a3b8", ...rangeColors]
    : ["#3b82f6", "#94a3b8"];
  const leasedColors = showRange
    ? ["#22c55e", "#94a3b8", ...rangeColors]
    : ["#22c55e", "#94a3b8"];

  const funnelRows = funnel
    ? STAGE_ROWS.map(({ stage, countKey, rateKey }) => ({
        stage,
        facilityCount: funnel.facility[countKey],
        facilityRate: rateKey ? funnel.facility[rateKey] : null,
        portfolioCount: funnel.portfolio[aggMode][countKey],
        portfolioRate: rateKey ? funnel.portfolio[aggMode][rateKey] : null,
        portfolioMin: funnel.portfolio.min[countKey],
        portfolioMax: funnel.portfolio.max[countKey],
      }))
    : [];

  const seasonalitySources = ["All", ...(seasonality?.sources ?? [])];
  const seasonalityYears = seasonality?.years ?? [];
  const seasonalityColors = seasonalityYears.map((_, i, arr) =>
    i === arr.length - 1
      ? "#3b82f6"
      : ["#94a3b8", "#64748b", "#475569", "#cbd5e1"][i % 4]
  );
  const seasonalityCompareKeys = seasonalityYears.map((y) => ({ key: y, name: y }));
  const inquiriesSeasonalityData: LineChartData[] =
    seasonality?.inquiriesBySource[seasonalitySource] ?? [];
  const leasedSeasonalityData: LineChartData[] =
    seasonality?.leasedBySource[seasonalitySource] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/marketing">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All Locations
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data?.facilityName ?? sitelinkId}
          </h1>
          <p className="text-muted-foreground">
            Marketing detail — last 8 weeks, vs. portfolio
          </p>
        </div>
      </div>

      {/* Portfolio comparison controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Portfolio baseline:</span>
          <ToggleGroup
            type="single"
            value={aggMode}
            onValueChange={(v) => v && setAggMode(v as AggMode)}
          >
            <ToggleGroupItem value="mean" size="sm">
              Mean
            </ToggleGroupItem>
            <ToggleGroupItem value="median" size="sm">
              Median
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={showRange} onCheckedChange={(v) => setShowRange(!!v)} />
          Show range (min–max across facilities) on charts
        </label>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="This Week Inquiries"
          value={String(lastWeek?.facilityInquiries ?? "—")}
          compareLabel={`Portfolio ${aggLabel.toLowerCase()}`}
          compareValue={String(lastWeek?.[portfolioInquiriesKey] ?? "—")}
          rangeText={
            showRange && lastWeek
              ? `range ${lastWeek.portfolioMinInquiries}–${lastWeek.portfolioMaxInquiries}`
              : undefined
          }
        />
        <StatCard
          label="Lease Rate (8 wk)"
          value={fmtPct(funnel?.facility.leaseRate ?? null)}
          compareLabel={`Portfolio ${aggLabel.toLowerCase()}`}
          compareValue={fmtPct(funnel?.portfolio[aggMode].leaseRate ?? null)}
        />
        <StatCard
          label="Occupancy"
          value={fmtPct(data?.occupancy.facilityPct ?? null)}
          compareLabel={`Portfolio ${aggLabel.toLowerCase()}`}
          compareValue={fmtPct(data?.occupancy.portfolio?.[aggMode] ?? null)}
          rangeText={
            showRange && data?.occupancy.portfolio
              ? `range ${Math.round(data.occupancy.portfolio.min * 100)}%–${Math.round(
                  data.occupancy.portfolio.max * 100
                )}%`
              : undefined
          }
        />
        <StatCard
          label="Leases (8 wk)"
          value={String(funnel?.facility.leased ?? "—")}
          compareLabel={`Portfolio ${aggLabel.toLowerCase()}`}
          compareValue={fmtNum(funnel?.portfolio[aggMode].leased ?? 0)}
          rangeText={
            showRange && funnel
              ? `range ${funnel.portfolio.min.leased}–${funnel.portfolio.max.leased}`
              : undefined
          }
        />
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inquiry → Lease Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cohort-based: each inquiry is counted at the week it was placed, and
            followed forward regardless of when it converted. The most recent
            1–2 weeks will understate eventual conversion since those leads
            haven&apos;t had time to close yet. &quot;Cancelled&quot; means the
            inquiry was abandoned before ever leasing (leaseDate and cancelDate
            never both occur on the same inquiry) — it&apos;s not a lease that
            was later cancelled.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Facility</TableHead>
                <TableHead className="text-right">Facility Rate</TableHead>
                <TableHead className="text-right">Portfolio {aggLabel}</TableHead>
                <TableHead className="text-right">Portfolio Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelRows.map((row) => (
                <TableRow key={row.stage}>
                  <TableCell className="font-medium">{row.stage}</TableCell>
                  <TableCell className="text-right">{row.facilityCount}</TableCell>
                  <TableCell className="text-right">
                    {row.facilityRate != null ? fmtPct(row.facilityRate) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmtNum(row.portfolioCount)}
                    {showRange && (
                      <div className="text-xs text-muted-foreground">
                        {row.portfolioMin}–{row.portfolioMax}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.portfolioRate != null ? fmtPct(row.portfolioRate) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Weekly trend charts */}
      <ComparisonLineChart
        data={weeklyChartData}
        compareKeys={inquiriesCompareKeys}
        colors={inquiriesColors}
        xAxisKey="weekStart"
        title="Weekly Inquiries"
        description={`Facility vs. portfolio-wide ${aggLabel.toLowerCase()} per facility`}
        height={280}
      />

      <ComparisonLineChart
        data={weeklyChartData}
        compareKeys={leasedCompareKeys}
        colors={leasedColors}
        xAxisKey="weekStart"
        title="Weekly Leases Signed"
        description="By the week the lease was signed (not cohort-attributed)"
        height={280}
      />

      {/* Monthly seasonality / year-over-year */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Monthly Seasonality (Year-over-Year)</CardTitle>
          <Select value={seasonalitySource} onValueChange={setSeasonalitySource}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Source…" />
            </SelectTrigger>
            <SelectContent>
              {seasonalitySources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {seasonality
              ? `${seasonality.currentMonthLabel} is compared month-to-date (through day ${seasonality.asOfDay}) across every year shown, so an in-progress month isn't judged against prior years' full-month totals. Other months show full-month totals.`
              : "Loading…"}
          </p>
          {seasonalityLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : (
            <>
              <ComparisonLineChart
                data={inquiriesSeasonalityData}
                compareKeys={seasonalityCompareKeys}
                colors={seasonalityColors}
                xAxisKey="month"
                title="Inquiries by Month"
                description={`Source: ${seasonalitySource}`}
                height={280}
              />
              <ComparisonLineChart
                data={leasedSeasonalityData}
                compareKeys={seasonalityCompareKeys}
                colors={seasonalityColors}
                xAxisKey="month"
                title="Leases by Month"
                description={`Source: ${seasonalitySource} — cohort-based (by inquiry's placement month)`}
                height={280}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Source breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By Source (last 8 weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Inquiries</TableHead>
                <TableHead className="text-right">Leased</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Portfolio Conv. Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.sourceBreakdown ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No inquiries in this window.
                  </TableCell>
                </TableRow>
              ) : (
                data?.sourceBreakdown.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell className="font-medium">{row.source}</TableCell>
                    <TableCell className="text-right">{row.inquiries}</TableCell>
                    <TableCell className="text-right">{row.leased}</TableCell>
                    <TableCell className="text-right">{fmtPct(row.conversionRate)}</TableCell>
                    <TableCell className="text-right">
                      {fmtPct(row.portfolioConversionRate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
