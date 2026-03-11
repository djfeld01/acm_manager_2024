"use client";

import { useState } from "react";
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
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";

export type MonthActivityData = {
  monthLabel: string;
  moveInMtd: number | null;
  moveInFull: number | null;
  moveInProjected: number | null;  // current month only
  moveOutMtd: number | null;
  moveOutFull: number | null;
  moveOutProjected: number | null; // current month only
  occupancyMtd: number | null;     // already multiplied by 100
  occupancyEnd: number | null;     // already multiplied by 100
  rentalGoal: number | null;
  isCurrentMonth: boolean;
};

type Mode = "moveins" | "moveouts" | "net" | "occupancy";

const MODES: { value: Mode; label: string }[] = [
  { value: "moveins", label: "Move-Ins" },
  { value: "moveouts", label: "Move-Outs" },
  { value: "net", label: "Net" },
  { value: "occupancy", label: "Occupancy %" },
];

function getBarLine(d: MonthActivityData, mode: Mode) {
  switch (mode) {
    case "moveins":
      return { bar: d.moveInFull, line: d.moveInMtd, projected: d.moveInProjected };
    case "moveouts":
      return { bar: d.moveOutFull, line: d.moveOutMtd, projected: d.moveOutProjected };
    case "net": {
      const bar =
        d.moveInFull != null && d.moveOutFull != null
          ? d.moveInFull - d.moveOutFull
          : null;
      const line =
        d.moveInMtd != null && d.moveOutMtd != null
          ? d.moveInMtd - d.moveOutMtd
          : null;
      const projected =
        d.moveInProjected != null && d.moveOutProjected != null
          ? d.moveInProjected - d.moveOutProjected
          : null;
      return { bar, line, projected };
    }
    case "occupancy":
      return { bar: d.occupancyEnd, line: d.occupancyMtd, projected: null };
  }
}

function fmtValue(v: number, mode: Mode) {
  if (mode === "occupancy") return `${v.toFixed(1)}%`;
  return String(Math.round(v));
}

function makeTooltip(mode: Mode, dayOfMonth: number) {
  return function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload as MonthActivityData & { _bar?: number; _line?: number };

    const barVal = row._bar;
    const lineVal = row._line;
    const afterDayX =
      barVal != null && lineVal != null && !row.isCurrentMonth
        ? barVal - lineVal
        : null;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
        <p className="font-semibold">{label}</p>
        {payload.map((entry) => {
          const isBar = entry.dataKey === "_bar";
          const name = isBar
            ? row.isCurrentMonth
              ? "Current month"
              : mode === "occupancy"
              ? "End of month"
              : "Full month"
            : mode === "occupancy"
            ? `As of day ${dayOfMonth}`
            : `MTD thru day ${dayOfMonth}`;
          return (
            <div key={entry.dataKey as string} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{name}:</span>
              <span className="font-medium">
                {entry.value != null ? fmtValue(entry.value, mode) : "—"}
              </span>
            </div>
          );
        })}
        {afterDayX != null && mode !== "occupancy" && (
          <div className="flex items-center gap-2 border-t pt-1 mt-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" />
            <span className="text-muted-foreground">After day {dayOfMonth}:</span>
            <span className="font-medium">{fmtValue(afterDayX, mode)}</span>
          </div>
        )}
      </div>
    );
  };
}

export function MtdActivityChart({
  data,
  dayOfMonth,
}: {
  data: MonthActivityData[];
  dayOfMonth: number;
}) {
  const [mode, setMode] = useState<Mode>("moveins");
  const { newestFirst, toggle } = useChartDirection();

  const orderedData = newestFirst ? data : [...data].reverse();

  const displayData = orderedData.map((d) => {
    const { bar, line, projected } = getBarLine(d, mode);
    return {
      ...d,
      _bar: d.isCurrentMonth ? (projected ?? undefined) : (bar ?? undefined),
      _line: line ?? undefined,
    };
  });

  const CustomTooltip = makeTooltip(mode, dayOfMonth);
  const isOccupancy = mode === "occupancy";
  const lineName = isOccupancy ? `As of day ${dayOfMonth}` : `MTD thru day ${dayOfMonth}`;
  const showZeroLine = mode === "net";

  // Occupancy domain: 50–100% by default; drop below 50 only if data requires it
  const occDomain: [number, number] = (() => {
    if (!isOccupancy) return [0, 100];
    const vals = data
      .flatMap((d) => [d.occupancyMtd, d.occupancyEnd])
      .filter((v): v is number => v != null);
    const minVal = vals.length > 0 ? Math.min(...vals) : 50;
    const domainMin = minVal < 50 ? Math.max(0, Math.floor(minVal / 5) * 5) : 50;
    return [domainMin, 100];
  })();

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                mode === m.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggle}
          className="px-2.5 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          {newestFirst ? "Newest → Oldest" : "Oldest → Newest"}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={displayData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            tickFormatter={(v) =>
              isOccupancy ? `${v.toFixed(0)}%` : String(Math.round(v))
            }
            tick={{ fontSize: 12 }}
            width={isOccupancy ? 48 : 32}
            domain={isOccupancy ? occDomain : undefined}
            className="text-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {showZeroLine && <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 2" />}
          <Bar dataKey="_bar" name="Full Month / Projected" opacity={0.5} radius={[3, 3, 0, 0]}>
            {displayData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isCurrentMonth
                    ? "hsl(142 71% 45%)"
                    : "hsl(var(--muted-foreground))"
                }
              />
            ))}
          </Bar>
          <Line
            dataKey="_line"
            name={lineName}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 6 }}
            connectNulls
          />
          {mode === "moveins" && (
            <Line
              dataKey="rentalGoal"
              name="Rental Goal"
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
  );
}
