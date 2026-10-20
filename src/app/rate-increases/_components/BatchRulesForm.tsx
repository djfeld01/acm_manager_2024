"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dayNum } from "../_lib/analytics";
import { POLICIES, type BatchRules, type PolicyKey } from "../_lib/batch";
import { SCHEDULE } from "../_lib/config";

interface Props {
  rules: BatchRules;
  onChange: (next: BatchRules) => void;
  disabled?: boolean;
  today: string;
}

const numOrNull = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v));
const pctShown = (x: number) => Math.round(x * 1000) / 10;

export function policyOf(rules: BatchRules): PolicyKey {
  if (rules.eligibility === "schedule") return "schedule";
  return rules.onlyNeverRaised ? "new-tenants" : "across-the-board";
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

/** A safeguard that can be switched on and off, with its number when on. */
function Guard({
  label,
  on,
  onToggle,
  disabled,
  children,
}: {
  label: string;
  on: boolean;
  onToggle: (on: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" disabled={disabled} checked={on} onChange={(e) => onToggle(e.target.checked)} />
        {label}
      </label>
      {on && children}
    </div>
  );
}

export function BatchRulesForm({ rules, onChange, disabled, today }: Props) {
  const set = (patch: Partial<BatchRules>) => onChange({ ...rules, ...patch });
  const lead = dayNum(rules.effectiveDate) - dayNum(today);
  const policy = policyOf(rules);

  function pick(key: PolicyKey) {
    onChange({
      ...POLICIES[key].rules,
      effectiveDate: rules.effectiveDate,
      streetBasis: rules.streetBasis,
      excludedUnitTypes: rules.excludedUnitTypes,
      excludedSizes: rules.excludedSizes,
    });
  }

  return (
    <div className="space-y-5">
      {rules.streetBasis === "push" && (
        <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
          &quot;Street&quot; here means each unit&apos;s <strong>push rate</strong>, not its standard rate — for raise-to-street, the
          over-street cap, and the Vs street columns. Change it with the Street rate switch at the top of the page.
        </p>
      )}
      <div className="space-y-2">
        <div className="text-sm font-medium">Policy</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(POLICIES) as PolicyKey[]).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={policy === k ? "default" : "outline"}
              disabled={disabled}
              onClick={() => pick(k)}
            >
              {POLICIES[k].label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {POLICIES[policy].description} Picking a policy resets the options below; you can adjust any of them after.
        </p>
      </div>

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
        <Field
          label="Increase (%)"
          hint={rules.raiseToStreet ? "Or street rate, if that takes more" : "Share of current rent, rounded to the dollar"}
        >
          <Input
            type="number"
            step="0.5"
            min="0"
            disabled={disabled}
            value={pctShown(rules.increasePct)}
            onChange={(e) => set({ increasePct: (numOrNull(e.target.value) ?? 0) / 100 })}
          />
        </Field>

        {rules.eligibility === "tenure" ? (
          <>
            <Field label="Months in unit" hint="By the effective date">
              <Input
                type="number"
                min="0"
                disabled={disabled}
                value={rules.minTenureMonths}
                onChange={(e) => set({ minTenureMonths: numOrNull(e.target.value) ?? 0 })}
              />
            </Field>
            <Field label="Skip if raised within (months)" hint="0 = ignore when they were last raised">
              <Input
                type="number"
                min="0"
                disabled={disabled || rules.onlyNeverRaised}
                value={rules.minMonthsSinceLastChange}
                onChange={(e) => set({ minMonthsSinceLastChange: numOrNull(e.target.value) ?? 0 })}
              />
            </Field>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {rules.eligibility === "tenure" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={rules.onlyNeverRaised}
            onChange={(e) => set({ onlyNeverRaised: e.target.checked })}
          />
          Only tenants whose rent hasn&apos;t changed since they moved in
        </label>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium">Safeguards &amp; options (all optional)</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Guard
            label="Cap the increase at"
            on={rules.maxIncreaseDollars !== null}
            disabled={disabled}
            onToggle={(on) => set({ maxIncreaseDollars: on ? 20 : null })}
          >
            <Input
              type="number"
              min="0"
              className="h-8 w-20"
              disabled={disabled}
              value={rules.maxIncreaseDollars ?? ""}
              onChange={(e) => set({ maxIncreaseDollars: numOrNull(e.target.value) })}
            />
            <span>$ per tenant</span>
          </Guard>
          <Guard
            label="Skip increases under"
            on={rules.minIncreaseDollars > 0}
            disabled={disabled}
            onToggle={(on) => set({ minIncreaseDollars: on ? 3 : 0 })}
          >
            <Input
              type="number"
              min="0"
              className="h-8 w-20"
              disabled={disabled}
              value={rules.minIncreaseDollars}
              onChange={(e) => set({ minIncreaseDollars: numOrNull(e.target.value) ?? 0 })}
            />
            <span>$</span>
          </Guard>
          <Guard
            label="Don't go more than"
            on={rules.maxOverStreetPct !== null}
            disabled={disabled}
            onToggle={(on) => set({ maxOverStreetPct: on ? 0.25 : null })}
          >
            <Input
              type="number"
              min="0"
              className="h-8 w-20"
              disabled={disabled}
              value={rules.maxOverStreetPct === null ? "" : pctShown(rules.maxOverStreetPct)}
              onChange={(e) => {
                const v = numOrNull(e.target.value);
                set({ maxOverStreetPct: v === null ? null : v / 100 });
              }}
            />
            <span>% over street</span>
          </Guard>
          <Guard
            label="Limit the batch to"
            on={rules.targetCount !== null}
            disabled={disabled}
            onToggle={(on) => set({ targetCount: on ? 100 : null })}
          >
            <Input
              type="number"
              min="1"
              className="h-8 w-20"
              disabled={disabled}
              value={rules.targetCount ?? ""}
              onChange={(e) => set({ targetCount: numOrNull(e.target.value) })}
            />
            <span>tenants (lowest risk first)</span>
          </Guard>
          <Guard
            label="Skip tenants with an open balance"
            on={rules.excludeWithBalance}
            disabled={disabled}
            onToggle={(on) => set({ excludeWithBalance: on })}
          />
          <Guard
            label="Skip tenants scheduled to move out"
            on={rules.excludeScheduledMoveOut}
            disabled={disabled}
            onToggle={(on) => set({ excludeScheduledMoveOut: on })}
          />
        </div>
        <div className="space-y-1">
          <Guard
            label="Raise tenants who are below street all the way to street rate"
            on={rules.raiseToStreet}
            disabled={disabled}
            onToggle={(on) => set({ raiseToStreet: on })}
          />
          <p className="pl-6 text-xs text-muted-foreground">
            Each tenant gets the increase above, or whatever it takes to reach their unit&apos;s street rate if that is more.
            Tenants already at or above street get just the percentage.
            {rules.raiseToStreet && rules.maxIncreaseDollars !== null &&
              ` The $${rules.maxIncreaseDollars} cap above still applies, so tenants more than that below street will stop short of it.`}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Always skipped: tenants who already have a scheduled rent change in SiteLink, and tenants already in a finalized
          batch that the rent roll doesn&apos;t show yet.
        </p>
      </div>
    </div>
  );
}
