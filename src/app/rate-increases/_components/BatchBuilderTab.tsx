"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ACROSS_THE_BOARD_RULES,
  LEGACY_RULES,
  REASON_LABEL,
  evaluateCandidates,
  firstOfMonthAtLeast,
  hasReopenChanges,
  reopenChanges,
  suggestRent,
  summarizeBatch,
  type BatchRules,
  type ExclusionReason,
  type ReopenChanges,
} from "../_lib/batch";
import { SCHEDULE } from "../_lib/config";
import { STAGE_LABEL, batchStage } from "../_lib/cohort";
import { getBatchData } from "../actions/getBatchData";
import { getWaveEvidence } from "../actions/pastIncreases";
import { deleteBatch, finalizeBatch, getBatch, listBatches, saveBatch, type BatchDetail } from "../actions/batches";
import type { Breakdown } from "./Breakdown";
import { withStreetRate, type StreetBasis } from "../_lib/street";
import { buildBatchSpreadsheet } from "../_lib/batchSpreadsheet";
import { BatchCandidatesTable, type Row } from "./BatchCandidatesTable";
import { BatchExportPanel } from "./BatchExportPanel";
import { BatchImportPanel } from "./BatchImportPanel";
import type { ImportPlan, ImportSheet } from "../_lib/importBatch";
import { BatchRulesForm } from "./BatchRulesForm";
import { BatchSummary } from "./BatchSummary";
import { fmtMoney } from "./format";
import { TabLoading } from "./Stat";

type Manual = Record<string, { include?: boolean; newRent?: number; note?: string }>;

