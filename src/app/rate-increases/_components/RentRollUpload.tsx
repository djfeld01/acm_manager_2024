"use client";
import { useMemo, useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseRentRoll, type ParsedRentRoll, type RentRollRow } from "../_lib/parseRentRoll";
import { saveRentRollSnapshot } from "../actions/saveRentRollSnapshot";

interface Props {
  sitelinkId: string;
  facilityName: string;
  /** Every store the tools are on for; a rent roll with several of them saves each one. */
  facilities: { id: string; name: string }[];
}

interface SiteResult {
  name: string;
  status: "saved" | "error";
  text: string;
}

export function RentRollUpload({ sitelinkId, facilityName, facilities }: Props) {
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState<ParsedRentRoll | null>(null);
  const [fileName, setFileName] = useState("");
  const [snapshotDate, setSnapshotDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [results, setResults] = useState<SiteResult[]>([]);

  const nameOf = useMemo(() => new Map(facilities.map((f) => [f.id, f.name])), [facilities]);

  // The file's stores we can save, in the store list's order, with the current store first.
  const sites = useMemo(() => {
    if (!parsed) return [];
    const bySite = new Map<string, RentRollRow[]>();
    for (const r of parsed.rows) {
      if (!bySite.has(r.sitelinkId)) bySite.set(r.sitelinkId, []);
      bySite.get(r.sitelinkId)!.push(r);
    }
    return facilities
      .filter((f) => bySite.has(f.id))
      .sort((a, b) => (a.id === sitelinkId ? -1 : b.id === sitelinkId ? 1 : 0))
      .map((f) => ({ id: f.id, name: f.name, rows: bySite.get(f.id)! }));
  }, [parsed, facilities, sitelinkId]);

  // Sites in the file with units that aren't stores we track (former clients, unknown IDs).
  const skipped = useMemo(
    () => (parsed ? [...new Set(parsed.rows.map((r) => r.sitelinkId))].filter((id) => !nameOf.has(id)) : []),
    [parsed, nameOf]
  );

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    setResults([]);
    setParsed(null);
    try {
      if (/\.xlsx?$/i.test(file.name)) {
        throw new Error("Please upload the .txt version of the rent roll (same data; the Excel copy isn't supported).");
      }
      const result = await parseRentRoll(file);
      if (!result.rows.some((r) => nameOf.has(r.sitelinkId))) {
        throw new Error(
          `None of our stores were found in this file. SiteIDs in file: ${Object.keys(result.siteCounts).join(", ") || "none"}.`
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
    const out: SiteResult[] = [];
    // One store per request: each is its own snapshot, and one failure doesn't stop the rest.
    for (const [i, site] of sites.entries()) {
      setProgress(`Saving ${site.name} (${i + 1} of ${sites.length})…`);
      try {
        const res = await saveRentRollSnapshot(site.id, snapshotDate, site.rows);
        out.push({
          name: site.name,
          status: "saved",
          text: `${res.saved} units (${res.rented} rented)${res.replaced ? `, replaced that day's earlier upload` : ""}`,
        });
      } catch (err) {
        out.push({ name: site.name, status: "error", text: err instanceof Error ? err.message : "Save failed" });
      }
    }
    setProgress(null);
    setResults(out);
    const failed = out.filter((r) => r.status === "error").length;
    setMessage(
      failed
        ? { kind: "error", text: `Saved ${out.length - failed} of ${out.length} stores for ${snapshotDate}; ${failed} failed (see below).` }
        : { kind: "ok", text: `Saved the ${snapshotDate} rent roll for ${out.length} store${out.length === 1 ? "" : "s"}.` }
    );
    setParsed(null);
    await queryClient.invalidateQueries({ queryKey: ["rateInc"] });
    setBusy(false);
  }

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
          A rent roll for all stores saves every store at once. Tenant names and emails are stripped in your browser
          — only IDs and rents are sent.
        </span>
      </div>

      {parsed && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="text-sm">
              <span className="font-medium">{fileName}</span> — {sites.length} store{sites.length === 1 ? "" : "s"} found
              {sites.some((s) => s.id === sitelinkId) ? "" : ` (${facilityName} is not in this file)`}:
            </div>
            <div className="grid gap-x-6 gap-y-0.5 text-sm sm:grid-cols-2">
              {sites.map((s) => (
                <div key={s.id} className="flex justify-between gap-3">
                  <span className={s.id === sitelinkId ? "font-medium" : ""}>{s.name}</span>
                  <span className="text-muted-foreground">
                    {s.rows.length} units · {s.rows.filter((r) => r.isRented).length} rented
                  </span>
                </div>
              ))}
            </div>
            {skipped.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Skipped SiteIDs that aren&apos;t current stores: {skipped.join(", ")}.
              </p>
            )}
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
              <Button onClick={handleSave} disabled={busy || !snapshotDate || !sites.length}>
                {sites.length > 1 ? `Save all ${sites.length} stores` : "Save snapshot"}
              </Button>
              <Button variant="ghost" onClick={() => setParsed(null)} disabled={busy}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Saving the same date again replaces that day&apos;s snapshot for each store.
            </p>
          </CardContent>
        </Card>
      )}

      {progress && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {progress}
        </div>
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

      {results.length > 1 && (
        <ul className="grid gap-x-6 gap-y-0.5 text-xs sm:grid-cols-2">
          {results.map((r) => (
            <li key={r.name} className={r.status === "error" ? "text-destructive" : "text-muted-foreground"}>
              {r.status === "error" ? "✕" : "✓"} {r.name}: {r.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
