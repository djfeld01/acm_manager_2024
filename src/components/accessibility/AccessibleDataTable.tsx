"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createAriaTableProps,
  generateAriaId,
  getAriaLabel,
} from "@/lib/accessibility/aria-utils";
import { useKeyboardNavigation } from "@/lib/accessibility/keyboard-navigation";
import {
  ScreenReaderOnly,
  StatusAnnouncement,
} from "@/lib/accessibility/screen-reader";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface AccessibleTableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: "left" | "center" | "right";
  ariaLabel?: string;
}

export interface AccessibleTableProps<T = any> {
  data: T[];
  columns: AccessibleTableColumn<T>[];
  caption?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnId: string, direction: "asc" | "desc") => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowSelection?: {
    selectedRows: Set<string>;
    onRowSelect: (rowId: string, selected: boolean) => void;
    onSelectAll: (selected: boolean) => void;
    getRowId: (row: T) => string;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export function AccessibleDataTable<T = any>({
  data,
  columns,
  caption,
  sortBy,
  sortDirection,
  onSort,
  loading = false,
  emptyMessage = "No data available",
  className,
  rowSelection,
  pagination,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: AccessibleTableProps<T>) {
  const tableId = React.useMemo(() => generateAriaId("table"), []);
  const captionId = React.useMemo(() => generateAriaId("caption"), []);
  const [announcement, setAnnouncement] = React.useState<string>("");

  const { containerRef } = useKeyboardNavigation<HTMLTableElement>({
    isOpen: true,
    itemSelector:
      'button[role="columnheader"], button[data-row-select], a, button',
    orientation: "vertical",
  });

  const handleSort = (columnId: string) => {
    if (!onSort) return;

    const newDirection =
      sortBy === columnId && sortDirection === "asc" ? "desc" : "asc";

    onSort(columnId, newDirection);

    const column = columns.find((col) => col.id === columnId);
    setAnnouncement(
      `Table sorted by ${
        column?.header || columnId
      } in ${newDirection}ending order`
    );
  };

  const handleRowSelect = (rowId: string, selected: boolean) => {
    if (!rowSelection) return;

    rowSelection.onRowSelect(rowId, selected);
    setAnnouncement(`Row ${selected ? "selected" : "deselected"}`);
  };

  const handleSelectAll = (selected: boolean) => {
    if (!rowSelection) return;

    rowSelection.onSelectAll(selected);
    setAnnouncement(
      `${selected ? "All rows selected" : "All rows deselected"}`
    );
  };

  const getSortIcon = (columnId: string) => {
    if (sortBy !== columnId) {
      return <ArrowUpDown className="h-4 w-4" aria-hidden="true" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    ) : (
      <ArrowDown className="h-4 w-4" aria-hidden="true" />
    );
  };

  const getSortAriaLabel = (column: AccessibleTableColumn<T>) => {
    const currentSort =
      sortBy === column.id ? `, currently sorted ${sortDirection}ending` : "";
    return `Sort by ${column.header}${currentSort}`;
  };

  const tableProps = createAriaTableProps({
    rowCount: data.length + 1, // +1 for header
    columnCount: columns.length + (rowSelection ? 1 : 0),
    label: ariaLabel || getAriaLabel("DATA_TABLE"),
    description: ariaDescribedBy,
  });

  return (
    <div className={cn("w-full", className)}>
      {/* Screen reader announcements */}
      <StatusAnnouncement message={announcement} />

      {/* Table container */}
      <div className="relative overflow-auto">
        <Table
          ref={containerRef}
          id={tableId}
          {...tableProps}
          className="w-full"
        >
          {caption && (
            <caption id={captionId} className="sr-only">
              {caption}
            </caption>
          )}

          <TableHeader>
            <TableRow role="row">
              {/* Row selection header */}
              {rowSelection && (
                <TableHead className="w-12" role="columnheader">
                  <input
                    type="checkbox"
                    checked={
                      rowSelection.selectedRows.size === data.length &&
                      data.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all rows"
                    className="rounded border-gray-300 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                </TableHead>
              )}

              {/* Column headers */}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  role="columnheader"
                  className={cn(
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                  style={{ width: column.width }}
                >
                  {column.sortable && onSort ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort(column.id)}
                      aria-label={getSortAriaLabel(column)}
                      aria-sort={
                        sortBy === column.id
                          ? sortDirection === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <span className="flex items-center gap-2">
                        {column.header}
                        {getSortIcon(column.id)}
                      </span>
                    </Button>
                  ) : (
                    <span className="font-semibold">{column.header}</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow role="row">
                <TableCell
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className="text-center py-8"
                  role="cell"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    <span>Loading data...</span>
                  </div>
                  <ScreenReaderOnly>Loading table data</ScreenReaderOnly>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow role="row">
                <TableCell
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                  role="cell"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = rowSelection?.getRowId(row) || String(rowIndex);
                const isSelected =
                  rowSelection?.selectedRows.has(rowId) || false;

                return (
                  <TableRow
                    key={rowId}
                    role="row"
                    className={cn(
                      isSelected && "bg-muted/50",
                      "hover:bg-muted/30"
                    )}
                    aria-selected={rowSelection ? isSelected : undefined}
                  >
                    {/* Row selection cell */}
                    {rowSelection && (
                      <TableCell role="cell" className="w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            handleRowSelect(rowId, e.target.checked)
                          }
                          aria-label={`Select row ${rowIndex + 1}`}
                          data-row-select
                          className="rounded border-gray-300 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        />
                      </TableCell>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        role="cell"
                        className={cn(
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.cell
                          ? column.cell(row)
                          : column.accessorKey
                          ? String(row[column.accessorKey] || "")
                          : ""}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <AccessiblePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}

interface AccessiblePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
}

function AccessiblePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: AccessiblePaginationProps) {
  const [announcement, setAnnouncement] = React.useState<string>("");

  const handlePageChange = (page: number) => {
    onPageChange(page);
    setAnnouncement(`Navigated to page ${page} of ${totalPages}`);
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={cn("flex items-center justify-between px-2 py-4", className)}
    >
      <StatusAnnouncement message={announcement} />

      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      {/* Pagination controls */}
      <nav aria-label={getAriaLabel("TABLE_PAGINATION")} role="navigation">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            <ScreenReaderOnly>First page</ScreenReaderOnly>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <ScreenReaderOnly>Previous page</ScreenReaderOnly>
          </Button>

          <span className="text-sm font-medium px-2" aria-current="page">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <ScreenReaderOnly>Next page</ScreenReaderOnly>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            <ScreenReaderOnly>Last page</ScreenReaderOnly>
          </Button>
        </div>
      </nav>
    </div>
  );
}
