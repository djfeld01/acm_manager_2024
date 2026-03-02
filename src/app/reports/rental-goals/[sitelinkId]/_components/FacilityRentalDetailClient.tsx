"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getFacilityRentalDetail,
  generateAIAnalysis,
} from "@/lib/controllers/rentalGoalController";
import {
  ComparisonLineChart,
  TrendLineChart,
  type LineChartData,
} from "@/components/charts/LineChart";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface Props {
  sitelinkId: string;
}

export function FacilityRentalDetailClient({ sitelinkId }: Props) {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? getCurrentMonth();
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rentalGoalDetail", sitelinkId, month],
    queryFn: () => getFacilityRentalDetail(sitelinkId, month),
  });

  async function handleGenerateAnalysis() {
    if (!data) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateAIAnalysis({
        facilityName: data.facilityName,
        targetMonth: month,
        rentalsHistory: data.rentalsHistory,
        statPrediction: data.statPrediction,
        vacantUnits: data.vacantUnits,
        occupancyPct:
          data.occupancyHistory.length > 0
            ? ((data.occupancyHistory[data.occupancyHistory.length - 1]
                .occupancyPct ?? 0) / 100) || null
            : null,
        trend: data.trend,
      });
      setAiAnalysis(result);
    } catch (e) {
      setAiError("Failed to generate analysis. Check that ANTHROPIC_API_KEY is set.");
    } finally {
      setAiLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  const monthLabel = new Date(month + "-01").toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Build chart data: add prediction point for target month
  const chartData: LineChartData[] = [
    ...(data?.rentalsHistory ?? []).map((r) => {
      const row: LineChartData = { month: r.month, rentals: r.rentals, moveOuts: r.moveOuts };
      if (r.goal != null) row.goal = r.goal;
      return row;
    }),
    { month, prediction: data?.statPrediction ?? 0 },
  ];

  const occupancyChartData: LineChartData[] = (data?.occupancyHistory ?? []).map(
    (r) => ({
      month: r.month,
      occupancyPct: r.occupancyPct ?? 0,
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/reports/rental-goals">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All Locations
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {data?.facilityName ?? sitelinkId}
          </h1>
          <p className="text-muted-foreground">Rental prediction for {monthLabel}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stat Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.statPrediction ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vacant Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.vacantUnits != null ? data.vacantUnits : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {occupancyChartData.length > 0 &&
              occupancyChartData[occupancyChartData.length - 1].occupancyPct != null
                ? `${occupancyChartData[occupancyChartData.length - 1].occupancyPct}%`
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last 3 Mo Avg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.rentalsHistory && data.rentalsHistory.length > 0
                ? Math.round(
                    data.rentalsHistory
                      .slice(-3)
                      .reduce((a, b) => a + b.rentals, 0) /
                      Math.min(data.rentalsHistory.length, 3)
                  )
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rentals history chart */}
      <ComparisonLineChart
        data={chartData}
        compareKeys={[
          { key: "rentals", name: "Move-Ins" },
          { key: "moveOuts", name: "Move-Outs" },
          { key: "goal", name: "Goal" },
          { key: "prediction", name: "Prediction" },
        ]}
        colors={["#3b82f6", "#f97316", "#22c55e", "#a855f7"]}
        xAxisKey="month"
        title="Rental History & Prediction"
        description="Monthly move-ins vs goal vs statistical prediction"
        height={300}
      />

      {/* Occupancy trend chart */}
      {occupancyChartData.length > 0 && (
        <TrendLineChart
          data={occupancyChartData}
          valueKey="occupancyPct"
          xAxisKey="month"
          title="Occupancy % Trend"
          description="Monthly average unit occupancy"
          trend={data?.trend}
          height={250}
        />
      )}

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGenerateAnalysis}
            disabled={aiLoading || !data}
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate AI Analysis"
            )}
          </Button>
          {aiError && (
            <p className="text-sm text-destructive">{aiError}</p>
          )}
          {aiAnalysis && (
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap rounded-md bg-muted p-4">
              {aiAnalysis}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
