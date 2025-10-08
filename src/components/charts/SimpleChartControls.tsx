"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SimpleChartFilter {
  id: string;
  label: string;
  type: "select" | "text";
  options?: Array<{ value: any; label: string }>;
}

export interface SimpleChartControlsProps {
  // Time period selection
  selectedTimePeriod?: string;
  onTimePeriodChange?: (period: string) => void;

  // Simple filtering
  filters?: SimpleChartFilter[];
  activeFilters?: Record<string, any>;
  onFilterChange?: (filterId: string, value: any) => void;
  onClearFilters?: () => void;

  // Export functionality
  onExport?: (format: "svg" | "csv") => void;

  // Refresh
  onRefresh?: () => void;
  isLoading?: boolean;

  className?: string;
}

const TIME_PERIODS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "1y", label: "1 year" },
];

export function SimpleChartControls({
  selectedTimePeriod = "30d",
  onTimePeriodChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  onExport,
  onRefresh,
  isLoading = false,
  className,
}: SimpleChartControlsProps) {
  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) =>
      activeFilters[key] !== undefined &&
      activeFilters[key] !== "" &&
      activeFilters[key] !== "all"
  ).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Period Selection */}
      {onTimePeriodChange && (
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-sm font-medium">Period:</Label>
          {TIME_PERIODS.map((period) => (
            <Button
              key={period.id}
              variant={selectedTimePeriod === period.id ? "default" : "outline"}
              size="sm"
              onClick={() => onTimePeriodChange(period.id)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      )}

      {/* Simple Filters */}
      {filters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Filters:</Label>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {filter.label}
                </Label>
                {filter.type === "select" ? (
                  <Select
                    value={activeFilters[filter.id] || "all"}
                    onValueChange={(value) =>
                      onFilterChange?.(filter.id, value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={`All ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {filter.label}</SelectItem>
                      {filter.options?.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="h-8"
                    placeholder={`Filter ${filter.label}`}
                    value={activeFilters[filter.id] || ""}
                    onChange={(e) =>
                      onFilterChange?.(filter.id, e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
              active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCwIcon
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          )}

          {/* Export Buttons */}
          {onExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport("svg")}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport("csv")}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
