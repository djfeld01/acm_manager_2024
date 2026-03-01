"use client";
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAvailableMonths,
  getManagementFeesData,
  type FacilityFeeRow,
} from "@/lib/controllers/managementFeesController";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function formatMonth(lastDay: string): string {
  // lastDay is a date string like "2026-02-28"
  const [year, month] = lastDay.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function fmt(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function net(row: FacilityFeeRow): number | null {
  if (row.total === null) return null;
  return row.total - (row.salesTax ?? 0);
}

function buildCsv(rows: FacilityFeeRow[], month: string): string {
  const header = ["Location", "Total", "Sales Tax", "Net (Total - Tax)"];
  const lines = rows.map((r) => [
    r.facilityName,
    r.total?.toFixed(2) ?? "",
    r.salesTax?.toFixed(2) ?? "",
    (net(r) ?? 0).toFixed(2),
  ]);

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + (r.total ?? 0),
      salesTax: acc.salesTax + (r.salesTax ?? 0),
    }),
    { total: 0, salesTax: 0 }
  );
  lines.push([
    "TOTAL",
    totals.total.toFixed(2),
    totals.salesTax.toFixed(2),
    (totals.total - totals.salesTax).toFixed(2),
  ]);

  return [header, ...lines].map((row) => row.join(",")).join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ManagementFeesClient() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const { data: months = [] } = useQuery({
    queryKey: ["managementFeeMonths"],
    queryFn: getAvailableMonths,
  });

  // Default to most recent month once loaded
  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0].lastDay);
    }
  }, [months, selectedMonth]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["managementFees", selectedMonth],
    queryFn: () => getManagementFeesData(selectedMonth),
    enabled: !!selectedMonth,
  });

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + (r.total ?? 0),
      salesTax: acc.salesTax + (r.salesTax ?? 0),
    }),
    { total: 0, salesTax: 0 }
  );

  function handleExport() {
    if (!rows.length || !selectedMonth) return;
    const monthLabel = formatMonth(selectedMonth).replace(" ", "-");
    const csv = buildCsv(rows, selectedMonth);
    downloadCsv(csv, `management-fees-${monthLabel}.csv`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select month…" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.lastDay} value={m.lastDay}>
                {formatMonth(m.lastDay)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!rows.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Sales Tax</TableHead>
              <TableHead className="text-right">Net (Total − Tax)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data for selected month.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.sitelinkId}>
                  <TableCell className="font-medium">
                    {row.facilityName}
                  </TableCell>
                  <TableCell className="text-right">{fmt(row.total)}</TableCell>
                  <TableCell className="text-right">
                    {fmt(row.salesTax)}
                  </TableCell>
                  <TableCell className="text-right">{fmt(net(row))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(totals.total)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(totals.salesTax)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {fmt(totals.total - totals.salesTax)}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
