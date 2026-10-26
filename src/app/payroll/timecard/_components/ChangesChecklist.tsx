"use client";
import { useState } from "react";
import { CheckCircle2, ChevronDown, ListChecks, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  ReconcileResult,
  ReconcileEmployeeResult,
  ReconcileCategoryResult,
} from "../../actions/reconcileTimecard";
import type { EarlyClockIn, MissedPunch } from "@/lib/parseTimecardCsv";
import { groupEarlyClockIns } from "./EarlyClockIns";
import type { ShopCardCheck } from "./shopCardChecks";

type CategoryKey = "vacation" | "holiday" | "commission" | "mileage" | "bonus";

const CATEGORIES: { key: CategoryKey; label: string; unit: "hrs" | "$" }[] = [
  { key: "vacation", label: "Vacation", unit: "hrs" },
  { key: "holiday", label: "Holiday", unit: "hrs" },
  { key: "commission", label: "Commission", unit: "$" },
  { key: "mileage", label: "Mileage", unit: "$" },
  { key: "bonus", label: "Bonus", unit: "$" },
];

interface ChecklistItem {
  id: string;
  instruction: string;
  detail?: string;
}

interface ChecklistGroup {
  id: string;
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
}

interface EmployeeGroup extends ChecklistGroup {
  employeeNumber: string;
  sortKey: string;
}

function fmt(value: number, unit: "hrs" | "$") {
  return unit === "$" ? `$${value.toFixed(2)}` : `${value.toFixed(2)} hrs`;
}

// The app's committed values are what the export sends to Paycor, so every
// instruction is phrased as "make Paycor match the app" — except csv-only,
// where the app may simply be missing an entry.
function categoryInstruction(
  label: string,
  unit: "hrs" | "$",
  r: ReconcileCategoryResult,
): ChecklistItem | null {
  switch (r.status) {
    case "mismatch": {
      const diff = r.appValue - r.csvValue;
      return {
        id: label,
        instruction: `${label}: change Paycor from ${fmt(r.csvValue, unit)} to ${fmt(r.appValue, unit)}`,
        detail: `${diff > 0 ? "+" : "−"}${fmt(Math.abs(diff), unit)}`,
      };
    }
    case "app-only":
      return {
        id: label,
        instruction: `${label}: add ${fmt(r.appValue, unit)} in Paycor`,
        detail: "Committed in app, missing from Paycor",
      };
    case "csv-only":
      return {
        id: label,
        instruction: `${label}: Paycor has ${fmt(r.csvValue, unit)} but nothing is committed in the app`,
        detail: "Commit it in the app, or remove it from Paycor",
      };
    default:
      return null;
  }
}

