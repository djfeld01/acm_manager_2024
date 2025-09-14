"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface ChartFilter {
  id: string;
  label: string;
  value?: any;
  type: "select" | "date" | "dateRange" | "number" | "text";
  options?: Array<{ value: any; label: string }>;
}

export interface TimePeriod {
  id: string;
  label: string;
  value: string;
  days?: number;
}

export interface ChartControlsProps {
  // Time period selection
  timePeriods?: TimePeriod[];
  selectedTimePeriod?: string;
  onTimePeriodChange?: (period: string) => void;

  // Filtering
  filters?: ChartFilter[];
  activeFilters?: Record<string, any>;
  onFilterChange?: (filterId: string, value: any) => void;
  onClearFilters?: () => void;

  // Export functionality
  onExport?: (format: "svg" | "csv" | "json" | "clipboard") => void;
  exportFormats?: Array<"svg" | "csv" | "json" | "clipboard">;

  // Refresh
  onRefresh?: () => void;
  isLoading?: boolean;

  className?: string;
}

const DEFAULT_TIME_PERIODS: TimePeriod[] = [
  { id: "7d", label: "Last 7 days", value: "7d", days: 7 },
  { id: "30d", label: "Last 30 days", value: "30d", days: 30 },
  { id: "90d", label: "Last 90 days", value: "90d", days: 90 },
  { id: "1y", label: "Last year", value: "1y", days: 365 },
  { id: "custom", label: "Custom range", value: "custom" },
];

export function ChartControls({
  timePeriods = DEFAULT_TIME_PERIODS,
  selectedTimePeriod = "30d",
  onTimePeriodChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  onExport,
  exportFormats = ["svg", "csv"],
  onRefresh,
  isLoading = false,
  className,
}: ChartControlsProps) {
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});

  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) => activeFilters[key] !== undefined && activeFilters[key] !== ""
  ).length;

  const handleFilterChange = (filterId: string, value: any) => {
    onFilterChange?.(filterId, value);
  };

  const handleExport = (format: "svg" | "csv" | "json" | "clipboard") => {
    onExport?.(format);
  };

  const renderFilterControl = (filter: ChartFilter) => {
    const currentValue = activeFilters[filter.id];

    switch (filter.type) {
      case "select":
        return (
          <Select
            value={currentValue || ""}
            onValueChange={(value) => handleFilterChange(filter.id, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All {filter.label}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "text":
        return (
          <Input
            placeholder={`Filter by ${filter.label}`}
            value={currentValue || ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={`Filter by ${filter.label}`}
            value={currentValue || ""}
            onChange={(e) =>
              handleFilterChange(
                filter.id,
                e.target.value ? Number(e.target.value) : ""
              )
            }
          />
        );

      case "date":
        return (
          <Input
            type="date"
            placeholder={`Filter by ${filter.label}`}
            value={currentValue ? currentValue.split("T")[0] : ""}
            onChange={(e) =>
              handleFilterChange(
                filter.id,
                e.target.value ? new Date(e.target.value).toISOString() : ""
              )
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Period Selection */}
      {onTimePeriodChange && (
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-sm font-medium">Time Period:</Label>
          <div className="flex flex-wrap gap-1">
            {timePeriods.map((period) => (
              <Button
                key={period.id}
                variant={
                  selectedTimePeriod === period.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => onTimePeriodChange(period.value)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Controls */}
          {filters.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    {filters.map((filter) => (
                      <div key={filter.id} className="space-y-2">
                        <Label className="text-sm">{filter.label}</Label>
                        {renderFilterControl(filter)}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(activeFilters)
                .filter(([_, value]) => value !== undefined && value !== "")
                .map(([key, value]) => {
                  const filter = filters.find((f) => f.id === key);
                  if (!filter) return null;

                  return (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {filter.label}: {String(value)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0"
                        onClick={() => handleFilterChange(key, "")}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
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

          {/* Export Button */}
          {onExport && exportFormats.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Export Format</h4>
                  <Separator />
                  <div className="space-y-1">
                    {exportFormats.map((format) => (
                      <Button
                        key={format}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleExport(format)}
                      >
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
