"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartWrapper, ChartWrapperProps } from "./ChartWrapper";

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps
  extends Partial<Omit<ChartWrapperProps, "children">> {
  data: PieChartData[];
  dataKey?: string;
  nameKey?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
  labelFormatter?: (entry: PieChartData) => string;
  valueFormatter?: (value: number) => string;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#ec4899", // pink
  "#6b7280", // gray
];

export function PieChart({
  data,
  dataKey = "value",
  nameKey = "name",
  showLegend = true,
  showTooltip = true,
  showLabels = false,
  innerRadius = 0,
  outerRadius = 80,
  colors = DEFAULT_COLORS,
  labelFormatter,
  valueFormatter,
  ...wrapperProps
}: PieChartProps) {
  const chartContent = (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={
            showLabels
              ? (entry) => {
                  if (labelFormatter) return labelFormatter(entry);
                  return `${entry[nameKey]}: ${entry[dataKey]}`;
                }
              : false
          }
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || colors[index % colors.length]}
            />
          ))}
        </Pie>
        {showTooltip && (
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => {
              if (valueFormatter) return valueFormatter(value);
              return value;
            }}
          />
        )}
        {showLegend && (
          <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))" }} />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );

  // If no wrapper props provided, return chart content directly
  if (!wrapperProps || Object.keys(wrapperProps).length === 0) {
    return chartContent;
  }

  return <ChartWrapper {...wrapperProps}>{chartContent}</ChartWrapper>;
}

// Donut chart (pie chart with inner radius)
export function DonutChart({
  data,
  title,
  description,
  centerLabel,
  centerValue,
  ...props
}: PieChartProps & {
  centerLabel?: string;
  centerValue?: string | number;
}) {
  return (
    <div className="relative">
      <PieChart
        data={data}
        title={title}
        description={description}
        innerRadius={60}
        outerRadius={100}
        {...props}
      />
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {centerValue && (
              <div className="text-2xl font-bold">{centerValue}</div>
            )}
            {centerLabel && (
              <div className="text-sm text-muted-foreground">{centerLabel}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple percentage breakdown chart
export function PercentageChart({
  data,
  title,
  description,
  showPercentages = true,
  ...props
}: Omit<PieChartProps, "labelFormatter" | "valueFormatter"> & {
  showPercentages?: boolean;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const labelFormatter = (entry: PieChartData) => {
    if (!showPercentages) return entry.name;
    const percentage = ((entry.value / total) * 100).toFixed(1);
    return `${entry.name}: ${percentage}%`;
  };

  const valueFormatter = (value: number) => {
    if (!showPercentages) return value.toString();
    const percentage = ((value / total) * 100).toFixed(1);
    return `${percentage}%`;
  };

  return (
    <PieChart
      data={data}
      title={title}
      description={description}
      labelFormatter={labelFormatter}
      valueFormatter={valueFormatter}
      showLabels={true}
      {...props}
    />
  );
}

// Status distribution chart
export function StatusChart({
  data,
  title,
  description,
  statusColors = {
    active: "#22c55e",
    inactive: "#ef4444",
    pending: "#f59e0b",
    completed: "#3b82f6",
    cancelled: "#6b7280",
  },
  ...props
}: Omit<PieChartProps, "colors"> & {
  statusColors?: Record<string, string>;
}) {
  const dataWithColors = data.map((item) => ({
    ...item,
    color: statusColors[item.name.toLowerCase()] || DEFAULT_COLORS[0],
  }));

  return (
    <DonutChart
      data={dataWithColors}
      title={title}
      description={description}
      centerLabel="Total"
      centerValue={data.reduce((sum, item) => sum + item.value, 0)}
      {...props}
    />
  );
}
