"use client";

import { useState } from "react";
import { AppShell, PageWrapper } from "@/components/layout";
import {
  LineChart,
  BarChart,
  AreaChart,
  TrendLineChart,
  HorizontalBarChart,
  StackedBarChart,
  StackedAreaChart,
  DonutChart,
  PercentageChart,
  StatusChart,
  chartColors,
} from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ChartsDemoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Mock data for different chart types
  const revenueData = [
    { month: "Jan", revenue: 45000, target: 50000, expenses: 30000 },
    { month: "Feb", revenue: 52000, target: 50000, expenses: 32000 },
    { month: "Mar", revenue: 48000, target: 50000, expenses: 31000 },
    { month: "Apr", revenue: 61000, target: 55000, expenses: 35000 },
    { month: "May", revenue: 55000, target: 55000, expenses: 33000 },
    { month: "Jun", revenue: 67000, target: 60000, expenses: 38000 },
  ];

  const occupancyData = [
    { month: "Jan", occupancy: 85, units: 120 },
    { month: "Feb", occupancy: 88, units: 125 },
    { month: "Mar", occupancy: 82, units: 118 },
    { month: "Apr", occupancy: 91, units: 135 },
    { month: "May", occupancy: 89, units: 132 },
    { month: "Jun", occupancy: 94, units: 140 },
  ];

  const locationData = [
    { location: "Downtown", revenue: 67000, occupancy: 94 },
    { location: "Westside", revenue: 52000, occupancy: 88 },
    { location: "Northside", revenue: 45000, occupancy: 85 },
    { location: "Eastside", revenue: 38000, occupancy: 78 },
    { location: "Southside", revenue: 41000, occupancy: 82 },
  ];

  const categoryData = [
    { month: "Jan", small: 15000, medium: 20000, large: 10000 },
    { month: "Feb", small: 18000, medium: 22000, large: 12000 },
    { month: "Mar", small: 16000, medium: 21000, large: 11000 },
    { month: "Apr", small: 20000, medium: 25000, large: 16000 },
    { month: "May", small: 19000, medium: 23000, large: 13000 },
    { month: "Jun", small: 22000, medium: 28000, large: 17000 },
  ];

  const statusData = [
    { name: "Active", value: 156 },
    { name: "Inactive", value: 24 },
    { name: "Pending", value: 12 },
    { name: "Maintenance", value: 8 },
  ];

  const unitTypeData = [
    { name: "Small (5x5)", value: 45 },
    { name: "Medium (10x10)", value: 78 },
    { name: "Large (10x20)", value: 32 },
    { name: "XL (20x20)", value: 15 },
  ];

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const simulateError = () => {
    setHasError(!hasError);
  };

  return (
    <AppShell>
      <PageWrapper
        title="Charts Demo"
        description="Interactive demonstration of chart components using Recharts"
        badge={{ text: "Demo", variant: "secondary" }}
        actions={[
          {
            label: "Simulate Loading",
            onClick: simulateLoading,
            variant: "outline",
          },
          {
            label: hasError ? "Clear Error" : "Simulate Error",
            onClick: simulateError,
            variant: "outline",
          },
        ]}
      >
        <div className="space-y-6">
          {/* Chart Controls */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Chart Components</h2>
              <p className="text-sm text-muted-foreground">
                Responsive charts with Tailwind CSS integration
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Recharts v2.15.3</Badge>
              <Badge variant="outline">Responsive</Badge>
              <Badge variant="outline">Themed</Badge>
            </div>
          </div>

          <Tabs defaultValue="line" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="line">Line Charts</TabsTrigger>
              <TabsTrigger value="bar">Bar Charts</TabsTrigger>
              <TabsTrigger value="area">Area Charts</TabsTrigger>
              <TabsTrigger value="pie">Pie Charts</TabsTrigger>
            </TabsList>

            <TabsContent value="line" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <LineChart
                  title="Revenue Trend"
                  description="Monthly revenue vs target"
                  data={revenueData}
                  lines={[
                    {
                      dataKey: "revenue",
                      name: "Revenue",
                      color: chartColors.primary,
                    },
                    {
                      dataKey: "target",
                      name: "Target",
                      color: chartColors.warning,
                      strokeDasharray: "5 5",
                    },
                  ]}
                  xAxisKey="month"
                  isLoading={isLoading}
                  error={
                    hasError ? new Error("Failed to load revenue data") : null
                  }
                  onRetry={() => setHasError(false)}
                  onExport={() => console.log("Exporting revenue chart...")}
                />

                <TrendLineChart
                  title="Occupancy Rate"
                  description="Monthly occupancy percentage"
                  data={occupancyData}
                  valueKey="occupancy"
                  xAxisKey="month"
                  trend="up"
                  isLoading={isLoading}
                  error={
                    hasError ? new Error("Failed to load occupancy data") : null
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="bar" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <BarChart
                  title="Revenue by Location"
                  description="Current month performance"
                  data={locationData}
                  bars={[
                    {
                      dataKey: "revenue",
                      name: "Revenue",
                      color: "#22c55e", // Explicit green color
                    },
                  ]}
                  xAxisKey="location"
                  isLoading={isLoading}
                  error={
                    hasError ? new Error("Failed to load location data") : null
                  }
                />

                <HorizontalBarChart
                  title="Location Rankings"
                  description="Ranked by occupancy rate"
                  data={locationData.sort((a, b) => b.occupancy - a.occupancy)}
                  valueKey="occupancy"
                  labelKey="location"
                  color="#06b6d4" // Explicit cyan color
                  isLoading={isLoading}
                />
              </div>

              <StackedBarChart
                title="Revenue by Unit Size"
                description="Monthly breakdown by unit category"
                data={categoryData}
                categories={[
                  { key: "small", name: "Small Units" },
                  { key: "medium", name: "Medium Units" },
                  { key: "large", name: "Large Units" },
                ]}
                xAxisKey="month"
                colors={[
                  chartColors.primary,
                  chartColors.success,
                  chartColors.warning,
                ]}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="area" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <AreaChart
                  title="Revenue vs Expenses"
                  description="Monthly financial overview"
                  data={revenueData}
                  areas={[
                    {
                      dataKey: "revenue",
                      name: "Revenue",
                      color: chartColors.success,
                    },
                    {
                      dataKey: "expenses",
                      name: "Expenses",
                      color: chartColors.danger,
                    },
                  ]}
                  xAxisKey="month"
                  isLoading={isLoading}
                  error={
                    hasError ? new Error("Failed to load financial data") : null
                  }
                />

                <StackedAreaChart
                  title="Unit Category Trends"
                  description="Cumulative revenue by unit size"
                  data={categoryData}
                  categories={[
                    { key: "small", name: "Small Units" },
                    { key: "medium", name: "Medium Units" },
                    { key: "large", name: "Large Units" },
                  ]}
                  xAxisKey="month"
                  colors={[
                    chartColors.primary,
                    chartColors.success,
                    chartColors.warning,
                  ]}
                  isLoading={isLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="pie" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatusChart
                  title="Unit Status"
                  description="Current unit availability"
                  data={statusData}
                  isLoading={isLoading}
                  error={
                    hasError ? new Error("Failed to load status data") : null
                  }
                />

                <DonutChart
                  title="Unit Types"
                  description="Distribution by size"
                  data={unitTypeData}
                  centerLabel="Total Units"
                  centerValue="170"
                  isLoading={isLoading}
                />

                <PercentageChart
                  title="Revenue Distribution"
                  description="By unit category"
                  data={[
                    { name: "Small", value: 95000 },
                    { name: "Medium", value: 139000 },
                    { name: "Large", value: 79000 },
                  ]}
                  showPercentages={true}
                  isLoading={isLoading}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Chart Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chart Features</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Responsive Design</h4>
                <p className="text-sm text-muted-foreground">
                  Charts automatically adapt to different screen sizes and
                  containers
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Loading States</h4>
                <p className="text-sm text-muted-foreground">
                  Skeleton loaders provide smooth loading experiences
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Error Handling</h4>
                <p className="text-sm text-muted-foreground">
                  Graceful error states with retry functionality
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Theming</h4>
                <p className="text-sm text-muted-foreground">
                  Consistent colors that adapt to light/dark themes
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
