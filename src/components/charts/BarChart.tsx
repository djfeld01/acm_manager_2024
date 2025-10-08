"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartWrapper, ChartWrapperProps } from "./ChartWrapper";

export interface BarChartData {
  [key: string]: string | number;
}

export interface BarChartProps
  extends Partial<Omit<ChartWrapperProps, "children">> {
  data: BarChartData[];
  bars: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    stackId?: string;
  }>;
  xAxisKey: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  layout?: "horizontal" | "vertical";
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export function BarChart({
  data,
  bars,
  xAxisKey,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  layout = "vertical",
  margin = { top: 5, right: 30, left: 20, bottom: 5 },
  ...wrapperProps
}: BarChartProps) {
  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={margin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey={xAxisKey} />
        <YAxis />
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
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name || bar.dataKey}
            fill={
              bar.color ||
              ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"][index % 5]
            }
            stackId={bar.stackId}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );

  // If no wrapper props provided, return chart content directly
  if (!wrapperProps || Object.keys(wrapperProps).length === 0) {
    return chartContent;
  }

  return <ChartWrapper {...wrapperProps}>{chartContent}</ChartWrapper>;
}

// Horizontal bar chart for rankings/comparisons
export function HorizontalBarChart({
  data,
  valueKey,
  labelKey,
  title,
  description,
  color = "#3b82f6",
  ...props
}: Omit<BarChartProps, "bars" | "xAxisKey" | "layout"> & {
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  return (
    <BarChart
      data={data}
      bars={[
        {
          dataKey: valueKey,
          name: title,
          color,
        },
      ]}
      xAxisKey={labelKey}
      layout="horizontal"
      title={title}
      description={description}
      {...props}
    />
  );
}

// Stacked bar chart for category breakdowns
export function StackedBarChart({
  data,
  categories,
  xAxisKey,
  title,
  description,
  colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"],
  ...props
}: Omit<BarChartProps, "bars"> & {
  categories: Array<{ key: string; name: string }>;
  colors?: string[];
}) {
  const bars = categories.map((category, index) => ({
    dataKey: category.key,
    name: category.name,
    color: colors[index % colors.length],
    stackId: "stack",
  }));

  return (
    <BarChart
      data={data}
      bars={bars}
      xAxisKey={xAxisKey}
      title={title}
      description={description}
      showLegend={true}
      {...props}
    />
  );
}

// Simple metric bar chart
export function MetricBarChart({
  data,
  valueKey,
  xAxisKey,
  title,
  description,
  target,
  ...props
}: Omit<BarChartProps, "bars"> & {
  valueKey: string;
  target?: number;
}) {
  // Add target line data if provided
  const chartData = target ? data.map((item) => ({ ...item, target })) : data;

  const bars = [
    {
      dataKey: valueKey,
      name: title,
      color: "#3b82f6",
    },
  ];

  if (target) {
    bars.push({
      dataKey: "target",
      name: "Target",
      color: "#ef4444",
    });
  }

  return (
    <BarChart
      data={chartData}
      bars={bars}
      xAxisKey={xAxisKey}
      title={title}
      description={description}
      showLegend={target !== undefined}
      {...props}
    />
  );
}
