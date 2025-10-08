"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartWrapper, ChartWrapperProps } from "./ChartWrapper";
import { cn } from "@/lib/utils";

export interface LineChartData {
  [key: string]: string | number;
}

export interface LineChartProps
  extends Partial<Omit<ChartWrapperProps, "children">> {
  data: LineChartData[];
  lines: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    dot?: boolean;
  }>;
  xAxisKey: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curve?: "linear" | "monotone" | "step" | "stepBefore" | "stepAfter";
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export function LineChart({
  data,
  lines,
  xAxisKey,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  curve = "monotone",
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  ...wrapperProps
}: LineChartProps) {
  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={margin}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted-foreground/20"
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          className="text-xs fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          className="text-xs fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip
            content={(props) => {
              if (!props.active || !props.payload || !props.payload.length) {
                return null;
              }
              return (
                <div className="bg-card border border-border rounded-md shadow-lg p-3">
                  <div className="font-medium text-sm mb-2">{props.label}</div>
                  {props.payload.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted-foreground">
                        {entry.name}:
                      </span>
                      <span className="font-medium">
                        {typeof entry.value === "number"
                          ? entry.value.toLocaleString()
                          : entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        )}
        {showLegend && (
          <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
        )}
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type={curve}
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={
              line.color ||
              ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"][index % 5]
            }
            strokeWidth={line.strokeWidth || 2}
            strokeDasharray={line.strokeDasharray}
            dot={line.dot !== false}
            activeDot={{ r: 4, className: "fill-current" }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );

  // If no wrapper props provided, return chart content directly
  if (!wrapperProps || Object.keys(wrapperProps).length === 0) {
    return chartContent;
  }

  return <ChartWrapper {...wrapperProps}>{chartContent}</ChartWrapper>;
}

// Specialized line chart for trends
export function TrendLineChart({
  data,
  valueKey,
  xAxisKey,
  title,
  description,
  trend,
  ...props
}: Omit<LineChartProps, "lines"> & {
  valueKey: string;
  trend?: "up" | "down" | "stable";
}) {
  const trendColor =
    trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#6b7280";

  return (
    <LineChart
      data={data}
      lines={[
        {
          dataKey: valueKey,
          name: title,
          color: trendColor,
          strokeWidth: 3,
        },
      ]}
      xAxisKey={xAxisKey}
      title={title}
      description={description}
      badge={
        trend
          ? {
              text: trend,
              variant:
                trend === "up"
                  ? "default"
                  : trend === "down"
                  ? "destructive"
                  : "secondary",
            }
          : undefined
      }
      {...props}
    />
  );
}

// Multi-line comparison chart
export function ComparisonLineChart({
  data,
  compareKeys,
  xAxisKey,
  title,
  description,
  colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"],
  ...props
}: Omit<LineChartProps, "lines"> & {
  compareKeys: Array<{ key: string; name: string }>;
  colors?: string[];
}) {
  const lines = compareKeys.map((item, index) => ({
    dataKey: item.key,
    name: item.name,
    color: colors[index % colors.length],
    strokeWidth: 2,
  }));

  return (
    <LineChart
      data={data}
      lines={lines}
      xAxisKey={xAxisKey}
      title={title}
      description={description}
      showLegend={true}
      {...props}
    />
  );
}
