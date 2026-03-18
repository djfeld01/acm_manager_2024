"use client";

import { useState } from "react";
import { useChartDirection } from "@/lib/hooks/useChartDirection";
import { useChartExport } from "@/lib/hooks/useChartExport";
import { Download } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";

export type MonthCollectionData = {
  monthLabel: string; // "Mar '24"
  mtdAmount: number | null; // collected as of day X
  fullMonthTotal: number | null; // full month total (null for current month)
  projectedTotal: number | null; // current month only: mtd + avg remainder from prior 12 months
  rentActual: number | null;     // end-of-month rent_actual from occupancy
  rentPotential: number | null;  // end-of-month rent_potential from occupancy
  delinquentMtd: number | null;  // sum of all delinquent buckets as of day X
  isCurrentMonth: boolean;
};

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type Mode = "collections" | "rent";

function makeTooltip(dayOfMonth: number, mode: Mode) {
  return function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;

    const row = payload[0]?.payload as MonthCollectionData;
    const afterDayX =
      mode === "collections" && row.fullMonthTotal != null && row.mtdAmount != null
        ? row.fullMonthTotal - row.mtdAmount
        : null;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
        <p className="font-semibold">{label}</p>
        {payload.map((entry) => {
          if (entry.dataKey === "_barValue" && mode === "rent") {
            // Show both rent_potential and rent_actual instead of the combined bar value
            return (
              <div key="_rent" className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(220 10% 75%)" }} />
                  <span className="text-muted-foreground">Rent Potential:</span>
                  <span className="font-medium">{row.rentPotential != null ? fmt$(row.rentPotential) : "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(220 10% 40%)" }} />
                  <span className="text-muted-foreground">Rent Actual:</span>
                  <span className="font-medium">{row.rentActual != null ? fmt$(row.rentActual) : "—"}</span>
                </div>
              </div>
            );
          }
          const name =
            entry.dataKey === "_barValue"
              ? row.isCurrentMonth ? "Projected Total" : "Full Month Total"
              : entry.name;
          const color =
            entry.dataKey === "_barValue"
              ? row.isCurrentMonth ? "hsl(142 71% 45%)" : "hsl(var(--muted-foreground))"
              : entry.color;
          return (
            <div key={entry.dataKey as string} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{name}:</span>
              <span className="font-medium">{entry.value != null ? fmt$(entry.value) : "—"}</span>
            </div>
          );
        })}
        {afterDayX != null && (
          <div className="flex items-center gap-2 border-t pt-1 mt-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" />
            <span className="text-muted-foreground">Collected after day {dayOfMonth}:</span>
            <span className="font-medium">{fmt$(afterDayX)}</span>
          </div>
        )}
      </div>
    );
  };
}

type RentView = "both" | "potential" | "actual";

const RENT_POTENTIAL_COLOR = "hsl(220 10% 75%)";  // light grey
const RENT_ACTUAL_COLOR    = "hsl(220 10% 40%)";  // dark grey

function RentOverlapBar(props: {
  x?: number; y?: number; width?: number; height?: number;
  payload?: MonthCollectionData & { _barValue?: number; _rentView?: RentView };
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload || height <= 0) return null;

  const view     = payload._rentView ?? "both";
  const potential = payload.rentPotential ?? 0;
  const actual    = payload.rentActual    ?? 0;
  const maxVal    = payload._barValue     ?? 1;
  const r = 3;

  const potentialH = maxVal > 0 ? height * (potential / maxVal) : 0;
  const actualH    = maxVal > 0 ? height * (actual    / maxVal) : 0;

  return (
    <g>
      {(view === "both" || view === "potential") && (
        <rect
          x={x} y={y + height - potentialH} width={width} height={potentialH}
          fill={RENT_POTENTIAL_COLOR} opacity={0.7} rx={r}
        />
      )}
      {(view === "both" || view === "actual") && (
        <rect
          x={x} y={y + height - actualH} width={width} height={actualH}
          fill={RENT_ACTUAL_COLOR} opacity={0.8} rx={r}
        />
      )}
    </g>
  );
}

const MODES: { key: Mode; label: string }[] = [
  { key: "collections", label: "Collections" },
  { key: "rent", label: "Rent & Delinquency" },
];

export function MtdCollectionsChart({
  data,
  dayOfMonth,
}: {
  data: MonthCollectionData[];
  dayOfMonth: number;
}) {
  const [mode, setMode] = useState<Mode>("collections");
  const [showDelinquent, setShowDelinquent] = useState(false);
  const [showFullMonth, setShowFullMonth] = useState(false);
  const [rentView, setRentView] = useState<RentView>("both");
  const { newestFirst, toggle } = useChartDirection();
  const { containerRef, exportPng } = useChartExport("collections-chart");
  const CustomTooltip = makeTooltip(dayOfMonth, mode);

  const orderedData = newestFirst ? data : [...data].reverse();

  const displayData = orderedData.map((d) => ({
    ...d,
    _rentView: rentView,
    _barValue:
      mode === "collections"
        ? (d.fullMonthTotal ?? d.projectedTotal ?? undefined)
        : (() => {
            const p = d.rentPotential ?? 0;
            const a = d.rentActual ?? 0;
            const val =
              rentView === "potential" ? p :
              rentView === "actual"    ? a :
              Math.max(p, a);
            return val || undefined;
          })(),
    // Full month line: use mtdAmount for current month, fullMonthTotal for past
    _collLine: showFullMonth
      ? (d.isCurrentMonth ? d.mtdAmount : d.fullMonthTotal)
      : d.mtdAmount,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                mode === m.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {m.label}
            </button>
          ))}
          <button
            onClick={() => setShowFullMonth((v) => !v)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors",
              showFullMonth
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {showFullMonth ? "Full Month" : "MTD"}
          </button>
          {mode === "rent" && (
            <>
              {(["both", "potential", "actual"] as RentView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setRentView(v)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                    rentView === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {v === "both" ? "Both" : v === "potential" ? "Potential" : "Actual"}
                </button>
              ))}
              <button
                onClick={() => setShowDelinquent((v) => !v)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  showDelinquent
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Delinquent
              </button>
            </>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={toggle}
            className="px-2.5 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {newestFirst ? "Newest → Oldest" : "Oldest → Newest"}
          </button>
          <button
            onClick={exportPng}
            title="Export as PNG"
            className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={displayData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            tickFormatter={(v) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                notation: "compact",
                maximumFractionDigits: 0,
              }).format(v)
            }
            tick={{ fontSize: 12 }}
            width={56}
            className="text-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="_barValue"
            name={mode === "collections" ? "Full Month / Projected" : "Rent Potential / Actual"}
            opacity={mode === "collections" ? 0.5 : 1}
            radius={mode === "collections" ? [3, 3, 0, 0] : undefined}
            shape={mode === "rent" ? <RentOverlapBar /> : undefined}
          >
            {mode === "collections" && displayData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.isCurrentMonth ? "hsl(142 71% 45%)" : "hsl(var(--muted-foreground))"}
              />
            ))}
          </Bar>
          <Line
            dataKey="_collLine"
            name={showFullMonth ? `Full Month (MTD for ${new Date().toLocaleDateString("en-US", { month: "short" })})` : `MTD thru day ${dayOfMonth}`}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          {mode === "rent" && showDelinquent && (
            <Line
              dataKey="delinquentMtd"
              name={`Delinquent thru day ${dayOfMonth}`}
              stroke="hsl(0 72% 51%)"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: "hsl(0 72% 51%)" }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
