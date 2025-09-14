// Chart color configuration for consistent theming
export const chartColors = {
  primary: "#3b82f6",
  secondary: "#6b7280",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
  orange: "#f97316",
  pink: "#ec4899",
  lime: "#84cc16",
} as const;

// Chart color palette for multi-series charts
export const chartPalette = [
  chartColors.primary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.info,
  chartColors.purple,
  chartColors.orange,
  chartColors.pink,
  chartColors.lime,
  chartColors.secondary,
] as const;

// Status-specific colors
export const statusColors = {
  active: chartColors.success,
  inactive: chartColors.danger,
  pending: chartColors.warning,
  completed: chartColors.primary,
  cancelled: chartColors.secondary,
  draft: chartColors.secondary,
  published: chartColors.success,
  archived: chartColors.secondary,
} as const;

// Performance colors (for metrics that have good/bad states)
export const performanceColors = {
  excellent: "#16a34a", // green-600
  good: "#22c55e", // green-500
  average: "#f59e0b", // amber-500
  poor: "#ef4444", // red-500
  critical: "#dc2626", // red-600
} as const;

// Trend colors
export const trendColors = {
  up: chartColors.success,
  down: chartColors.danger,
  stable: chartColors.secondary,
} as const;

// Chart theme configuration
export const chartTheme = {
  grid: {
    stroke: "hsl(var(--muted-foreground))",
    strokeOpacity: 0.2,
    strokeDasharray: "3 3",
  },
  axis: {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  },
  tooltip: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    color: "hsl(var(--foreground))",
  },
  legend: {
    color: "hsl(var(--muted-foreground))",
  },
} as const;

// Responsive breakpoints for charts
export const chartBreakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
} as const;

// Chart height presets
export const chartHeights = {
  small: 200,
  medium: 300,
  large: 400,
  xlarge: 500,
} as const;

// Common chart margins
export const chartMargins = {
  tight: { top: 5, right: 5, bottom: 5, left: 5 },
  normal: { top: 5, right: 30, left: 20, bottom: 5 },
  loose: { top: 20, right: 30, left: 20, bottom: 20 },
} as const;

// Utility function to get chart color by index
export function getChartColor(index: number): string {
  return chartPalette[index % chartPalette.length];
}

// Utility function to get status color
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase() as keyof typeof statusColors;
  return statusColors[normalizedStatus] || chartColors.secondary;
}

// Utility function to get performance color
export function getPerformanceColor(performance: string): string {
  const normalizedPerformance =
    performance.toLowerCase() as keyof typeof performanceColors;
  return performanceColors[normalizedPerformance] || chartColors.secondary;
}

// Utility function to get trend color
export function getTrendColor(trend: "up" | "down" | "stable"): string {
  return trendColors[trend];
}
