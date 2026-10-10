"use client";
import { Input } from "@/components/ui/input";
import { dayNum } from "../_lib/analytics";
import { SCHEDULE } from "../_lib/config";
import type { BatchRules } from "../_lib/batch";

interface Props {
  rules: BatchRules;
  onChange: (next: BatchRules) => void;
  disabled?: boolean;
  today: string;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const numOrNull = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));
const pctShown = (x: number) => Math.round(x * 1000) / 10;

export function BatchRulesForm({ rules, onChange, disabled, today }: Props) {
  const set = (patch: Partial<BatchRules>) => onChange({ ...rules, ...patch });
  const lead = dayNum(rules.effectiveDate) - dayNum(today);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field
        label="Effective date"
        hint={
          lead < SCHEDULE.noticeDays
            ? `Only ${lead} days from today — ${SCHEDULE.noticeDays} days' notice is required.`
            : `${lead} days from today.`
        }
      >
        <Input
          type="date"
          disabled={disabled}
          value={rules.effectiveDate}
          onChange={(e) => e.target.value && set({ effectiveDate: e.target.value })}
          className={lead < SCHEDULE.noticeDays ? "border-destructive" : ""}
        />
      </Field>
      <Field label="Increase (%)" hint="Share of current rent">
        <Input
          type="number"
          step="0.5"
          min="0"
          disabled={disabled}
          value={pctShown(rules.increasePct)}
          onChange={(e) => set({ increasePct: (numOrNull(e.target.value) ?? 0) / 100 })}
        />
      </Field>
      <Field label="Max increase ($)" hint="Blank = no cap">
        <Input
          type="number"
          min="0"
          disabled={disabled}
          value={rules.maxIncreaseDollars ?? ""}
          onChange={(e) => set({ maxIncreaseDollars: numOrNull(e.target.value) })}
        />
      </Field>
      <Field label="Min increase ($)" hint="Skip increases smaller than this">
        <Input
          type="number"
          min="0"
          disabled={disabled}
          value={rules.minIncreaseDollars}
          onChange={(e) => set({ minIncreaseDollars: numOrNull(e.target.value) ?? 0 })}
        />
      </Field>
      <Field label="Max over street (%)" hint="New rent can't exceed street × (1 + this)">
        <Input
          type="number"
          min="0"
          disabled={disabled}
          value={pctShown(rules.maxOverStreetPct)}
          onChange={(e) => set({ maxOverStreetPct: (numOrNull(e.target.value) ?? 0) / 100 })}
        />
      </Field>
      <Field label="First increase (months)" hint="After the move-in special ends">
        <Input
          type="number"
          min="0"
          disabled={disabled}
          value={rules.firstWaitMonths}
          onChange={(e) => set({ firstWaitMonths: numOrNull(e.target.value) ?? 0 })}
        />
      </Field>
      <Field label="Then every (months)" hint="Since the last rent change">
        <Input
          type="number"
          min="0"
          disabled={disabled}
          value={rules.repeatWaitMonths}
          onChange={(e) => set({ repeatWaitMonths: numOrNull(e.target.value) ?? 0 })}
        />
      </Field>
      <Field label="Batch size limit" hint="Blank = everyone eligible. Lowest risk first.">
        <Input
          type="number"
          min="1"
          disabled={disabled}
          value={rules.targetCount ?? ""}
          onChange={(e) => set({ targetCount: numOrNull(e.target.value) })}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          disabled={disabled}
          checked={rules.excludeWithBalance}
          onChange={(e) => set({ excludeWithBalance: e.target.checked })}
        />
        Skip tenants with an open balance
      </label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          disabled={disabled}
          checked={rules.excludeScheduledMoveOut}
          onChange={(e) => set({ excludeScheduledMoveOut: e.target.checked })}
        />
        Skip tenants scheduled to move out
      </label>
    </div>
  );
}
