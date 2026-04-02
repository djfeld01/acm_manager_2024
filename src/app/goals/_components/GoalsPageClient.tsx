"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getFacilitiesWithGoals, upsertGoals, FacilityGoalRow } from "../actions";

type Facility = {
  sitelinkId: string;
  facilityAbbreviation: string;
  facilityName: string;
};

type CsvRow = {
  sitelinkId: string;
  facilityAbbreviation: string;
  facilityName: string;
  rentalGoal: number;
  retailGoal: number;
  collectionsGoal: number;
  isUpdate: boolean;
};

type GoalsPageClientProps = {
  facilities: Facility[];
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export function GoalsPageClient({ facilities }: GoalsPageClientProps) {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [goalsData, setGoalsData] = useState<FacilityGoalRow[]>([]);
  const [isPending, startTransition] = useTransition();

  // CSV state
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual form state
  const [manualFacility, setManualFacility] = useState(facilities[0]?.sitelinkId ?? "");
  const [manualRental, setManualRental] = useState("");
  const [manualRetail, setManualRetail] = useState("");
  const [manualCollections, setManualCollections] = useState("");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function loadGoals(year: number, month: number) {
    startTransition(async () => {
      const data = await getFacilitiesWithGoals(year, month);
      setGoalsData(data);
    });
  }

  useEffect(() => {
    loadGoals(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Build lookup maps from goalsData
  const goalsByAbbrev = Object.fromEntries(
    goalsData.map((r) => [r.facilityAbbreviation.toUpperCase(), r])
  );
  const goalsBySitelinkId = Object.fromEntries(
    goalsData.map((r) => [r.sitelinkId, r])
  );
  const facilityByAbbrev = Object.fromEntries(
    facilities.map((f) => [f.facilityAbbreviation.toUpperCase(), f])
  );

  function parseCsv(text: string) {
    setCsvError(null);
    setCsvRows([]);
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setCsvError("File must have a header row and at least one data row.");
      return;
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const abbrevIdx = header.indexOf("abbreviation");
    const sitelinkIdx = header.indexOf("sitelinkid");
    const rentalIdx = header.indexOf("rentalgoal");
    const retailIdx = header.indexOf("retailgoal");
    const collectionsIdx = header.indexOf("collectionsgoal");

    if (rentalIdx === -1 || retailIdx === -1 || collectionsIdx === -1) {
      setCsvError(
        "Missing required columns. Expected: rentalGoal, retailGoal, collectionsGoal"
      );
      return;
    }
    if (abbrevIdx === -1 && sitelinkIdx === -1) {
      setCsvError(
        "Missing facility identifier column. Expected: abbreviation or sitelinkId"
      );
      return;
    }

    const rows: CsvRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.every((c) => c === "")) continue;

      const rental = parseFloat(cols[rentalIdx]);
      const retail = parseFloat(cols[retailIdx]);
      const collections = parseFloat(cols[collectionsIdx]);

      if (isNaN(rental) || isNaN(retail) || isNaN(collections)) {
        errors.push(`Row ${i + 1}: invalid numeric values`);
        continue;
      }

      let facility: Facility | undefined;
      let existing: FacilityGoalRow | undefined;

      if (abbrevIdx !== -1) {
        const abbrev = cols[abbrevIdx].toUpperCase();
        facility = facilityByAbbrev[abbrev];
        existing = goalsByAbbrev[abbrev];
      } else {
        const sitelinkId = cols[sitelinkIdx];
        facility = facilities.find((f) => f.sitelinkId === sitelinkId);
        existing = goalsBySitelinkId[sitelinkId];
      }

      if (!facility) {
        errors.push(
          `Row ${i + 1}: facility not found for "${abbrevIdx !== -1 ? cols[abbrevIdx] : cols[sitelinkIdx]}"`
        );
        continue;
      }

      rows.push({
        sitelinkId: facility.sitelinkId,
        facilityAbbreviation: facility.facilityAbbreviation,
        facilityName: facility.facilityName,
        rentalGoal: rental,
        retailGoal: retail,
        collectionsGoal: collections,
        isUpdate: existing != null && (
          existing.rentalGoal != null ||
          existing.retailGoal != null ||
          existing.collectionsGoal != null
        ),
      });
    }

    if (errors.length > 0) {
      setCsvError(errors.join("\n"));
    }
    if (rows.length > 0) {
      setCsvRows(rows);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => parseCsv(ev.target?.result as string);
    reader.readAsText(file);
  }

  function handleCsvUpload() {
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    const goals = csvRows.map((row) => ({
      sitelinkId: row.sitelinkId,
      month: monthStr,
      rentalGoal: row.rentalGoal,
      retailGoal: row.retailGoal,
      collectionsGoal: row.collectionsGoal,
    }));

    startTransition(async () => {
      const result = await upsertGoals(goals);
      setStatusMessage(
        `Saved ${result.count} goal${result.count !== 1 ? "s" : ""} for ${MONTHS[selectedMonth - 1]} ${selectedYear}.`
      );
      setCsvRows([]);
      setCsvFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadGoals(selectedYear, selectedMonth);
    });
  }

  function handleManualSubmit() {
    const rental = parseFloat(manualRental);
    const retail = parseFloat(manualRetail);
    const collections = parseFloat(manualCollections);

    if (isNaN(rental) || isNaN(retail) || isNaN(collections)) {
      setStatusMessage("Please enter valid numbers for all goal fields.");
      return;
    }

    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    startTransition(async () => {
      await upsertGoals([
        {
          sitelinkId: manualFacility,
          month: monthStr,
          rentalGoal: rental,
          retailGoal: retail,
          collectionsGoal: collections,
        },
      ]);
      setStatusMessage("Goal saved.");
      setManualRental("");
      setManualRetail("");
      setManualCollections("");
      loadGoals(selectedYear, selectedMonth);
    });
  }

  const hasConflicts = csvRows.some((r) => r.isUpdate);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Monthly Goals</h1>
        <div className="flex gap-2 ml-auto">
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current goals table */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Current Goals — {MONTHS[selectedMonth - 1]} {selectedYear}
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility</TableHead>
              <TableHead className="text-right">Rental</TableHead>
              <TableHead className="text-right">Retail ($)</TableHead>
              <TableHead className="text-right">Collections ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : goalsData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No facilities found.
                </TableCell>
              </TableRow>
            ) : (
              goalsData.map((row) => (
                <TableRow key={row.sitelinkId}>
                  <TableCell>
                    <span className="font-medium">{row.facilityAbbreviation}</span>{" "}
                    <span className="text-muted-foreground text-sm">{row.facilityName}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.rentalGoal ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.retailGoal != null
                      ? `$${row.retailGoal.toLocaleString()}`
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.collectionsGoal != null
                      ? `$${row.collectionsGoal.toLocaleString()}`
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Input tabs */}
      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">Upload CSV</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        {/* CSV tab */}
        <TabsContent value="csv" className="space-y-4">
          <div className="text-sm text-muted-foreground">
            CSV format:{" "}
            <code className="bg-muted px-1 rounded">
              abbreviation,rentalGoal,retailGoal,collectionsGoal
            </code>
          </div>
          <Input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="max-w-sm"
          />
          {csvError && (
            <pre className="text-sm text-destructive whitespace-pre-wrap">{csvError}</pre>
          )}

          {csvRows.length > 0 && (
            <div className="space-y-3">
              {hasConflicts && (
                <p className="text-sm text-amber-600 font-medium">
                  Rows marked <Badge variant="outline" className="border-amber-500 text-amber-600">Update</Badge> will overwrite existing goals.
                </p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead className="text-right">Rental</TableHead>
                    <TableHead className="text-right">Retail ($)</TableHead>
                    <TableHead className="text-right">Collections ($)</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvRows.map((row) => (
                    <TableRow
                      key={row.sitelinkId}
                      className={row.isUpdate ? "bg-amber-50" : "bg-green-50"}
                    >
                      <TableCell>
                        <span className="font-medium">{row.facilityAbbreviation}</span>{" "}
                        <span className="text-muted-foreground text-sm">{row.facilityName}</span>
                      </TableCell>
                      <TableCell className="text-right">{row.rentalGoal}</TableCell>
                      <TableCell className="text-right">${row.retailGoal.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${row.collectionsGoal.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.isUpdate
                              ? "border-amber-500 text-amber-600"
                              : "border-green-500 text-green-600"
                          }
                        >
                          {row.isUpdate ? "Update" : "New"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button onClick={handleCsvUpload} disabled={isPending}>
                {hasConflicts ? "Confirm Upload (overwrites existing)" : "Upload"}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Manual entry tab */}
        <TabsContent value="manual" className="space-y-4 max-w-sm">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Facility</label>
              <Select value={manualFacility} onValueChange={setManualFacility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => (
                    <SelectItem key={f.sitelinkId} value={f.sitelinkId}>
                      {f.facilityAbbreviation} — {f.facilityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Rental Goal</label>
              <Input
                type="number"
                placeholder="e.g. 25"
                value={manualRental}
                onChange={(e) => setManualRental(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Retail Goal ($)</label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={manualRetail}
                onChange={(e) => setManualRetail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Collections Goal ($)</label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={manualCollections}
                onChange={(e) => setManualCollections(e.target.value)}
              />
            </div>
            <Button onClick={handleManualSubmit} disabled={isPending}>
              Save Goal
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {statusMessage && (
        <p className="text-sm text-green-600 font-medium">{statusMessage}</p>
      )}
    </div>
  );
}
