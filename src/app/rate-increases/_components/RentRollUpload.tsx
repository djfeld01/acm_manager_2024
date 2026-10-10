"use client";
import { useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseRentRoll, type ParsedRentRoll } from "../_lib/parseRentRoll";
import { saveRentRollSnapshot } from "../actions/saveRentRollSnapshot";

interface Props {
  sitelinkId: string;
  facilityName: string;
}

export function RentRollUpload({ sitelinkId, facilityName }: Props) {
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState<ParsedRentRoll | null>(null);
  const [fileName, setFileName] = useState("");
  const [snapshotDate, setSnapshotDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    setParsed(null);
    try {
      if (/\.xlsx?$/i.test(file.name)) {
        throw new Error("Please upload the .txt version of the rent roll (same data; the Excel copy isn't supported).");
      }
      const result = await parseRentRoll(file, sitelinkId);
      if (!result.rows.length) {
        throw new Error(
          `No units for ${facilityName} (SiteID ${sitelinkId}) found in this file. Sites in file: ${Object.keys(result.siteCounts).join(", ") || "none"}.`
        );
      }
      setParsed(result);
      setFileName(file.name);
      setSnapshotDate(result.suggestedSnapshotDate ?? new Date().toISOString().slice(0, 10));
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not read file" });
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await saveRentRollSnapshot(sitelinkId, snapshotDate, parsed.rows);
      setMessage({
        kind: "ok",
        text: `Saved ${res.saved} units (${res.rented} rented) for ${res.snapshotDate}${
          res.replaced ? `, replacing ${res.replaced} existing rows for that date` : ""
        }.`,
      });
      setParsed(null);
      await queryClient.invalidateQueries({ queryKey: ["rateInc"] });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setBusy(false);
    }
  }

  const rented = parsed?.rows.filter((r) => r.isRented).length ?? 0;
  const siteCount = parsed ? Object.keys(parsed.siteCounts).length : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => document.getElementById("rentroll-upload")?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload rent roll (.txt)
        </Button>
        <input
          id="rentroll-upload"
          type="file"
          accept=".txt,.tsv,.csv"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <span className="text-xs text-muted-foreground">
          Tenant names and emails are stripped in your browser — only IDs and rents are sent.
        </span>
      </div>

      {parsed && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="text-sm">
              <span className="font-medium">{fileName}</span> — found {parsed.rows.length} units for{" "}
              {facilityName} ({rented} rented) among {siteCount} sites in the file; only {facilityName} is
              kept.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted-foreground" htmlFor="snapshot-date">
                Snapshot date
              </label>
              <Input
                id="snapshot-date"
                type="date"
                className="w-44"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
              />
              <Button onClick={handleSave} disabled={busy || !snapshotDate}>
                Save snapshot
              </Button>
              <Button variant="ghost" onClick={() => setParsed(null)} disabled={busy}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Saving the same date again replaces that day&apos;s snapshot.
            </p>
          </CardContent>
        </Card>
      )}

      {message && (
        <div
          className={`text-sm flex items-start gap-2 ${
            message.kind === "ok" ? "text-green-700 dark:text-green-400" : "text-destructive"
          }`}
        >
          {message.kind === "ok" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
