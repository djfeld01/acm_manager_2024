"use client";
import { useState, type ChangeEvent } from "react";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Copy, Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PayPeriod } from "@/db/schema/payPeriod";
import { parseTimecardCsv } from "@/lib/parseTimecardCsv";
import {
  reconcileTimecard,
  type ReconcileResult,
  type ReconcileCategoryResult,
} from "../../actions/reconcileTimecard";

function parseAsLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("T")[0].split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

interface Props {
  payPeriods: PayPeriod[];
}

const EXPORT_HEADER = [
  "Last Name",
  "First Name",
  "Full Name",
  "Employee Number",
  "Rate",
  "Dept",
  "Regular Hours",
  "OT Hours",
  "Holiday Hours",
  "Vacation Hours",
  "Sick Hours",
  "Christmas Bonus",
  "Monthly Incentive",
  "Storage Commission",
  "Mileage",
];

function CategoryBadge({ result }: { result: ReconcileCategoryResult }) {
  if (result.status === "none") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }
  if (result.status === "match") {
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3" />
        {result.appValue}
      </Badge>
    );
  }
  const label =
    result.status === "app-only"
      ? `App ${result.appValue} / Paycor —`
      : result.status === "csv-only"
      ? `App — / Paycor ${result.csvValue}`
      : `App ${result.appValue} / Paycor ${result.csvValue}`;
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function TimecardReconcileClient({ payPeriods }: Props) {
  const [selectedPayPeriodId, setSelectedPayPeriodId] = useState(
    payPeriods[0]?.payPeriodId ?? ""
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedPayPeriodId) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const parsed = await parseTimecardCsv(file);
      const reconciled = await reconcileTimecard(
        selectedPayPeriodId,
        parsed.employees,
        parsed.allDates
      );
      setResult(reconciled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  }

  function buildExportRows(): (string | number)[][] {
    if (!result) return [];
    // Round to 2 decimals — summed floats otherwise carry binary rounding
    // noise (e.g. 63.50000999999999) into the spreadsheet.
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const rows = result.employees.map((emp) => [
      emp.lastName,
      emp.firstName,
      `${emp.lastName}, ${emp.firstName}`,
      emp.employeeNumber,
      emp.hourlyRate != null ? r2(emp.hourlyRate) : "",
      emp.departmentName,
      r2(emp.regularHours),
      r2(emp.otHours),
      r2(emp.holidayHoursExport),
      r2(emp.vacationHoursExport),
      "",
      r2(emp.christmasBonusExport),
      r2(emp.monthlyIncentiveExport),
      r2(emp.commissionExport),
      r2(emp.mileageExport),
    ]);
    return [EXPORT_HEADER, ...rows];
  }

  function downloadCsv() {
    const rows = buildExportRows();
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-export-${selectedPayPeriodId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard() {
    const rows = buildExportRows();
    const tsv = rows.map((r) => r.join("\t")).join("\n");
    await navigator.clipboard.writeText(tsv);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedPayPeriodId} onValueChange={setSelectedPayPeriodId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a pay period…" />
          </SelectTrigger>
          <SelectContent>
            {payPeriods.map((p) => (
              <SelectItem key={p.payPeriodId} value={p.payPeriodId}>
                {format(parseAsLocalDate(p.startDate), "MM/dd/yyyy")} -{" "}
                {p.endDate ? format(parseAsLocalDate(p.endDate), "MM/dd/yyyy") : "?"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isProcessing ? (
          <Button disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing…
          </Button>
        ) : (
          <>
            <Button
              onClick={() => document.getElementById("timecard-upload")?.click()}
              disabled={!selectedPayPeriodId}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Timecard CSV
            </Button>
            <input
              type="file"
              accept=".csv"
              id="timecard-upload"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {result && (
        <>
          {result.outOfRangeDates.length > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">
                      {result.outOfRangeDates.length} punch date
                      {result.outOfRangeDates.length !== 1 ? "s" : ""} outside this pay
                      period&apos;s range:
                    </span>{" "}
                    {result.outOfRangeDates.join(", ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result.linkedEmployeeIds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Linked {result.linkedEmployeeIds.length} employee
              {result.linkedEmployeeIds.length !== 1 ? "s" : ""} to their Paycor number for
              future uploads.
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Reconciliation — {result.payPeriodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Reg / OT Hrs</TableHead>
                    <TableHead>Vacation</TableHead>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Bonus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.employees.map((emp, i) => (
                    <TableRow
                      key={`${emp.employeeId ?? emp.employeeNumber}-${i}`}
                      className={
                        emp.missingFromCsv
                          ? "bg-destructive/5"
                          : emp.matchedBy === "unmatched"
                          ? "bg-amber-500/5"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {emp.lastName}, {emp.firstName}
                        {emp.matchedBy === "unmatched" && (
                          <div className="text-xs text-amber-600 dark:text-amber-400">
                            No match in app
                          </div>
                        )}
                        {emp.missingFromCsv && (
                          <div className="text-xs text-destructive">
                            Not found anywhere in this upload
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {emp.regularHours || emp.otHours
                          ? `${emp.regularHours.toFixed(2)} / ${emp.otHours.toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <CategoryBadge result={emp.vacation} />
                      </TableCell>
                      <TableCell>
                        <CategoryBadge result={emp.holiday} />
                      </TableCell>
                      <TableCell>
                        <CategoryBadge result={emp.commission} />
                      </TableCell>
                      <TableCell>
                        <CategoryBadge result={emp.mileage} />
                      </TableCell>
                      <TableCell>
                        <CategoryBadge result={emp.bonus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={downloadCsv} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
