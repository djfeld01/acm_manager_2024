"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { Table } from "@tanstack/react-table";

interface TableFiltersProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

export function TableFilters<TData>({
  table,
  globalFilter,
  setGlobalFilter,
}: TableFiltersProps<TData>) {
  // Get unique locations for the dropdown
  const locations = Array.from(
    new Set(
      table
        .getPreFilteredRowModel()
        .rows.map((row) => {
          const rowData = row.original as any;
          return rowData.locationName || "";
        })
        .filter(Boolean)
    )
  ).sort();

  // Get current location filter
  const locationFilter = table
    .getColumn("locationName")
    ?.getFilterValue() as string;

  // Get current employee name filter
  const employeeNameFilter = table
    .getColumn("lastName")
    ?.getFilterValue() as string;

  const clearAllFilters = () => {
    setGlobalFilter("");
    table.resetColumnFilters();
  };

  const hasActiveFilters = globalFilter || locationFilter || employeeNameFilter;

  return (
    <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Global Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search employees or locations..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>

        {/* Employee Name Filter */}
        <div className="w-full sm:w-48">
          <Input
            placeholder="Employee name..."
            value={employeeNameFilter || ""}
            onChange={(e) =>
              table.getColumn("lastName")?.setFilterValue(e.target.value)
            }
            className="h-8 text-xs"
          />
        </div>

        {/* Location Filter */}
        <div className="w-full sm:w-48">
          <Select
            value={locationFilter || ""}
            onValueChange={(value) =>
              table
                .getColumn("locationName")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="text-xs text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of{" "}
          {table.getPreFilteredRowModel().rows.length} employees
        </div>
      )}
    </div>
  );
}
