"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeviceInfo } from "@/lib/mobile/device-detection";
import { useVirtualScroll } from "@/lib/mobile/performance";
import { TouchFriendlyButton } from "./TouchFriendlyButton";
import { SwipeableCard, SwipeAction } from "./SwipeableCard";
import { ChevronDown, ChevronUp, Filter, Search } from "lucide-react";

export interface MobileTableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  primary?: boolean; // Show in collapsed view
  secondary?: boolean; // Show in expanded view
}

export interface MobileDataTableProps<T = any> {
  data: T[];
  columns: MobileTableColumn<T>[];
  onRowSelect?: (row: T) => void;
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  searchable?: boolean;
  filterable?: boolean;
  virtualScrolling?: boolean;
  itemHeight?: number;
  getRowActions?: (row: T) => SwipeAction[];
  getRowId?: (row: T) => string;
  emptyText?: string;
  className?: string;
}

export function MobileDataTable<T = any>({
  data,
  columns,
  onRowSelect,
  onSort,
  sortBy,
  sortDirection,
  searchable = false,
  filterable = false,
  virtualScrolling = false,
  itemHeight = 120,
  getRowActions,
  getRowId = (row) => String(data.indexOf(row)),
  emptyText = "No data available",
  className,
}: MobileDataTableProps<T>) {
  const { isMobile } = useDeviceInfo();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter data based on search
  const filteredData = searchQuery
    ? data.filter((row) =>
        columns.some((col) => {
          const value = col.accessorKey ? row[col.accessorKey] : "";
          return String(value)
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        })
      )
    : data;

  const { containerRef, visibleItems, totalHeight } =
    useVirtualScroll<HTMLDivElement>(filteredData, {
      itemHeight,
      containerHeight: 400, // Default height
    });

  const primaryColumns = columns.filter((col) => col.primary);
  const secondaryColumns = columns.filter((col) => col.secondary);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const renderMobileRow = (row: T, index: number) => {
    const rowId = getRowId(row);
    const isExpanded = expandedRows.has(rowId);
    const actions = getRowActions?.(row) || [];

    const CardComponent = actions.length > 0 ? SwipeableCard : Card;
    const cardProps = actions.length > 0 ? { rightActions: actions } : {};

    return (
      <CardComponent
        key={rowId}
        className="mb-2 cursor-pointer"
        onClick={() => onRowSelect?.(row)}
        {...cardProps}
      >
        <CardContent className="p-4">
          {/* Primary content - always visible */}
          <div className="space-y-2">
            {primaryColumns.map((column) => {
              const value = column.cell
                ? column.cell(row)
                : column.accessorKey
                ? row[column.accessorKey]
                : "";

              return (
                <div
                  key={column.id}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.header}
                  </span>
                  <span className="text-sm font-semibold">{String(value)}</span>
                </div>
              );
            })}
          </div>

          {/* Expand/Collapse button */}
          {secondaryColumns.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <TouchFriendlyButton
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpansion(rowId);
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show More
                  </>
                )}
              </TouchFriendlyButton>
            </div>
          )}

          {/* Secondary content - expandable */}
          {isExpanded && secondaryColumns.length > 0 && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {secondaryColumns.map((column) => {
                const value = column.cell
                  ? column.cell(row)
                  : column.accessorKey
                  ? row[column.accessorKey]
                  : "";

                return (
                  <div
                    key={column.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      {column.header}
                    </span>
                    <span className="text-sm">{String(value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </CardComponent>
    );
  };

  const renderDesktopTable = () => (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th
                key={column.id}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
              >
                {column.sortable && onSort ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() =>
                      onSort(
                        column.id,
                        sortBy === column.id && sortDirection === "asc"
                          ? "desc"
                          : "asc"
                      )
                    }
                  >
                    {column.header}
                    {sortBy === column.id && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </Button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr
              key={getRowId(row)}
              className="border-b hover:bg-muted/50 cursor-pointer"
              onClick={() => onRowSelect?.(row)}
            >
              {columns.map((column) => (
                <td key={column.id} className="p-4 align-middle">
                  {column.cell
                    ? column.cell(row)
                    : column.accessorKey
                    ? String(row[column.accessorKey])
                    : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!isMobile) {
    return (
      <div className={className}>
        {/* Search and filters for desktop */}
        {(searchable || filterable) && (
          <div className="mb-4 flex gap-2">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )}
          </div>
        )}

        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          renderDesktopTable()
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile search and filters */}
      {(searchable || filterable) && (
        <div className="space-y-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-md text-base"
              />
            </div>
          )}
          {filterable && (
            <TouchFriendlyButton variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </TouchFriendlyButton>
          )}
        </div>
      )}

      {/* Mobile data display */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {emptyText}
          </CardContent>
        </Card>
      ) : virtualScrolling ? (
        <div
          ref={containerRef}
          className="h-96 overflow-auto"
          style={{ height: "400px" }}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            {visibleItems.map(({ item, index, style }) => (
              <div key={getRowId(item)} style={style}>
                {renderMobileRow(item, index)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredData.map((row, index) => renderMobileRow(row, index))}
        </div>
      )}
    </div>
  );
}