export function BatchBuilderTab({
  sitelinkId,
  facilityName,
  by,
  street,
  onStreetChange,
}: {
  sitelinkId: string;
  facilityName: string;
  by: Breakdown;
  /** Which rate counts as street; set by the switch at the top of the page. */
  street: StreetBasis;
  onStreetChange: (basis: StreetBasis) => void;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const dataQ = useQuery({ queryKey: ["rateInc", "batchData", sitelinkId], queryFn: () => getBatchData(sitelinkId) });
  const listQ = useQuery({ queryKey: ["rateInc", "batches", sitelinkId], queryFn: () => listBatches(sitelinkId) });
  // Past increases, when reports have been imported; the what-if works without them.
  const evidenceQ = useQuery({ queryKey: ["rateInc", "waveEvidence"], queryFn: () => getWaveEvidence(), retry: false });

  const [ruleState, setRules] = useState<BatchRules>(() => ({
    ...ACROSS_THE_BOARD_RULES,
    streetBasis: street,
    effectiveDate: firstOfMonthAtLeast(today, SCHEDULE.noticeDays + 5),
  }));
  // The street-rate choice lives in the page switch, not the form; it is saved with the batch.
  const rules = useMemo<BatchRules>(() => ({ ...ruleState, streetBasis: street }), [ruleState, street]);
  const [manual, setManual] = useState<Manual>({});
  const [batchId, setBatchId] = useState<number | undefined>();
  const [loaded, setLoaded] = useState<BatchDetail | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  // What changed for a reopened draft's tenants since it was saved on an older rent roll.
  const [reopened, setReopened] = useState<{ from: string; to: string; changes: ReopenChanges } | null>(null);

  const locked = loaded?.status === "final";
  const data = dataQ.data;

  // Tenants with the chosen street rate in place, so every comparison to "street" follows the switch.
  const tenants = useMemo(() => (data ? withStreetRate(data.tenants, street) : []), [data, street]);
  const candidates = useMemo(() => evaluateCandidates(tenants, rules), [tenants, rules]);

  const rows: Row[] = useMemo(
    () =>
      candidates.map((c) => {
        const m = manual[c.tenant.ledgerId];
        const included = m?.include ?? c.reason === null;
        const newRent = m?.newRent ?? c.newRent ?? (included ? suggestRent(c.tenant, rules).newRent : null);
        return { c, included: included && newRent !== null, newRent, fileNote: m?.note ?? null };
      }),
    [candidates, manual, rules]
  );

  const selected = useMemo(
    () => rows.filter((r) => r.included && r.newRent !== null).map((r) => ({ tenant: r.c.tenant, newRent: r.newRent! })),
    [rows]
  );
  const summary = useMemo(() => summarizeBatch(selected), [selected]);

  if (!data) return <TabLoading isLoading={dataQ.isLoading} error={dataQ.error} />;
  if (!data.snapshotDate) return <p className="text-sm text-muted-foreground">Upload a rent roll first.</p>;

  const segments = by === "size" ? data.bySize : data.byType;
  const excluded = by === "size" ? rules.excludedSizes : rules.excludedUnitTypes;
  const toggleExcluded = (label: string) => {
    const key = by === "size" ? "excludedSizes" : "excludedUnitTypes";
    const cur = rules[key];
    setRules({ ...rules, [key]: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label] });
  };

  const reasonCounts = candidates.reduce<Partial<Record<ExclusionReason, number>>>((acc, c) => {
    if (c.reason) acc[c.reason] = (acc[c.reason] ?? 0) + 1;
    return acc;
  }, {});

  function reset() {
    setBatchId(undefined);
    setLoaded(null);
    setManual({});
    setName("");
    setMessage(null);
    setReopened(null);
  }

  async function open(id: number, asCopy = false) {
    if (!data) return;
    setBusy(true);
    setMessage(null);
    setReopened(null);
    try {
      const b = await getBatch(sitelinkId, id);
      // Batches saved before a rule existed fill it in with what the tool did then.
      const savedRules = { ...LEGACY_RULES, ...b.rules, effectiveDate: b.effectiveDate };
      // Recreate the saved selection as hand adjustments on top of the saved rules.
      const base = evaluateCandidates(withStreetRate(data.tenants, savedRules.streetBasis), savedRules);
      const inBatch = new Map(b.items.map((i) => [i.ledgerId, i.newRent]));
      const next: Manual = {};
      for (const c of base) {
        const rent = inBatch.get(c.tenant.ledgerId);
        if (rent !== undefined) {
          if (c.reason !== null || c.newRent !== rent) next[c.tenant.ledgerId] = { include: true, newRent: rent };
        } else if (c.reason === null) {
          next[c.tenant.ledgerId] = { include: false };
        }
      }
      // Open the batch on the street rate it was built with; the page switch follows.
      onStreetChange(savedRules.streetBasis);
      setRules(asCopy ? { ...savedRules, effectiveDate: firstOfMonthAtLeast(today, SCHEDULE.noticeDays + 5) } : savedRules);
      setManual(next);
      setName(asCopy ? `${b.name} (copy)` : b.name);
      setBatchId(asCopy ? undefined : b.id);
      setLoaded(asCopy ? null : b);
      if (!asCopy && b.snapshotDate !== data.snapshotDate) {
        // A finalized batch's rents show up in later rent rolls on purpose, so only drafts are checked.
        const changes = b.status === "draft" ? reopenChanges(b.items, data.tenants) : null;
        if (changes && hasReopenChanges(changes)) {
          setReopened({ from: b.snapshotDate, to: data.snapshotDate!, changes });
        } else {
          setMessage({
            kind: b.status === "draft" ? "ok" : "error",
            text:
              b.status === "draft"
                ? `This draft was built from the ${b.snapshotDate} rent roll. Checked against the ${data.snapshotDate} rent roll: no tenants moved out and no rents changed.`
                : `This batch was built from the ${b.snapshotDate} rent roll; the current one is ${data.snapshotDate}.`,
          });
        }
      }
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not open the batch" });
    } finally {
      setBusy(false);
    }
  }

  async function save(): Promise<number | null> {
    if (!data?.snapshotDate) return null;
    setBusy(true);
    setMessage(null);
    try {
      const res = await saveBatch(sitelinkId, {
        id: batchId,
        name,
        effectiveDate: rules.effectiveDate,
        snapshotDate: data.snapshotDate,
        rules,
        items: selected.map((s) => ({
          ledgerId: s.tenant.ledgerId,
          newRent: s.newRent,
          specialMonths: s.tenant.specialMonths,
          baselineExit90: s.tenant.exit90,
        })),
      });
      setBatchId(res.id);
      await qc.invalidateQueries({ queryKey: ["rateInc", "batches"] });
      setMessage({ kind: "ok", text: `Draft saved (${selected.length} tenants).` });
      return res.id;
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Save failed" });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!window.confirm(`Finalize "${name}" with ${selected.length} tenants effective ${rules.effectiveDate}? A finalized batch can't be edited.`)) return;
    const id = await save();
    if (id === null) return;
    setBusy(true);
    try {
      await finalizeBatch(sitelinkId, id);
      await qc.invalidateQueries({ queryKey: ["rateInc", "batches"] });
      await open(id);
      setMessage({ kind: "ok", text: "Batch finalized. You can now export it for SiteLink." });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not finalize" });
    } finally {
      setBusy(false);
    }
  }

  async function downloadSpreadsheet() {
    if (!data?.snapshotDate) return;
    setBusy(true);
    try {
      const bytes = await buildBatchSpreadsheet(rows, data.vacantUnits, rules, {
        facilityName,
        batchName: name.trim(),
        status: locked ? "final" : batchId ? "draft" : "unsaved",
        snapshotDate: data.snapshotDate,
      });
      const url = URL.createObjectURL(
        new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      );
      const a = document.createElement("a");
      a.href = url;
      const label = (name.trim() || "draft").replace(/[^\w-]+/g, "_");
      a.download = `RateIncreases_${facilityName.replace(/[^\w-]+/g, "_")}_${label}_${rules.effectiveDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not build the spreadsheet" });
    } finally {
      setBusy(false);
    }
  }

  /** Replace the batch with an imported spreadsheet: its tenants in, at its rents; everyone else out. */
  function applyImport(sheet: ImportSheet, plan: ImportPlan) {
    const include = new Map(plan.include.map((i) => [i.ledgerId, i]));
    const held = new Map(plan.held.map((h) => [h.ledgerId, h.flag]));
    const flagOf = new Map(sheet.rows.filter((r) => r.flag).map((r) => [r.ledgerId, r.flag!]));
    const next: Manual = {};
    for (const c of candidates) {
      const id = c.tenant.ledgerId;
      const inc = include.get(id);
      next[id] = inc ? { include: true, newRent: inc.newRent, note: flagOf.get(id) } : { include: false, note: held.get(id) };
    }
    setManual(next);
    setReopened(null);
    if (sheet.effectiveDate) setRules({ ...ruleState, effectiveDate: sheet.effectiveDate });
    if (!name.trim()) setName(`${facilityName} – ${sheet.name.trim()}`);
    setMessage({
      kind: "ok",
      text: `Loaded "${sheet.name.trim()}": ${plan.include.length} tenants in the batch${plan.held.length ? `, ${plan.held.length} held` : ""}. Review below, then save or finalize.`,
    });
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this draft?")) return;
    try {
      await deleteBatch(sitelinkId, id);
      if (id === batchId) reset();
      await qc.invalidateQueries({ queryKey: ["rateInc", "batches"] });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not delete" });
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The rules suggest a batch from the {data.snapshotDate} rent roll; adjust it by hand, then save a draft. Finalize
        when the decision is made, then export it for SiteLink. Numbers here are proposals — nothing reaches SiteLink
        until you upload the finished file there.
      </p>

      {(listQ.data?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved batches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {listQ.data!.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{b.name}</span>
                <Badge variant={b.status === "final" ? "default" : "secondary"}>{STAGE_LABEL[batchStage(b, today)]}</Badge>
                <span className="text-muted-foreground">
                  effective {b.effectiveDate} · {b.tenants} tenants · {fmtMoney(b.monthlyGain)}/mo
                </span>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => open(b.id)}>
                  Open
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => open(b.id, true)}>
                  Copy as new draft
                </Button>
                {b.status === "draft" && (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(b.id)}>
                    Delete
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {batchId ? "Editing batch" : "New batch"}
            {locked && (
              <Badge className="gap-1">
                <Lock className="h-3 w-3" /> finalized
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {rules.eligibility === "tenure"
              ? rules.onlyNeverRaised
                ? `Eligible = here at least ${rules.minTenureMonths} months by the effective date and never raised since moving in. Run it each month to pick up tenants as they reach ${rules.minTenureMonths} months.`
                : `Eligible = here at least ${rules.minTenureMonths} months by the effective date${rules.minMonthsSinceLastChange > 0 ? `, and not raised in the last ${rules.minMonthsSinceLastChange} months` : ", however recently they were last raised"}.`
              : `Eligible = the first increase comes ${rules.firstWaitMonths} months after the move-in special ends; after that, every ${rules.repeatWaitMonths} months from the last rent change.`}{" "}
            {rules.raiseToStreet ? "Tenants below street are raised to street rate when that is more than the percentage. " : ""}
            Adjust anything below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BatchRulesForm rules={rules} onChange={setRules} disabled={locked} today={today} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {candidates.length - Object.values(reasonCounts).reduce((a, b) => a + b, 0)} tenants pass the rules.
            </span>
            {Object.entries(reasonCounts).map(([k, n]) => (
              <span key={k}>
                {REASON_LABEL[k as ExclusionReason]}: {n}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {!locked && <BatchImportPanel tenants={tenants} disabled={busy} onApply={applyImport} />}

      <BatchSummary
        summary={summary}
        selected={selected}
        overall={data.overall}
        segments={segments}
        by={by}
        excluded={excluded}
        onToggleExcluded={toggleExcluded}
        locked={!!locked}
        evidence={evidenceQ.data ?? null}
      />

      <BatchCandidatesTable
        rows={rows}
        rules={rules}
        locked={!!locked}
        onToggle={(id, include) => setManual((m) => ({ ...m, [id]: { ...m[id], include } }))}
        onRent={(id, rent) => setManual((m) => ({ ...m, [id]: { ...m[id], include: true, newRent: rent } }))}
        streetLabel={street === "push" ? "Street (push)" : "Street"}
      />

      {!locked && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <Input className="w-64" placeholder="Batch name (e.g. Dec 2026 – first wave)" value={name} onChange={(e) => setName(e.target.value)} />
            <Button disabled={busy || !name.trim() || selected.length === 0} onClick={() => void save()}>
              Save draft
            </Button>
            <Button variant="outline" disabled={busy || !name.trim() || selected.length === 0} onClick={finalize}>
              Finalize…
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void downloadSpreadsheet()}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download spreadsheet
            </Button>
            {batchId && (
              <Button variant="ghost" onClick={reset} disabled={busy}>
                Start a new batch
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      {locked && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={busy} onClick={() => void downloadSpreadsheet()}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download spreadsheet
          </Button>
          <Button variant="outline" onClick={reset}>
            Start a new batch
          </Button>
        </div>
      )}

      {reopened && <ReopenNotice {...reopened} />}

      {message && (
        <div className={`flex items-start gap-2 text-sm ${message.kind === "ok" ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
          {message.kind === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {loaded && loaded.status === "final" && (
        <BatchExportPanel
          batchName={loaded.name}
          effectiveDate={loaded.effectiveDate}
          lines={loaded.items.map((i) => ({
            ledgerId: i.ledgerId,
            tenantId: i.tenantId,
            unitId: i.unitId,
            unitName: i.unitName,
            oldRent: i.oldRent,
            newRent: i.newRent,
          }))}
        />
      )}
    </div>
  );
}

/** Lists what changed for a reopened draft's tenants in the newer rent roll. */
function ReopenNotice({ from, to, changes }: { from: string; to: string; changes: ReopenChanges }) {
  const unit = (n: string | null) => `Unit ${n ?? "?"}`;
  return (
    <Card className="border-amber-300 dark:border-amber-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          This draft was saved on the {from} rent roll. Since then ({to}):
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {changes.movedOut.length > 0 && (
          <div>
            <div className="font-medium">
              {changes.movedOut.length} moved out, so they were dropped from the batch
            </div>
            <div className="text-muted-foreground">
              {changes.movedOut.map((l) => `${unit(l.unitName)} (was ${fmtMoney(l.oldRent)} → ${fmtMoney(l.newRent)})`).join(", ")}
            </div>
          </div>
        )}
        {changes.noLongerIncrease.length > 0 && (
          <div>
            <div className="font-medium">
              {changes.noLongerIncrease.length} now pay as much as the planned new rent, so it is no longer an increase. Change their
              new rent or take them out before saving.
            </div>
            <div className="text-muted-foreground">
              {changes.noLongerIncrease
                .map(({ line, rent }) => `${unit(line.unitName)}: rent now ${fmtMoney(rent)}, planned ${fmtMoney(line.newRent)}`)
                .join(", ")}
            </div>
          </div>
        )}
        {changes.rentChanged.length > 0 && (
          <div>
            <div className="font-medium">
              {changes.rentChanged.length} had their rent change. The planned new rent is kept, so the increase is different now.
            </div>
            <div className="text-muted-foreground">
              {changes.rentChanged
                .map(
                  ({ line, rent }) =>
                    `${unit(line.unitName)}: ${fmtMoney(line.oldRent)} → ${fmtMoney(rent)}, planned ${fmtMoney(line.newRent)} (now +${fmtMoney(line.newRent - rent)})`
                )
                .join(", ")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
