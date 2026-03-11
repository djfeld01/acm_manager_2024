"use client";

import { useChartDirection } from "@/lib/hooks/useChartDirection";
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
  isCurrentMonth: boolean;
};

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function makeTooltip(dayOfMonth: number) {
  return function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;

    const row = payload[0]?.payload as MonthCollectionData;
    const afterDayX =
      row.fullMonthTotal != null && row.mtdAmount != null
        ? row.fullMonthTotal - row.mtdAmount
        : null;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
        <p className="font-semibold">{label}</p>
        {payload.map((entry) => {
          // Rename the bar entry based on whether it's projected
          const name =
            entry.dataKey === "_barValue"
              ? row.isCurrentMonth
                ? "Projected Total"
                : "Full Month Total"
              : entry.name;
          const color =
            entry.dataKey === "_barValue"
              ? row.isCurrentMonth
                ? "hsl(142 71% 45%)"
                : "hsl(var(--muted-foreground))"
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

export function MtdCollectionsChart({
  data,
  dayOfMonth,
}: {
  data: MonthCollectionData[];
  dayOfMonth: number;
}) {
  const { newestFirst, toggle } = useChartDirection();
  const CustomTooltip = makeTooltip(dayOfMonth);

  const orderedData = newestFirst ? data : [...data].reverse();

  // Merge full month total and projected into a single bar value
  const displayData = orderedData.map((d) => ({
    ...d,
    _barValue: d.fullMonthTotal ?? d.projectedTotal ?? undefined,
  }));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={toggle}
          className={cn(
            "px-2.5 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          )}
        >
          {newestFirst ? "Newest → Oldest" : "Oldest → Newest"}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={displayData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
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
          name="Full Month / Projected"
          opacity={0.5}
          radius={[3, 3, 0, 0]}
        >
          {displayData.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.isCurrentMonth ? "hsl(142 71% 45%)" : "hsl(var(--muted-foreground))"}
            />
          ))}
        </Bar>
        <Line
          dataKey="mtdAmount"
          name={`MTD thru day ${dayOfMonth}`}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 6 }}
          connectNulls
        />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
