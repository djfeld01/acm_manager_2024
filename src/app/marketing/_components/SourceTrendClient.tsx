"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSourceTrend } from "../actions/getSourceTrend";
import { ComparisonLineChart, type LineChartData } from "@/components/charts/LineChart";

type Granularity = "monthly" | "quarterly";
const PORTFOLIO_VALUE = "__portfolio__";
const DEFAULT_SOURCE = "StoragePug";

export function SourceTrendClient() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [selectedFacility, setSelectedFacility] = useState<string>(PORTFOLIO_VALUE);

  const { data, isLoading } = useQuery({
    queryKey: ["sourceTrend", source],
    queryFn: () => getSourceTrend(source),
  });

  const facilityLabel = data?.facilities.find((f) => f.sitelinkId === selectedFacility)?.label;

  const chartData: LineChartData[] = useMemo(() => {
    const points = data ? (granularity === "monthly" ? data.monthly : data.quarterly) : [];
    return points.map((p) => ({
      period: p.period,
      portfolioAvg: p.portfolioAvg,
      ...(selectedFacility !== PORTFOLIO_VALUE
        ? { facilityValue: p.byFacility[selectedFacility] ?? 0 }
        : {}),
    }));
  }, [data, granularity, selectedFacility]);

  const compareKeys =
    selectedFacility === PORTFOLIO_VALUE
      ? [{ key: "portfolioAvg", name: "Portfolio Average" }]
      : [
          { key: "facilityValue", name: `${facilityLabel ?? selectedFacility} (avg/mo)` },
          { key: "portfolioAvg", name: "Portfolio Average" },
        ];
  const colors = selectedFacility === PORTFOLIO_VALUE ? ["#94a3b8"] : ["#3b82f6", "#94a3b8"];

  // "StoragePug" is offered even before the fetched list arrives, since it's
  // the default selection.
  const sourceOptions = Array.from(
    new Set([DEFAULT_SOURCE, ...(data?.availableSources ?? [])])
  ).sort();

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">Lead Source Performance Over Time</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Source…" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={granularity}
            onValueChange={(v) => v && setGranularity(v as Granularity)}
          >
            <ToggleGroupItem value="monthly" size="sm">
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem value="quarterly" size="sm">
              Quarterly
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Facility…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PORTFOLIO_VALUE}>Portfolio Average</SelectItem>
              {(data?.facilities ?? []).map((f) => (
                <SelectItem key={f.sitelinkId} value={f.sitelinkId}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          "{source}"-attributed inquiries only. Each point is inquiries per
          month — a quarterly point is the average of that quarter's three
          monthly values, not a 3-month sum, so quarterly and monthly points
          sit on the same scale.{" "}
          {data?.seriesStart && data?.lastCompleteMonth
            ? `Data runs ${data.seriesStart} through ${data.lastCompleteMonth} (starts either at this source's first appearance or 24 months back, whichever is later) — the current, still-in-progress month is excluded so it doesn't drag a point down artificially.`
            : ""}
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No data for this source in the window.
          </div>
        ) : (
          <ComparisonLineChart
            data={chartData}
            compareKeys={compareKeys}
            colors={colors}
            xAxisKey="period"
            height={320}
          />
        )}
      </CardContent>
    </Card>
  );
}
