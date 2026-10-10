"use client";
import { useState, type ChangeEvent } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildTenantRateExport,
  LINE_STATUS_LABEL,
  type ExportLine,
  type ExportResult,
} from "../_lib/exportTenantRates";

interface Props {
  batchName: string;
  effectiveDate: string;
  lines: ExportLine[];
}

export function BatchExportPanel({ batchName, effectiveDate, lines }: Props) {
  const [busy, setBusy] = useState(false);
  const [onlyBatchRows, setOnlyBatchRows] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function build(f: File, only: boolean) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await buildTenantRateExport(await f.arrayBuffer(), lines, { effectiveDate, onlyBatchRows: only }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file");
    } finally {
      setBusy(false);
    }
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFile(f);
    await build(f, onlyBatchRows);
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.data as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TenantRateImport_${batchName.replace(/[^\w-]+/g, "_")}_${effectiveDate}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const problems = result?.lines.filter((l) => l.status !== "written") ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export for SiteLink</CardTitle>
        <CardDescription>
          Download a fresh <em>Tenant Rate Management</em> export from SiteLink and upload it here. We fill in the
          Scheduled Rate and Scheduled Date columns for this batch ({lines.length} tenants, effective {effectiveDate}) and
          hand the file back. It&apos;s done in your browser, so tenant names in the file never reach our server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => document.getElementById("rate-export-upload")?.click()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {file ? "Choose a different export" : "Upload SiteLink export (.xlsx)"}
          </Button>
          <input id="rate-export-upload" type="file" accept=".xlsx" style={{ display: "none" }} onChange={onPick} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyBatchRows}
              onChange={(e) => {
                setOnlyBatchRows(e.target.checked);
                if (file) void build(file, e.target.checked);
              }}
            />
            Only include this batch&apos;s tenants (smaller file)
          </label>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3 text-sm">
            <div className={`flex items-start gap-2 ${result.written === lines.length ? "text-green-700 dark:text-green-400" : ""}`}>
              {result.written === lines.length ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span>
                {result.written} of {lines.length} tenants added to the file ({result.outputRows} rows in the download, from{" "}
                {result.fileRows} in your export).
              </span>
            </div>
            {problems.length > 0 && (
              <div className="rounded-md border p-3">
                <div className="mb-1 font-medium">Not added ({problems.length})</div>
                <ul className="space-y-0.5">
                  {problems.map((p) => (
                    <li key={p.line.ledgerId}>
                      Unit {p.line.unitName}: {LINE_STATUS_LABEL[p.status]}
                      {p.detail ? ` (${p.detail})` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Usually this means the export is older than the rent roll the batch was built from. Upload a fresh
                  export, or rebuild the batch from a fresh rent roll.
                </p>
              </div>
            )}
            <Button onClick={download} disabled={result.written === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download file for SiteLink
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
