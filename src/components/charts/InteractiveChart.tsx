"use client";

import { useState, useRef, useId } from "react";
import { ChartWrapper, ChartWrapperProps } from "./ChartWrapper";
import {
  SimpleChartControls,
  SimpleChartControlsProps,
} from "./SimpleChartControls";
import { useChartExport } from "./chartExport";
import { toast } from "sonner";

export interface InteractiveChartProps
  extends Omit<ChartWrapperProps, "onExport"> {
  // Data and filtering
  data: any[];
  originalData?: any[];
  onDataFilter?: (filteredData: any[]) => void;

  // Chart controls
  showControls?: boolean;
  controlsProps?: Partial<SimpleChartControlsProps>;

  // Export functionality
  exportFormats?: Array<"svg" | "csv" | "json" | "clipboard">;
  exportFilename?: string;

  // Time period filtering
  timePeriodKey?: string; // Key in data for date filtering

  // Custom chart content
  children: React.ReactNode;
}

export function InteractiveChart({
  data,
  originalData,
  onDataFilter,
  showControls = true,
  controlsProps = {},
  exportFormats = ["svg", "csv"],
  exportFilename,
  timePeriodKey = "date",
  children,
  ...wrapperProps
}: InteractiveChartProps) {
  const chartId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const { exportChart } = useChartExport();

  const [filteredData, setFilteredData] = useState(data);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("30d");
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Handle time period changes
  const handleTimePeriodChange = (period: string) => {
    setSelectedTimePeriod(period);

    if (period === "custom") {
      // Custom date range would be handled by date picker in controls
      return;
    }

    // Filter data based on time period
    const now = new Date();
    const periodMap: Record<string, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    };
    const periodDays = periodMap[period];

    if (periodDays && timePeriodKey) {
      const cutoffDate = new Date(
        now.getTime() - periodDays * 24 * 60 * 60 * 1000
      );
      const filtered = (originalData || data).filter((item) => {
        const itemDate = new Date(item[timePeriodKey]);
        return itemDate >= cutoffDate;
      });

      setFilteredData(filtered);
      onDataFilter?.(filtered);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters, [filterId]: value };
    setActiveFilters(newFilters);

    // Apply filters to data
    let filtered = originalData || data;

    Object.entries(newFilters).forEach(([key, filterValue]) => {
      if (filterValue !== undefined && filterValue !== "") {
        filtered = filtered.filter((item) => {
          const itemValue = item[key];

          // Handle different filter types
          if (typeof filterValue === "string") {
            return String(itemValue)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          } else if (typeof filterValue === "number") {
            return Number(itemValue) === filterValue;
          } else {
            return itemValue === filterValue;
          }
        });
      }
    });

    setFilteredData(filtered);
    onDataFilter?.(filtered);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setFilteredData(originalData || data);
    onDataFilter?.(originalData || data);
  };

  // Handle export
  const handleExport = async (format: "svg" | "csv" | "json" | "clipboard") => {
    try {
      setIsLoading(true);

      const filename = exportFilename || wrapperProps.title || "chart";

      await exportChart(chartId, filteredData, format, {
        filename,
        columns:
          filteredData.length > 0 ? Object.keys(filteredData[0]) : undefined,
      });

      toast.success(`Chart exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        `Failed to export chart: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);

    // Reset to original data
    setFilteredData(originalData || data);
    setActiveFilters({});
    onDataFilter?.(originalData || data);

    // Simulate refresh delay
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Chart refreshed");
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      {showControls && (
        <SimpleChartControls
          selectedTimePeriod={selectedTimePeriod}
          onTimePeriodChange={handleTimePeriodChange}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          {...controlsProps}
        />
      )}

      {/* Chart */}
      <div ref={chartRef} id={chartId}>
        <ChartWrapper
          {...wrapperProps}
          isLoading={isLoading}
          onExport={
            exportFormats.length > 0
              ? () => handleExport(exportFormats[0])
              : undefined
          }
        >
          {children}
        </ChartWrapper>
      </div>

      {/* Data Summary */}
      {filteredData.length !== (originalData || data).length && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {(originalData || data).length}{" "}
          records
        </div>
      )}
    </div>
  );
}
