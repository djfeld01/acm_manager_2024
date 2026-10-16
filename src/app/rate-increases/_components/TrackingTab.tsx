"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart } from "@/components/charts";
import { dayNum } from "../_lib/analytics";
import { STAGE_LABEL, batchStage, detectablePct, noticeDeadline, type Verdict } from "../_lib/cohort";
import { SCHEDULE } from "../_lib/config";
import { listBatches, type BatchListItem } from "../actions/batches";
import { getBatchOutcome, setBatchDates } from "../actions/tracking";
import { breakdownNoun, breakdownTitle, type Breakdown } from "./Breakdown";
import { fmtMoney, fmtNum, fmtPct } from "./format";
import { Stat, TabLoading } from "./Stat";

const VERDICT: Record<Verdict, { text: string; tone: string }> = {
  "too-early": { text: "Too early to say", tone: "" },
  "in-line": { text: "In line with expected", tone: "text-green-700 dark:text-green-400" },
  higher: { text: "Higher than expected", tone: "text-destructive" },
  lower: { text: "Lower than expected", tone: "text-green-700 dark:text-green-400" },
};

function DatesCard({ batch, today, sitelinkId }: { batch: BatchListItem; today: string; sitelinkId: string }) {
  const qc = useQueryClient();
  const [decision, setDecision] = useState(batch.decisionDate ?? "");
  const [notice, setNotice] = useState(batch.noticeDate ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    setDecision(batch.decisionDate ?? "");
    setNotice(batch.noticeDate ?? "");
    setMsg(null);
  }, [batch.id, batch.decisionDate, batch.noticeDate]);

  const stage = batchStage(batch, today);
  const deadline = noticeDeadline(batch.effectiveDate, SCHEDULE.noticeDays);
  const daysToDeadline = dayNum(deadline) - dayNum(today);

  async function save() {
    setMsg(null);
    try {
      await setBatchDates(sitelinkId, batch.id, { decisionDate: decision || null, noticeDate: notice || null });
      await qc.invalidateQueries({ queryKey: ["rateInc", "batches"] });
      await qc.invalidateQueries({ queryKey: ["rateInc", "outcome"] });
      setMsg({ ok: true, text: "Dates saved." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Could not save" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {batch.name}
          <Badge variant={stage === "effective" ? "default" : "secondary"}>{STAGE_LABEL[stage]}</Badge>
        </CardTitle>
        <CardDescription>
          {batch.tenants} tenants · effective {batch.effectiveDate} · {fmtMoney(batch.monthlyGain)}/mo planned gain. Tenants
          must be told at least {SCHEDULE.noticeDays} days ahead — by <strong>{deadline}</strong> for this batch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {stage === "awaiting-notice" && daysToDeadline < 0 && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            The notice deadline ({deadline}) has passed, so {SCHEDULE.noticeDays} days&apos; notice is no longer possible for
            {" "}{batch.effectiveDate}. Copy this batch as a new draft with a later effective date.
          </div>
        )}
        {stage === "awaiting-notice" && daysToDeadline >= 0 && daysToDeadline <= 7 && (
          <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Notices are due in {daysToDeadline} day{daysToDeadline === 1 ? "" : "s"} ({deadline}).
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="space-y-1">
            <span className="block font-medium">Decision date</span>
            <Input type="date" className="w-44" value={decision} onChange={(e) => setDecision(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="block font-medium">Notice sent</span>
            <Input type="date" className="w-44" value={notice} onChange={(e) => setNotice(e.target.value)} />
          </label>
          <Button onClick={save}>Save dates</Button>
        </div>
        {msg && (
          <div className={`flex items-center gap-2 text-sm ${msg.ok ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>
            {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {msg.text}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Move-outs are counted from the notice date, because tenants can leave as soon as they hear — not only after the
          new rent starts.
        </p>
      </CardContent>
    </Card>
  );
}

function Outcome({ batch, sitelinkId, by }: { batch: BatchListItem; sitelinkId: string; by: Breakdown }) {
  const q = useQuery({
    queryKey: ["rateInc", "outcome", sitelinkId, batch.id, batch.noticeDate],
    queryFn: () => getBatchOutcome(sitelinkId, batch.id),
  });
  if (!q.data) return <TabLoading isLoading={q.isLoading} error={q.error} />;
  const { outcome: o, realization: r, note, dataThrough } = q.data;
  const seg = o ? (by === "size" ? o.bySize : o.byType).sort((a, b) => b.tenants - a.tenants) : [];

  return (
    <div className="space-y-6">
      {note && <p className="text-sm text-muted-foreground">{note}</p>}

      {o && (
        <>
          <p className="text-sm text-muted-foreground">
            Following {o.tenants} tenants for {o.horizon} days since the notice ({o.noticeDate}); move-out records run
            through {dataThrough}.
            {o.leftBeforeNotice > 0 && ` ${o.leftBeforeNotice} left before the notice and aren't counted.`}
          </p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Move-outs so far"
              value={`${o.latest.actual} of ${o.tenants}`}
              sub={VERDICT[o.verdict].text + (o.zScore !== null ? ` (${o.zScore >= 0 ? "+" : ""}${o.zScore.toFixed(1)} std. dev.)` : "")}
            />
            <Stat label="Expected without an increase" value={fmtNum(o.latest.expectedTenure, 1)} sub={`Facility-wide average says ${fmtNum(o.latest.expectedFacility, 1)}`} />
            <Stat
              label="Similar tenants, not raised"
              value={o.control ? fmtNum(o.latest.controlExpected, 1) : "—"}
              sub={o.control ? `Same number of tenants, by their exit rate (${fmtPct(o.control.controlRate, 1)})` : "No comparable tenants"}
            />
            <Stat
              label="Net rent change now"
              value={r?.applicable ? `${r.netRunRate >= 0 ? "+" : ""}${fmtMoney(r.netRunRate)}/mo` : "—"}
              sub={r?.applicable ? `vs ${fmtMoney(r.plannedGain)} planned` : "Needs a rent roll after the effective date"}
            />
          </div>

          <p className={`text-sm ${VERDICT[o.verdict].tone}`}>
            {o.verdict === "too-early" &&
              "Fewer than about 3 move-outs were expected so far, so any difference is just chance. Check again as the weeks go by."}
            {o.verdict === "in-line" &&
              "Move-outs are within normal variation of what we'd expect with no increase. That doesn't prove there is no effect — see the note below on what this batch size can detect."}
            {o.verdict === "higher" && "More tenants left than we'd expect without an increase — more than chance alone would usually explain."}
            {o.verdict === "lower" && "Fewer tenants left than we'd expect."}
            {(() => {
              const d = detectablePct(o.latest.expectedTenure);
              return d === null
                ? ""
                : ` With about ${fmtNum(o.latest.expectedTenure, 0)} move-outs expected, exits would need to run roughly ${Math.round(d)}% above expected before they stand out from chance.`;
            })()}
          </p>

          {!o.control && (
            <p className="text-sm text-muted-foreground">
              There are no comparable tenants who weren&apos;t raised — expected when an increase goes to nearly everyone who has
              been here a while. The baseline built from what we knew on the notice date is the yardstick here. Batches that
              go out in later months also help: tenants not yet raised are a natural comparison for the ones just raised.
            </p>
          )}

          <LineChart
            title="Cumulative move-outs since the notice"
            description="Actual vs what we'd expect with no increase. Weekly points."
            data={o.series.map((p) => ({
              day: p.day,
              Actual: p.actual,
              "Expected (tenure-based)": +p.expectedTenure.toFixed(1),
              "Expected (facility-wide)": +p.expectedFacility.toFixed(1),
              ...(p.control !== null ? { "Similar, not raised": +p.control.toFixed(1) } : {}),
            }))}
            xAxisKey="day"
            height={320}
            lines={[
              { dataKey: "Actual", color: "#ef4444", dot: false, strokeWidth: 3 },
              { dataKey: "Expected (tenure-based)", color: "#3b82f6", dot: false },
              { dataKey: "Expected (facility-wide)", color: "#93c5fd", dot: false, strokeDasharray: "4 4" },
              { dataKey: "Similar, not raised", color: "#22c55e", dot: false },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle>Checkpoints</CardTitle>
              <CardDescription>Days are counted from the notice date.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Day</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Expected (tenure)</TableHead>
                    <TableHead className="text-right">Expected (facility)</TableHead>
                    <TableHead className="text-right">Similar, not raised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {o.checkpoints.map((c) => (
                    <TableRow key={c.day}>
                      <TableCell>{c.label}</TableCell>
                      <TableCell className="text-right">{c.day}</TableCell>
                      <TableCell className="text-right font-medium">{c.actual}</TableCell>
                      <TableCell className="text-right">{fmtNum(c.expectedTenure, 1)}</TableCell>
                      <TableCell className="text-right">{fmtNum(c.expectedFacility, 1)}</TableCell>
                      <TableCell className="text-right">{o.control ? fmtNum(c.controlExpected, 1) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {o.control && (
            <Card>
              <CardHeader>
                <CardTitle>Compared with similar tenants who weren&apos;t raised</CardTitle>
                <CardDescription>
                  Controls are other tenants on the same rent roll, matched on time in unit and how far over street they
                  paid. They weren&apos;t picked for this batch, so they&apos;re never a perfect match — check the balance
                  table below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Batch: <strong>{fmtPct(o.control.batchRate, 1)}</strong> left (95% range {fmtPct(o.control.batchRateCI.lo, 1)}–
                  {fmtPct(o.control.batchRateCI.hi, 1)}). Similar tenants: <strong>{fmtPct(o.control.controlRate, 1)}</strong>.
                  Difference:{" "}
                  <strong>
                    {o.control.difference >= 0 ? "+" : ""}
                    {(o.control.difference * 100).toFixed(1)} points
                  </strong>
                  . Compared {o.control.matchedBatch} batch tenants against a pool of {o.control.pool}
                  {o.control.unmatchedBatch > 0 && ` (${o.control.unmatchedBatch} had no comparable tenants and were left out)`}.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead />
                      <TableHead>This batch</TableHead>
                      <TableHead>Pool of not-raised tenants</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {o.balance.map((b) => (
                      <TableRow key={b.label}>
                        <TableCell>{b.label}</TableCell>
                        <TableCell>{b.batch}</TableCell>
                        <TableCell>{b.control}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>By {breakdownNoun(by)}</CardTitle>
              <CardDescription>Move-outs so far vs expected. Small groups swing a lot — read the big ones.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{breakdownTitle(by)}</TableHead>
                    <TableHead className="text-right">Tenants</TableHead>
                    <TableHead className="text-right">Left</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seg.map((s) => (
                    <TableRow key={s.label}>
                      <TableCell>{s.label}</TableCell>
                      <TableCell className="text-right">{s.tenants}</TableCell>
                      <TableCell className="text-right">{s.actual}</TableCell>
                      <TableCell className="text-right">{fmtNum(s.expected, 1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {r && (
        <Card>
          <CardHeader>
            <CardTitle>Did the new rent land?</CardTitle>
            <CardDescription>From the {r.snapshotDate} rent roll, unit by unit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!r.applicable ? (
              <p className="text-muted-foreground">
                The latest rent roll ({r.snapshotDate}) is from before the effective date ({batch.effectiveDate}). Upload one
                taken after that to see whether the new rents were applied.
              </p>
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>{r.stillHere}</strong> of {r.tenants} tenants are still here: {r.appliedAsPlanned} at the new rent,{" "}
                  {r.notApplied} still at the old rent{r.changedOtherwise > 0 ? `, ${r.changedOtherwise} at some other rent` : ""}.
                  {r.notApplied > 0 && <span className="text-destructive"> Check that those increases were scheduled in SiteLink.</span>}
                </li>
                <li>
                  Extra rent from the tenants who stayed: <strong>{fmtMoney(r.stayerGain)}/mo</strong> (planned for everyone:{" "}
                  {fmtMoney(r.plannedGain)}/mo).
                </li>
                <li>
                  <strong>{r.gone}</strong> units lost their tenant ({fmtMoney(r.lostRent)}/mo of old rent): {r.reLet} re-let at{" "}
                  {fmtMoney(r.reLetRent)}/mo, {r.vacant} vacant. Includes any tenant who transferred to another unit.
                </li>
                <li>
                  Net: these units now bring in{" "}
                  <strong>
                    {r.netRunRate >= 0 ? "+" : ""}
                    {fmtMoney(r.netRunRate)}/mo
                  </strong>{" "}
                  compared with before the increase.
                </li>
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function TrackingTab({ sitelinkId, by }: { sitelinkId: string; by: Breakdown }) {
  const today = new Date().toISOString().slice(0, 10);
  const listQ = useQuery({ queryKey: ["rateInc", "batches", sitelinkId], queryFn: () => listBatches(sitelinkId) });
  const [picked, setPicked] = useState<number | null>(null);

  const finals = (listQ.data ?? []).filter((b) => b.status === "final");
  if (!listQ.data) return <TabLoading isLoading={listQ.isLoading} error={listQ.error} />;
  if (finals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing to track yet. Finalize a batch in the Batch Builder, then record the date tenants were notified here.
      </p>
    );
  }
  const batch = finals.find((b) => b.id === picked) ?? finals[0]!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {finals.map((b) => (
          <Button key={b.id} size="sm" variant={b.id === batch.id ? "default" : "outline"} onClick={() => setPicked(b.id)}>
            {b.name} · {STAGE_LABEL[batchStage(b, today)]}
          </Button>
        ))}
      </div>
      <DatesCard batch={batch} today={today} sitelinkId={sitelinkId} />
      <Outcome batch={batch} sitelinkId={sitelinkId} by={by} />
    </div>
  );
}