function buildGroups(
  result: ReconcileResult,
  earlyClockIns: EarlyClockIn[],
  missedPunches: MissedPunch[],
  shopCardChecks: ShopCardCheck[],
): ChecklistGroup[] {
  const groups: ChecklistGroup[] = [];

  if (result.unmappedDepartments.length > 0) {
    groups.push({
      id: "unmapped",
      title: "Unrecognized worked departments",
      subtitle: "These lines can't be checked against the app",
      items: result.unmappedDepartments.map((d) => ({
        id: d,
        instruction: `Check hours/pay for "${d}" by hand`,
      })),
    });
  }

  const employeeGroups: EmployeeGroup[] = [];

  result.employees.forEach((emp: ReconcileEmployeeResult, i) => {
    const items: ChecklistItem[] = [];

    if (emp.matchedBy === "unmatched") {
      items.push({
        id: "unmatched",
        instruction: "No matching employee in the app",
        detail: "Check the name / Paycor number, or add them in the app",
      });
    }
    if (emp.missingFromCsv) {
      items.push({
        id: "missing",
        instruction:
          "Not in the Paycor upload, but has committed pay in the app",
        detail: "Add this employee/department to Paycor",
      });
    }
    for (const c of CATEGORIES) {
      const item = categoryInstruction(c.label, c.unit, emp[c.key]);
      if (item) items.push(item);
    }

    if (items.length > 0) {
      employeeGroups.push({
        id: `emp-${emp.employeeId ?? emp.employeeNumber}-${emp.workedDepartment}-${i}`,
        title: `${emp.lastName}, ${emp.firstName}`,
        subtitle: emp.workedDepartment || undefined,
        items,
        employeeNumber: emp.employeeNumber,
        sortKey: `${emp.lastName}, ${emp.firstName}, ${emp.workedDepartment}`,
      });
    }
  });

  // Punch items attach to the employee's existing group when they already
  // have changes, otherwise they get a group of their own.
  function addEmployeeItem(
    emp: { employeeNumber: string; lastName: string; firstName: string },
    department: string,
    item: ChecklistItem,
  ) {
    const existing = employeeGroups.find(
      (g) => g.employeeNumber === emp.employeeNumber,
    );
    if (existing) {
      existing.items.push(item);
    } else {
      employeeGroups.push({
        id: `punch-${emp.employeeNumber}`,
        title: `${emp.lastName}, ${emp.firstName}`,
        subtitle: department || undefined,
        items: [item],
        employeeNumber: emp.employeeNumber,
        sortKey: `${emp.lastName}, ${emp.firstName}, ${department}`,
      });
    }
  }

  // One line per missed punch — each one needs correcting in Paycor.
  for (const p of missedPunches) {
    addEmployeeItem(p, p.workedDepartment, {
      id: `missed-${p.date}-${p.inPunch}-${p.outPunch}`,
      instruction:
        p.missing === "out"
          ? `Add missing out punch on ${p.date} (in at ${p.inPunch})`
          : `Add missing in punch on ${p.date} (out at ${p.outPunch})`,
    });
  }

  // Shop cards are paid outside payroll and keyed in Paycor only for taxes,
  // so each one should match the employee's committed shop bonus.
  for (const s of shopCardChecks) {
    if (s.paycorShopCoded > 0) {
      addEmployeeItem(s, "", {
        id: "shop-coded",
        instruction: `Move ${fmt(s.paycorShopCoded, "$")} from "Shop" to "Monthly In" in Paycor`,
        detail: "Shop bonuses go under Monthly In",
      });
    }
    if (Math.abs(s.appShopBonus - s.paycorShopCards) > 0.01) {
      addEmployeeItem(s, "", {
        id: "shop-cards",
        ...(s.paycorShopCards === 0
          ? {
              instruction: `Add ${fmt(s.appShopBonus, "$")} shop card in Paycor`,
              detail: "Shop bonus committed in app, no matching Shop Cards entry",
            }
          : s.appShopBonus === 0
            ? {
                instruction: `Shop cards: Paycor has ${fmt(s.paycorShopCards, "$")} but no shop bonus is committed in the app`,
                detail: "Commit the shop bonus in the app, or remove the shop card from Paycor",
              }
            : {
                instruction: `Shop cards: change Paycor from ${fmt(s.paycorShopCards, "$")} to ${fmt(s.appShopBonus, "$")}`,
                detail: "Should match the committed shop bonus",
              }),
      });
    }
  }

  // One line per employee for early punches.
  for (const early of groupEarlyClockIns(earlyClockIns)) {
    const n = early.punches.length;
    addEmployeeItem(early, early.departments.join(", "), {
      id: "early-punches",
      instruction: `Check ${n} punch${n !== 1 ? "es" : ""} before 9:00 AM`,
    });
  }

  employeeGroups.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return [...groups, ...employeeGroups];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Prints a plain paper checklist from a hidden iframe, so the app's
 *  sidebar/header never end up on the page. */
function printChecklist(
  title: string,
  groups: ChecklistGroup[],
  isDone: (key: string) => boolean,
  hideDone: boolean,
) {
  const sections = groups
    .map((group) => {
      const items = group.items
        .map((item) => ({ item, done: isDone(`${group.id}|${item.id}`) }))
        .filter(({ done }) => !hideDone || !done);
      if (items.length === 0) return "";
      const lis = items
        .map(
          ({ item, done }) => `
            <li class="${done ? "done" : ""}">
              <span class="box">${done ? "&#10003;" : ""}</span>
              <div>
                ${escapeHtml(item.instruction)}
                ${item.detail ? `<div class="detail">${escapeHtml(item.detail)}</div>` : ""}
              </div>
            </li>`,
        )
        .join("");
      return `
        <section>
          <h2>${escapeHtml(group.title)}${
            group.subtitle
              ? ` <span class="sub">${escapeHtml(group.subtitle)}</span>`
              : ""
          }</h2>
          <ul>${lis}</ul>
        </section>`;
    })
    .join("");

  const html = `<!doctype html>
    <html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>
      body { font: 12px/1.4 -apple-system, system-ui, sans-serif; color: #000; margin: 0.5in; }
      h1 { font-size: 18px; margin: 0 0 12px; }
      section { break-inside: avoid; margin-bottom: 12px; }
      h2 { font-size: 13px; margin: 0 0 4px; border-bottom: 1px solid #999; padding-bottom: 2px; }
      .sub { font-weight: normal; color: #555; }
      ul { list-style: none; margin: 0; padding: 0; }
      li { display: flex; gap: 8px; padding: 3px 0; }
      .box { flex: none; width: 12px; height: 12px; border: 1px solid #000; font-size: 10px; line-height: 12px; text-align: center; margin-top: 2px; }
      .done > div { text-decoration: line-through; color: #666; }
      .detail { font-size: 11px; color: #555; }
    </style></head>
    <body><h1>${escapeHtml(title)}</h1>${sections}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const win = iframe.contentWindow!;
  win.addEventListener("afterprint", () => iframe.remove());
  win.focus();
  win.print();
}

export function ChangesChecklist({
  result,
  earlyClockIns = [],
  missedPunches = [],
  shopCardChecks = [],
}: {
  result: ReconcileResult;
  earlyClockIns?: EarlyClockIn[];
  missedPunches?: MissedPunch[];
  shopCardChecks?: ShopCardCheck[];
}) {
  // Not persisted — a fresh upload remounts this and clears the checks.
  const [done, setDone] = useState<Set<string>>(new Set());
  const [hideDone, setHideDone] = useState(false);
  const [open, setOpen] = useState(true);

  const groups = buildGroups(result, earlyClockIns, missedPunches, shopCardChecks);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const doneCount = done.size;

  function toggle(key: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (total === 0) {
    return (
      <Card className="border-green-600/40">
        <CardContent className="pt-6 flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Everything matches — no changes needed.
        </CardContent>
      </Card>
    );
  }

  const allDone = doneCount === total;

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
          <CollapsibleTrigger className="group flex items-center gap-2 text-left">
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Changes needed
              <span
                className={`text-sm font-normal ${
                  allDone ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {doneCount} of {total} done
              </span>
            </CardTitle>
          </CollapsibleTrigger>
          <div className="flex items-center gap-4">
            {open && (
              <div className="flex items-center gap-2">
                <Switch
                  id="hide-done"
                  checked={hideDone}
                  onCheckedChange={setHideDone}
                />
                <Label htmlFor="hide-done" className="text-sm font-normal">
                  Hide completed
                </Label>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                printChecklist(
                  `Changes needed — ${result.payPeriodLabel}`,
                  groups,
                  (key) => done.has(key),
                  hideDone,
                )
              }
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${(doneCount / total) * 100}%` }}
              />
            </div>

            {groups.map((group) => {
              const visible = group.items.filter(
                (item) => !hideDone || !done.has(`${group.id}|${item.id}`),
              );
              if (visible.length === 0) return null;
              return (
                <div key={group.id} className="rounded-md border">
                  <div className="px-3 py-2 border-b bg-muted/40 text-sm">
                    <span className="font-medium">{group.title}</span>
                    {group.subtitle && (
                      <span className="ml-2 text-muted-foreground">
                        {group.subtitle}
                      </span>
                    )}
                  </div>
                  <ul className="divide-y">
                    {visible.map((item) => {
                      const key = `${group.id}|${item.id}`;
                      const checked = done.has(key);
                      return (
                        <li key={key}>
                          <label className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggle(key)}
                              className="mt-0.5"
                            />
                            <div
                              className={`text-sm ${
                                checked
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {item.instruction}
                              {item.detail && (
                                <div className="text-xs text-muted-foreground">
                                  {item.detail}
                                </div>
                              )}
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
