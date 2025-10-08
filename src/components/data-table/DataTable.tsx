"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination, usePagination } from "../pagination/Pagination";
import { VirtualList } from "../virtualization/VirtualList";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  Download,
  MoreHorizontal,
} from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  accessor?: (item: T) => any;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
  };
  virtualization?: {
    enabled: boolean;
    height: number;
    itemHeight: number;
  };
  selection?: {
    enabled: boolean;
    selectedItems?: T[];
    onSelectionChange?: (selectedItems: T[]) => void;
    getItemId?: (item: T) => string | number;
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: {
      key: keyof T | string;
      direction: "asc" | "desc";
    };
    onSortChange?: (key: keyof T | string, direction: "asc" | "desc") => void;
  };
  filtering?: {
    enabled: boolean;
    searchPlaceholder?: string;
    onFilterChange?: (filters: Record<string, any>) => void;
  };
  actions?: {
    enabled: boolean;
    onExport?: (data: T[]) => void;
    customActions?: React.ReactNode;
  };
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pagination = { enabled: true, pageSize: 20 },
  virtualization = { enabled: false, height: 400, itemHeight: 50 },
  selection = { enabled: false },
  sorting = { enabled: true },
  filtering = { enabled: true },
  actions = { enabled: true },
  loading = false,
  error = null,
  emptyMessage = "No data available",
  className,
  tableClassName,
  onRowClick,
}: DataTableProps<T>) {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: "asc" | "desc";
  } | null>(sorting.defaultSort || null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [selectedItems, setSelectedItems] = useState<T[]>(
    selection.selectedItems || []
  );

  // Get item ID for selection
  const getItemId = selection.getItemId || ((item: T, index: number) => index);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (filtering.enabled && searchTerm) {
      filtered = filtered.filter((item) =>
        columns.some((column) => {
          const value = column.accessor
            ? column.accessor(item)
            : item[column.key as keyof T];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filters
    if (filtering.enabled) {
      Object.entries(columnFilters).forEach(([columnKey, filterValue]) => {
        if (filterValue) {
          filtered = filtered.filter((item) => {
            const column = columns.find((col) => col.key === columnKey);
            const value = column?.accessor
              ? column.accessor(item)
              : item[columnKey as keyof T];
            return String(value)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (sorting.enabled && sortConfig) {
      filtered.sort((a, b) => {
        const column = columns.find((col) => col.key === sortConfig.key);
        const aValue = column?.accessor
          ? column.accessor(a)
          : a[sortConfig.key as keyof T];
        const bValue = column?.accessor
          ? column.accessor(b)
          : b[sortConfig.key as keyof T];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    data,
    columns,
    searchTerm,
    columnFilters,
    sortConfig,
    filtering.enabled,
    sorting.enabled,
  ]);

  // Pagination
  const paginationState = usePagination({
    totalItems: processedData.length,
    initialItemsPerPage: pagination.pageSize || 20,
  });

  const paginatedData = pagination.enabled
    ? processedData.slice(paginationState.startIndex, paginationState.endIndex)
    : processedData;

  // Sorting handlers
  const handleSort = (columnKey: keyof T | string) => {
    if (!sorting.enabled) return;

    const newDirection: "asc" | "desc" =
      sortConfig?.key === columnKey && sortConfig.direction === "asc"
        ? "desc"
        : "asc";

    const newSortConfig = { key: columnKey, direction: newDirection };
    setSortConfig(newSortConfig);
    sorting.onSortChange?.(columnKey, newDirection);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (!selection.enabled) return;

    const newSelection = checked ? [...paginatedData] : [];
    setSelectedItems(newSelection);
    selection.onSelectionChange?.(newSelection);
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (!selection.enabled) return;

    const itemId = getItemId(item, 0);
    const newSelection = checked
      ? [...selectedItems, item]
      : selectedItems.filter((selected) => getItemId(selected, 0) !== itemId);

    setSelectedItems(newSelection);
    selection.onSelectionChange?.(newSelection);
  };

  const isItemSelected = (item: T) => {
    if (!selection.enabled) return false;
    const itemId = getItemId(item, 0);
    return selectedItems.some((selected) => getItemId(selected, 0) === itemId);
  };

  // Filter handlers
  const handleColumnFilter = (columnKey: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    filtering.onFilterChange?.({ ...columnFilters, [columnKey]: value });
  };

  // Render table row
  const renderTableRow = (item: T, index: number) => (
    <TableRow
      key={getItemId(item, index)}
      className={cn(
        "hover:bg-muted/50 cursor-pointer",
        isItemSelected(item) && "bg-muted"
      )}
      onClick={() => onRowClick?.(item, index)}
    >
      {selection.enabled && (
        <TableCell className="w-12">
          <Checkbox
            checked={isItemSelected(item)}
            onCheckedChange={(checked) => handleSelectItem(item, !!checked)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}
      {columns.map((column) => {
        const value = column.accessor
          ? column.accessor(item)
          : item[column.key as keyof T];

        return (
          <TableCell
            key={String(column.key)}
            className={cn(column.className)}
            style={{
              width: column.width,
              minWidth: column.minWidth,
            }}
          >
            {column.render ? column.render(value, item, index) : String(value)}
          </TableCell>
        );
      })}
    </TableRow>
  );

  // Render table header
  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        {selection.enabled && (
          <TableHead className="w-12">
            <Checkbox
              checked={
                paginatedData.length > 0 &&
                paginatedData.every((item) => isItemSelected(item))
              }
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
        )}
        {columns.map((column) => (
          <TableHead
            key={String(column.key)}
            className={cn(
              column.headerClassName,
              column.sortable && sorting.enabled && "cursor-pointer select-none"
            )}
            style={{
              width: column.width,
              minWidth: column.minWidth,
            }}
            onClick={() =>
              column.sortable && sorting.enabled && handleSort(column.key)
            }
          >
            <div className="flex items-center gap-2">
              {column.header}
              {column.sortable && sorting.enabled && (
                <div className="flex flex-col">
                  {sortConfig?.key === column.key ? (
                    sortConfig.direction === "asc" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              )}
            </div>
          </TableHead>
        ))}
      </TableRow>
      {filtering.enabled && (
        <TableRow>
          {selection.enabled && <TableHead />}
          {columns.map((column) => (
            <TableHead key={`filter-${String(column.key)}`}>
              {column.filterable && (
                <Input
                  placeholder={`Filter ${column.header.toLowerCase()}...`}
                  value={columnFilters[String(column.key)] || ""}
                  onChange={(e) =>
                    handleColumnFilter(String(column.key), e.target.value)
                  }
                  className="h-8"
                />
              )}
            </TableHead>
          ))}
        </TableRow>
      )}
    </TableHeader>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {(filtering.enabled || actions.enabled) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {filtering.enabled && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={filtering.searchPlaceholder || "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            )}

            {selection.enabled && selectedItems.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedItems.length} item(s) selected
              </div>
            )}
          </div>

          {actions.enabled && (
            <div className="flex items-center gap-2">
              {actions.onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => actions.onExport!(processedData)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
              {actions.customActions}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {virtualization.enabled ? (
        <div className="border rounded-md">
          {/* Fixed header for virtual table */}
          <div className="border-b bg-muted/50">
            <div className="flex">
              {selection.enabled && (
                <div className="flex items-center justify-center w-12 h-12 border-r">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 &&
                      paginatedData.every((item) => isItemSelected(item))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </div>
              )}
              {columns.map((column) => (
                <div
                  key={String(column.key)}
                  className={cn(
                    "flex items-center px-4 py-3 text-left text-sm font-medium text-muted-foreground border-r last:border-r-0",
                    column.sortable && "cursor-pointer hover:bg-muted/80",
                    column.width && `w-[${column.width}px]`,
                    !column.width && "flex-1"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  {column.header}
                  {column.sortable && sortConfig?.key === column.key && (
                    <span className="ml-2">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Virtual list content */}
          <VirtualList
            items={paginatedData}
            itemHeight={virtualization.itemHeight}
            height={virtualization.height}
            renderItem={(item, index) => (
              <div
                className="flex border-b hover:bg-muted/50 cursor-pointer"
                onClick={() => onRowClick?.(item, index)}
              >
                {selection.enabled && (
                  <div className="flex items-center justify-center w-12 border-r">
                    <input
                      type="checkbox"
                      checked={isItemSelected(item)}
                      onChange={(e) => handleSelectItem(item, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  </div>
                )}
                {columns.map((column) => (
                  <div
                    key={String(column.key)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm border-r last:border-r-0",
                      column.width && `w-[${column.width}px]`,
                      !column.width && "flex-1"
                    )}
                  >
                    {column.render
                      ? column.render(item[column.key], item, index)
                      : String(item[column.key] ?? "")}
                  </div>
                ))}
              </div>
            )}
            getItemKey={(item, index) => String(getItemId(item, index))}
          />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table className={tableClassName}>
            {renderTableHeader()}
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (selection.enabled ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => renderTableRow(item, index))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.enabled && processedData.length > 0 && (
        <Pagination
          currentPage={paginationState.currentPage}
          totalPages={paginationState.totalPages}
          totalItems={processedData.length}
          itemsPerPage={paginationState.itemsPerPage}
          onPageChange={paginationState.setPage}
          onItemsPerPageChange={paginationState.setItemsPerPage}
          itemsPerPageOptions={pagination.pageSizeOptions}
        />
      )}
    </div>
  );
}
