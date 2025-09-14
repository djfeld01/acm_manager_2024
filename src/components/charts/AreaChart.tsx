"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartWrapper, ChartWrapperProps } from "./ChartWrapper";

export interface AreaChartData {
  [key: string]: string | number;
}

export interface AreaChartProps
  extends Partial<Omit<ChartWrapperProps, "children">> {
  data: AreaChartData[];
  areas: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    stackId?: string;
    strokeWidth?: number;
  }>;
  xAxisKey: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curve?: "linear" | "monotone" | "step" | "stepBefore" | "stepAfter";
  fillOpacity?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export function AreaChart({
  data,
  areas,
  xAxisKey,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  curve = "monotone",
  fillOpacity = 0.6,
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  ...wrapperProps
}: AreaChartProps) {
  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart data={data} margin={margin}>
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
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type={curve}
            dataKey={area.dataKey}
            name={area.name || area.dataKey}
            stroke={
              area.color ||
              ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"][index % 5]
            }
            fill={
              area.color ||
              ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"][index % 5]
            }
            fillOpacity={fillOpacity}
            strokeWidth={area.strokeWidth || 2}
            stackId={area.stackId}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );

  // If no wrapper props provided, return chart content directly
  if (!wrapperProps || Object.keys(wrapperProps).length === 0) {
    return chartContent;
  }

  return <ChartWrapper {...wrapperProps}>{chartContent}</ChartWrapper>;
}

// Stacked area chart for cumulative data
export function StackedAreaChart({
  data,
  categories,
  xAxisKey,
  title,
  description,
  colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"],
  ...props
}: Omit<AreaChartProps, "areas"> & {
  categories: Array<{ key: string; name: string }>;
  colors?: string[];
}) {
  const areas = categories.map((category, index) => ({
    dataKey: category.key,
    name: category.name,
    color: colors[index % colors.length],
    stackId: "stack",
  }));

  return (
    <AreaChart
      data={data}
      areas={areas}
      xAxisKey={xAxisKey}
      title={title}
      description={description}
      showLegend={true}
      fillOpacity={0.8}
      {...props}
    />
  );
}

// Simple trend area chart
export function TrendAreaChart({
  data,
  valueKey,
  xAxisKey,
  title,
  description,
  trend,
  gradient = true,
  ...props
}: Omit<AreaChartProps, "areas"> & {
  valueKey: string;
  trend?: "up" | "down" | "stable";
  gradient?: boolean;
}) {
  const trendColor =
    trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#6b7280";

  return (
    <AreaChart
      data={data}
      areas={[
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
      fillOpacity={gradient ? 0.3 : 0.6}
      {...props}
    />
  );
}

// Performance area chart with target zones
export function PerformanceAreaChart({
  data,
  valueKey,
  xAxisKey,
  title,
  description,
  targetMin,
  targetMax,
  ...props
}: Omit<AreaChartProps, "areas"> & {
  valueKey: string;
  targetMin?: number;
  targetMax?: number;
}) {
  // Add target zone data if provided
  const chartData =
    targetMin !== undefined && targetMax !== undefined
      ? data.map((item) => ({
          ...item,
          targetMin,
          targetMax,
          targetZone: targetMax - targetMin,
        }))
      : data;

  const areas: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    stackId?: string;
    strokeWidth?: number;
  }> = [
    {
      dataKey: valueKey,
      name: title,
      color: "#3b82f6",
      strokeWidth: 3,
    },
  ];

  if (targetMin !== undefined && targetMax !== undefined) {
    areas.unshift({
      dataKey: "targetZone",
      name: "Target Zone",
      color: "#22c55e",
      stackId: "target",
      strokeWidth: 1,
    });
  }

  return (
    <AreaChart
      data={chartData}
      areas={areas}
      xAxisKey={xAxisKey}
      title={title}
      description={description}
      showLegend={targetMin !== undefined && targetMax !== undefined}
      fillOpacity={0.2}
      {...props}
    />
  );
}
