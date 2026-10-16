"use client";
import { useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  decodeReport,
  parseReport,
  reportDateFromFilename,
  type OccupancyRow,
  type ParsedReport,
  type WaveMonthRow,
} from "../_lib/reports";
import { saveIncreaseReport } from "../actions/pastIncreases";

type Parsed = ParsedReport<WaveMonthRow> | ParsedReport<OccupancyRow>;

interface Item {
  id: number;
  fileName: string;
  text: string;
  reportDate: string;
  parsed: Parsed | null;
  error: string | null;
}

const KIND_LABEL = { tracking: "Tenant Increase Tracking", history: "Rate Management History" } as const;
const monthLabel = (iso: string) => iso.slice(0, 7);

let nextId = 1;

export function ReportImport() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ ok: boolean; text: string }[]>([]);

  function tryParse(text: string, reportDate: string): { parsed: Parsed | null; error: string | null } {
    try {
      return { parsed: parseReport(text, reportDate), error: null };
    } catch (err) {
      return { parsed: null, error: err instanceof Error ? err.message : "Could not read this file" };
    }
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setMessages([]);
    const added: Item[] = [];
    for (const f of files) {
      if (/\.xlsx?$/i.test(f.name)) {
        added.push({ id: nextId++, fileName: f.name, text: "", reportDate: "", parsed: null, error: "Upload the .txt version of the report (same data)." });
        continue;
      }
      const text = decodeReport(await f.arrayBuffer());
      const reportDate = reportDateFromFilename(f.name) ?? new Date().toISOString().slice(0, 10);
      added.push({ id: nextId++, fileName: f.name, text, reportDate, ...tryParse(text, reportDate) });
    }
    setItems((cur) => [...cur, ...added]);
  }

  function setDate(id: number, reportDate: string) {
    setItems((cur) => cur.map((it) => (it.id === id && it.text ? { ...it, reportDate, ...tryParse(it.text, reportDate) } : it)));
  }

  async function save() {
    const ready = items.filter((it) => it.parsed);
    if (!ready.length) return;
    setBusy(true);
    const out: { ok: boolean; text: string }[] = [];
    for (const it of ready) {
      const p = it.parsed!;
      try {
        const res = await saveIncreaseReport({
          kind: p.kind,
          reportDate: p.reportDate,
          sites: p.sites.map((s) => ({ sitelinkId: s.sitelinkId, rows: s.rows as (WaveMonthRow | OccupancyRow)[] })),
        });
        for (const s of res.sites) {
          out.push({
            ok: true,
            text: `${KIND_LABEL[p.kind]} for ${s.name}: ${s.kept} rows saved${s.skipped ? `, ${s.skipped} left alone because newer data was already stored` : ""}.`,
          });
        }
        setItems((cur) => cur.filter((x) => x.id !== it.id));
      } catch (err) {
        out.push({ ok: false, text: `${it.fileName}: ${err instanceof Error ? err.message : "Save failed"}` });
      }
    }
    setMessages(out);
    setBusy(false);
    await queryClient.invalidateQueries({ queryKey: ["rateInc", "past"] });
    await queryClient.invalidateQueries({ queryKey: ["rateInc", "waveEvidence"] });
  }

  const ready = items.filter((it) => it.parsed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import SiteLink reports</CardTitle>
        <CardDescription>
          Upload <strong>Tenant Increase Tracking</strong> and <strong>Rate Management History</strong> (the .txt versions) for
          any facility, as many months back as you can run them. They hold counts and dollars only — no tenant names. The
          more past increases we have, the better the expectation for the next one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => document.getElementById("report-upload")?.click()} disabled={busy}>
            <Upload className="mr-2 h-4 w-4" />
            Choose report files (.txt)
          </Button>
          <input id="report-upload" type="file" accept=".txt" multiple style={{ display: "none" }} onChange={onPick} />
        </div>

        {items.map((it) => (
          <div key={it.id} className="space-y-1 rounded-md border p-3 text-sm">
            <div className="font-medium">{it.fileName}</div>
            {it.error ? (
              <div className="flex items-start gap-2 text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {it.error}
              </div>
            ) : (
              it.parsed && (
                <>
                  <div>
                    {KIND_LABEL[it.parsed.kind]} ·{" "}
                    {it.parsed.sites
                      .map((s) => `SiteID ${s.sitelinkId}, ${monthLabel(s.months.at(-1) ?? s.months[0]!)} to ${monthLabel(s.months[0]!)} (${s.rows.length} rows)`)
                      .join("; ")}
                  </div>
                  <label className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    Date the report was run
                    <Input type="date" className="h-8 w-40" value={it.reportDate} onChange={(e) => e.target.value && setDate(it.id, e.target.value)} />
                    <span className="text-xs">
                      {it.parsed.kind === "history"
                        ? "Sets which month each column is — the first column is this date's month."
                        : "Newer reports replace older ones for the same month."}
                    </span>
                  </label>
                  {it.parsed.sites.flatMap((s) => s.warnings).map((w, i) => (
                    <div key={i} className="text-xs text-amber-700 dark:text-amber-400">
                      {w}
                    </div>
                  ))}
                </>
              )
            )}
          </div>
        ))}

        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={busy || ready === 0}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import {ready} report{ready === 1 ? "" : "s"}
            </Button>
            <Button variant="ghost" onClick={() => setItems([])} disabled={busy}>
              Clear
            </Button>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-2 text-sm ${m.ok ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
            {m.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            {m.text}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
