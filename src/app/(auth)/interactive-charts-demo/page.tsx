"use client";

import { useState } from "react";
import { AppShell, PageWrapper } from "@/components/layout";
import {
  InteractiveChart,
  BarChart,
  LineChart,
  AreaChart,
} from "@/components/charts";
import { SimpleChartControls } from "@/components/charts/SimpleChartControls";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, format, subDays } from "date-fns";

export default function InteractiveChartsDemoPage() {
  // Generate sample data with dates
  const generateTimeSeriesData = (days: number) => {
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      data.push({
        date: format(date, "yyyy-MM-dd"),
        revenue: Math.floor(Math.random() * 50000) + 30000,
        expenses: Math.floor(Math.random() * 30000) + 20000,
        occupancy: Math.floor(Math.random() * 20) + 75,
        newRentals: Math.floor(Math.random() * 10) + 5,
        location: ["Downtown", "Westside", "Northside"][
          Math.floor(Math.random() * 3)
        ],
        category: ["Small", "Medium", "Large"][Math.floor(Math.random() * 3)],
      });
    }

    return data;
  };

  const [timeSeriesData] = useState(() => generateTimeSeriesData(90));
  const [filteredData, setFilteredData] = useState(timeSeriesData);

  // Sample filters for the charts
  const sampleFilters = [
    {
      id: "location",
      label: "Location",
      type: "select" as const,
      options: [
        { value: "Downtown", label: "Downtown" },
        { value: "Westside", label: "Westside" },
        { value: "Northside", label: "Northside" },
      ],
    },
    {
      id: "category",
      label: "Unit Category",
      type: "select" as const,
      options: [
        { value: "Small", label: "Small Units" },
        { value: "Medium", label: "Medium Units" },
        { value: "Large", label: "Large Units" },
      ],
    },
  ];

  return (
    <AppShell>
      <PageWrapper
        title="Interactive Charts Demo"
        description="Advanced chart features with filtering, export, and enhanced tooltips"
        badge={{ text: "Interactive", variant: "default" }}
      >
        <div className="space-y-6">
          {/* Feature Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Time Period Filtering</h3>
              <p className="text-sm text-muted-foreground">
                Switch between different time periods with preset buttons
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Data Filtering</h3>
              <p className="text-sm text-muted-foreground">
                Filter charts by location, category, or custom criteria
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Export Options</h3>
              <p className="text-sm text-muted-foreground">
                Export charts as SVG, CSV, JSON, or copy to clipboard
              </p>
            </div>
          </div>

          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
              <TabsTrigger value="occupancy">Occupancy Trends</TabsTrigger>
              <TabsTrigger value="comparison">Multi-Metric View</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-6">
              <InteractiveChart
                title="Revenue Analysis"
                description="Interactive revenue tracking with filtering and export"
                data={filteredData}
                originalData={timeSeriesData}
                onDataFilter={setFilteredData}
                timePeriodKey="date"
                exportFilename="revenue-analysis"
                exportFormats={["svg", "csv", "json", "clipboard"]}
                controlsProps={{
                  filters: sampleFilters,
                }}
              >
                <BarChart
                  data={filteredData}
                  bars={[
                    {
                      dataKey: "revenue",
                      name: "Revenue",
                      color: "#22c55e",
                    },
                  ]}
                  xAxisKey="date"
                  showTooltip={true}
                />
              </InteractiveChart>
            </TabsContent>

            <TabsContent value="occupancy" className="space-y-6">
              <InteractiveChart
                title="Occupancy Trends"
                description="Track occupancy rates over time with trend analysis"
                data={filteredData}
                originalData={timeSeriesData}
                onDataFilter={setFilteredData}
                timePeriodKey="date"
                exportFilename="occupancy-trends"
                controlsProps={{
                  filters: sampleFilters,
                }}
              >
                <LineChart
                  data={filteredData}
                  lines={[
                    {
                      dataKey: "occupancy",
                      name: "Occupancy %",
                      color: "#3b82f6",
                    },
                  ]}
                  xAxisKey="date"
                  showTooltip={true}
                />
              </InteractiveChart>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <InteractiveChart
                title="Revenue vs Expenses"
                description="Compare revenue and expenses with interactive filtering"
                data={filteredData}
                originalData={timeSeriesData}
                onDataFilter={setFilteredData}
                timePeriodKey="date"
                exportFilename="revenue-vs-expenses"
                controlsProps={{
                  filters: sampleFilters,
                }}
              >
                <AreaChart
                  data={filteredData}
                  areas={[
                    {
                      dataKey: "revenue",
                      name: "Revenue",
                      color: "#22c55e",
                    },
                    {
                      dataKey: "expenses",
                      name: "Expenses",
                      color: "#ef4444",
                    },
                  ]}
                  xAxisKey="date"
                  showTooltip={true}
                />
              </InteractiveChart>
            </TabsContent>
          </Tabs>

          {/* Standalone Chart Controls Demo */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Standalone Chart Controls</h2>
            <div className="rounded-lg border p-4">
              <SimpleChartControls
                filters={sampleFilters.map((f) => ({
                  ...f,
                  type: f.type as "select" | "text",
                }))}
                onFilterChange={(filterId, value) => {
                  console.log("Filter changed:", filterId, value);
                }}
                onExport={(format) => {
                  console.log("Export requested:", format);
                }}
                onRefresh={() => {
                  console.log("Refresh requested");
                }}
              />
            </div>
          </div>

          {/* Features Summary */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Interactive Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-medium">Time Period Controls</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Last 7, 30, 90 days, or 1 year presets</li>
                  <li>• Custom date range selection</li>
                  <li>• Automatic data filtering by date</li>
                  <li>• Smooth transitions between periods</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Enhanced Tooltips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Formatted values with proper number formatting</li>
                  <li>• Color-coded data series indicators</li>
                  <li>• Responsive tooltip positioning</li>
                  <li>• Custom styling that matches theme</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Data Filtering</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Multiple filter types (select, text, number, date)</li>
                  <li>• Active filter badges with clear options</li>
                  <li>• Real-time data filtering</li>
                  <li>• Filter state management</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Export Capabilities</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• SVG export for vector graphics</li>
                  <li>• CSV export for data analysis</li>
                  <li>• JSON export for developers</li>
                  <li>• Clipboard copy for quick sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </AppShell>
  );
}
