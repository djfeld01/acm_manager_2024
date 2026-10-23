"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BatchTenant } from "../_lib/batch";
import { FORMAT_LABEL, flagsIn, parseBatchWorkbook, planImport, type ImportPlan, type ImportSheet } from "../_lib/importBatch";
import { fmtMoney } from "./format";

interface Props {
  tenants: BatchTenant[];
  disabled: boolean;
  onApply: (sheet: ImportSheet, plan: ImportPlan) => void;
}

/**
 * Load a batch from an edited spreadsheet. The file is read in the browser;
 * only ledger IDs, rents and notes are kept, so tenant names never leave it.
 */
export function BatchImportPanel({ tenants, disabled, onApply }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<ImportSheet[]>([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [leaveOutFlagged, setLeaveOutFlagged] = useState(true);

  const sheet = sheets[sheetIdx] ?? null;
  const flags = useMemo(() => (sheet ? flagsIn(sheet) : []), [sheet]);
  const plan = useMemo(() => (sheet ? planImport(sheet, tenants, { leaveOutFlagged }) : null), [sheet, tenants, leaveOutFlagged]);
  const rentOf = useMemo(() => new Map(tenants.map((t) => [t.ledgerId, t.rent])), [tenants]);
  const gain = plan ? plan.include.reduce((a, i) => a + i.newRent - (rentOf.get(i.ledgerId) ?? 0), 0) : 0;

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setError(null);
    setSheets([]);
    try {
      const found = await parseBatchWorkbook(await f.arrayBuffer());
      if (!found.length) {
        throw new Error(
          "No batch found in that file. Use a SiteLink tenant rate export (with a ScheduledRate(EDIT) column) or the review spreadsheet downloaded from this page."
        );
      }
      setFileName(f.name);
      setSheets(found);
      setSheetIdx(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import from a spreadsheet</CardTitle>
        <CardDescription>
          Load a batch someone edited in Excel: a SiteLink tenant rate export with new rents in ScheduledRate(EDIT), or
          the review spreadsheet downloaded below. Tenants are matched to the current rent roll by ledger ID, and the
          file replaces the batch shown here. The file is read in your browser, so tenant names never reach our server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={busy || disabled} onClick={() => document.getElementById("batch-import-upload")?.click()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {sheets.length ? "Choose a different file" : "Upload spreadsheet (.xlsx)"}
          </Button>
          <input id="batch-import-upload" type="file" accept=".xlsx" style={{ display: "none" }} onChange={onPick} />
          {fileName && <span className="text-muted-foreground">{fileName}</span>}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {sheet && plan && (
          <div className="space-y-3">
            {sheets.length > 1 && (
              <div className="space-y-1">
                <div className="font-medium">Which sheet?</div>
                {sheets.map((s, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" checked={i === sheetIdx} onChange={() => setSheetIdx(i)} />
                    <span>{s.name}</span>
                    <span className="text-muted-foreground">
                      {s.rows.filter((r) => r.newRent !== null).length} proposed increases
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="text-muted-foreground">
              {FORMAT_LABEL[sheet.format]}
              {sheet.effectiveDate ? ` · effective ${sheet.effectiveDate}` : " · no effective date in the file (keeps the date set above)"}
            </div>

            {flags.length > 0 && (
              <div className="rounded-md border p-3">
                <div className="font-medium">
                  Notes on {flags.reduce((a, f) => a + f.count, 0)} rows:{" "}
                  {flags.map((f) => `"${f.flag}" (${f.count})`).join(", ")}
                </div>
                <label className="mt-2 flex items-center gap-2">
                  <input type="radio" checked={leaveOutFlagged} onChange={() => setLeaveOutFlagged(true)} />
                  Leave these tenants out of the batch
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={!leaveOutFlagged} onChange={() => setLeaveOutFlagged(false)} />
                  Include them at the rent in the file
                </label>
              </div>
            )}

            <ul className="space-y-0.5">
              <li>
                <span className="font-medium">{plan.include.length} tenants</span> in the batch, +{fmtMoney(gain)}/mo
              </li>
              {plan.held.length > 0 && <li>{plan.held.length} left out because of a note</li>}
              <li>{plan.notInFile} current tenants with no increase in the file</li>
              {plan.notAnIncrease.length > 0 && <li>{plan.notAnIncrease.length} rows skipped: new rent isn&apos;t above current rent</li>}
              {plan.notFound.length > 0 && <li>{plan.notFound.length} rows skipped: not a current tenant in the rent roll</li>}
              {plan.rentDiffers.length > 0 && (
                <li className="text-amber-700 dark:text-amber-400">
                  {plan.rentDiffers.length} tenants&apos; rent in the file differs from the rent roll (kept, using the file&apos;s new rent)
                </li>
              )}
            </ul>

            <Button disabled={disabled || plan.include.length === 0} onClick={() => onApply(sheet, plan)}>
              Load into the batch builder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
