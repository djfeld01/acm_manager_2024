"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Clock,
  Zap,
  Link2,
  AlertTriangle,
  Loader2,
  CircleDashed,
  X,
  SendHorizontal,
  RotateCcw,
  CheckCheck,
  Pencil,
  Undo2,
} from "lucide-react";
import {
  autoMatchAction,
  createMatchesAction,
  createMatchWithDiscrepancyAction,
  unmatchGroupAction,
  undoAutoMatchAction,
  submitForReviewAction,
  markCompleteAction,
  requestChangesAction,
  approveDiscrepancyAction,
  rejectDiscrepancyAction,
  recategorizeTransactionAction,
  type DiscrepancyType,
} from "@/app/(auth)/reconciliation/actions";

// ─── Types ─────────────────────────────────────────────────────────────────

interface BankAccount {
  bankAccountId: number;
  bankName: string;
  depositType: string;
}

interface BankTransaction {
  bankTransactionId: number;
  bankAccountId: number;
  transactionDate: string;
  transactionType: string;
  transactionAmount: number;
  isNextMonth?: boolean;
}

interface DailyPayment {
  dailyPaymentId: number;
  date: string;
  cash: number;
  check: number;
  visa: number;
  mastercard: number;
  americanExpress: number;
  discover: number;
  ach: number;
  dinersClub: number;
  debit: number;
}

interface Match {
  bankTransactionId: number;
  dailyPaymentId: number;
  amount: number;
  connectionType: string;
  depositDifference: number;
  matchType: string;
}

interface ReconciliationRecord {
  reconciliationId: number;
  status: string;
  totalExpectedCashCheck: number;
  totalExpectedCreditCard: number;
  totalActualCashCheck: number;
  totalActualCreditCard: number;
  totalTransactionsMatched: number;
  totalTransactionsUnmatched: number;
  totalDiscrepancies: number;
  notes: string | null;
}

interface SundryRow {
  description: string;
  monthlyAmount: number;
}

export interface ReconciliationWorkspaceProps {
  facilityId: string;
  facilityName: string;
  month: number;
  year: number;
  bankAccounts: BankAccount[];
  reconciliation: ReconciliationRecord | null;
  bankTransactions: BankTransaction[];
  dailyPayments: DailyPayment[];
  matches: Match[];
  sundries: SundryRow[];
  userId: string;
  userRole: string;
}

// ─── Row types ──────────────────────────────────────────────────────────────

type MatchedRow = {
  type: "matched";
  date: string;
  bankDate: string;
  sitelinkAmount: number;
  bankAmount: number;
  bankTransactionId: number;
  dailyPaymentId: number;
  connectionType: string;
  matchType: string;
  diff: number;
  isNextMonth?: boolean;
  isPrevMonth?: boolean;
  subType?: "cards" | "ach";
  // Rows from the same split match share a groupKey and are unmatched together
  groupKey: string;
  groupSize: number;
};

type SitelinkOnlyRow = {
  type: "sitelink_only";
  date: string;
  sitelinkAmount: number;
  dailyPaymentId: number;
  subType: "cash" | "cards" | "ach";
};

type BankOnlyRow = {
  type: "bank_only";
  date: string;
  bankAmount: number;
  bankTransactionId: number;
  transactionType: string;
  bankAccountId: number;
  isNextMonth?: boolean;
};

type TableRow = MatchedRow | SitelinkOnlyRow | BankOnlyRow;

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function fmtDate(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" },
  );
}

// Full date incl. year, used for hover tooltips
function fmtDateFull(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
}

function cardsTotal(p: DailyPayment) {
  return p.visa + p.mastercard + p.americanExpress + p.discover + p.dinersClub + p.debit;
}

function ccTotal(p: DailyPayment) {
  return cardsTotal(p) + p.ach;
}

type Period = "prev" | "current" | "next";

// Which month a row belongs to. Matched/SiteLink rows go by the SiteLink date
// (a Sep 30 sale that cleared Oct 2 is still September); bank-only rows go by
// the bank date.
function rowPeriod(row: TableRow, monthStart: string, monthEnd: string): Period {
  if (row.date < monthStart) return "prev";
  if (row.date > monthEnd) return "next";
  return "current";
}

// Section totals. 1:N and N:1 matches repeat the shared side on every row, so
// dedupe by id to avoid double-counting.
function sumRows(rows: TableRow[]) {
  const seenSitelink = new Set<string>();
  const seenBank = new Set<number>();
  let sitelink = 0;
  let bank = 0;
  for (const r of rows) {
    if (r.type !== "bank_only") {
      const key = `${r.dailyPaymentId}-${r.subType ?? "cash"}`;
      if (!seenSitelink.has(key)) {
        seenSitelink.add(key);
        sitelink += r.sitelinkAmount;
      }
    }
    if (r.type !== "sitelink_only" && !seenBank.has(r.bankTransactionId)) {
      seenBank.add(r.bankTransactionId);
      bank += r.bankAmount;
    }
  }
  return { sitelink, bank };
}

function monthName(year: number, month: number) {
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "long" });
}

function buildRows(
  payments: DailyPayment[],
  bankTxns: BankTransaction[],
  allMatches: Match[],
  tab: "cash" | "credit",
  monthStart: string,
  monthEnd: string,
): TableRow[] {
  const matchedBankIds = new Set(allMatches.map((m) => m.bankTransactionId));
  const rows: TableRow[] = [];
  const seenPairs = new Set<string>();

  if (tab === "cash") {
    const cashMatches = allMatches.filter((m) => m.connectionType === "cash");
    const matchedPaymentIds = new Set(cashMatches.map((m) => m.dailyPaymentId));

    for (const match of cashMatches) {
      const key = `${match.bankTransactionId}-${match.dailyPaymentId}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      const payment = payments.find((p) => p.dailyPaymentId === match.dailyPaymentId);
      const txn = bankTxns.find((t) => t.bankTransactionId === match.bankTransactionId);
      if (!payment || !txn) continue;
      const sitelinkAmount = payment.cash + payment.check;
      rows.push({
        type: "matched",
        date: payment.date || txn.transactionDate,
        bankDate: txn.transactionDate,
        sitelinkAmount,
        bankAmount: txn.transactionAmount,
        bankTransactionId: match.bankTransactionId,
        dailyPaymentId: match.dailyPaymentId,
        connectionType: "cash",
        matchType: match.matchType,
        diff: txn.transactionAmount - sitelinkAmount,
        isNextMonth: txn.isNextMonth,
        isPrevMonth: (payment.date || txn.transactionDate) < monthStart,
        groupKey: matchGroupKey(match, allMatches),
        groupSize: 0,
      });
    }

    for (const p of payments) {
      // Out-of-month payments are only loaded to render their matches here;
      // their unmatched remainder belongs to that month's reconciliation.
      if (p.date < monthStart || p.date > monthEnd) continue;
      if (matchedPaymentIds.has(p.dailyPaymentId)) continue;
      const amount = p.cash + p.check;
      if (amount === 0) continue;
      rows.push({ type: "sitelink_only", date: p.date, sitelinkAmount: amount, dailyPaymentId: p.dailyPaymentId, subType: "cash" });
    }

    for (const t of bankTxns) {
      if (matchedBankIds.has(t.bankTransactionId)) continue;
      if (t.transactionType !== "cash") continue;
      rows.push({ type: "bank_only", date: t.transactionDate, bankAmount: t.transactionAmount, bankTransactionId: t.bankTransactionId, transactionType: t.transactionType, bankAccountId: t.bankAccountId, isNextMonth: t.isNextMonth });
    }

    return withGroupSizes(rows).sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── Credit tab: cards and ACH are separate match types ──────────────────
  const cardMatches = allMatches.filter((m) => m.connectionType === "creditCard");
  const achMatches = allMatches.filter((m) => m.connectionType === "ach");
  const allCreditMatches = [...cardMatches, ...achMatches];
  const cardMatchedPaymentIds = new Set(cardMatches.map((m) => m.dailyPaymentId));
  const achMatchedPaymentIds = new Set(achMatches.map((m) => m.dailyPaymentId));

  for (const match of allCreditMatches) {
    const key = `${match.bankTransactionId}-${match.dailyPaymentId}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    const payment = payments.find((p) => p.dailyPaymentId === match.dailyPaymentId);
    const txn = bankTxns.find((t) => t.bankTransactionId === match.bankTransactionId);
    if (!payment || !txn) continue;
    const isAch = match.connectionType === "ach";
    const sitelinkAmount = isAch ? payment.ach : cardsTotal(payment);
    rows.push({
      type: "matched",
      date: payment.date || txn.transactionDate,
      bankDate: txn.transactionDate,
      sitelinkAmount,
      bankAmount: txn.transactionAmount,
      bankTransactionId: match.bankTransactionId,
      dailyPaymentId: match.dailyPaymentId,
      connectionType: match.connectionType,
      matchType: match.matchType,
      diff: txn.transactionAmount - sitelinkAmount,
      isNextMonth: txn.isNextMonth,
      isPrevMonth: (payment.date || txn.transactionDate) < monthStart,
      subType: isAch ? "ach" : "cards",
      groupKey: matchGroupKey(match, allMatches),
      groupSize: 0,
    });
  }

  for (const p of payments) {
    if (p.date < monthStart || p.date > monthEnd) continue;
    // Cards row — shown if cards amount > 0 and cards not yet matched
    if (cardsTotal(p) > 0 && !cardMatchedPaymentIds.has(p.dailyPaymentId)) {
      rows.push({ type: "sitelink_only", date: p.date, sitelinkAmount: cardsTotal(p), dailyPaymentId: p.dailyPaymentId, subType: "cards" });
    }
    // ACH row — shown if ACH amount > 0 and ACH not yet matched
    if (p.ach > 0 && !achMatchedPaymentIds.has(p.dailyPaymentId)) {
      rows.push({ type: "sitelink_only", date: p.date, sitelinkAmount: p.ach, dailyPaymentId: p.dailyPaymentId, subType: "ach" });
    }
  }

  for (const t of bankTxns) {
    if (matchedBankIds.has(t.bankTransactionId)) continue;
    if (t.transactionType !== "creditCard") continue;
    rows.push({ type: "bank_only", date: t.transactionDate, bankAmount: t.transactionAmount, bankTransactionId: t.bankTransactionId, transactionType: t.transactionType, bankAccountId: t.bankAccountId, isNextMonth: t.isNextMonth });
  }

  return withGroupSizes(rows).sort((a, b) => a.date.localeCompare(b.date));
}

// Mirrors unmatchGroupAction: a bank txn linked to several payments groups by
// bank; otherwise the match groups by payment (N bank → 1 payment, or 1:1).
function matchGroupKey(match: Match, allMatches: Match[]) {
  // Cards and ACH can share one deposit, so they group as one family
  const family = (t: string) => (t === "cash" ? "cash" : "credit");
  const bankLinks = allMatches.filter(
    (m) =>
      family(m.connectionType) === family(match.connectionType) &&
      m.bankTransactionId === match.bankTransactionId,
  ).length;
  return bankLinks > 1
    ? `${family(match.connectionType)}-b${match.bankTransactionId}`
    : `${family(match.connectionType)}-p${match.dailyPaymentId}`;
}

function withGroupSizes(rows: TableRow[]) {
  const sizes = new Map<string, number>();
  for (const r of rows) if (r.type === "matched") sizes.set(r.groupKey, (sizes.get(r.groupKey) ?? 0) + 1);
  for (const r of rows) if (r.type === "matched") r.groupSize = sizes.get(r.groupKey) ?? 1;
  return rows;
}

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS = {
  in_progress: { label: "In Progress", cls: "bg-primary/10 text-primary" },
  pending_review: {
    label: "Pending Review",
    cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  completed: {
    label: "Completed",
    cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive" },
} as const;

// ─── Main component ─────────────────────────────────────────────────────────

export function ReconciliationWorkspace({
  facilityId,
  month,
  year,
  bankAccounts,
  reconciliation,
  bankTransactions,
  dailyPayments,
  matches,
  sundries,
  userRole,
}: ReconciliationWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"cash" | "credit" | "truck" | "other" | "sundries">("cash");
  const [showAdjacent, setShowAdjacent] = useState(true);

  // Multi-select: bank uses a plain Set; SiteLink uses a Map so we can track
  // which sub-type (cash / cards / ach) and amount was selected per payment.
  const [selectedSitelinkItems, setSelectedSitelinkItems] = useState<
    Map<number, { subType: "cash" | "cards" | "ach"; amount: number }>
  >(new Map());
  const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(new Set());
  const selectedSitelinkIds = new Set(selectedSitelinkItems.keys());

  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ text: string; undo?: () => void } | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // Discrepancy form state
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState(false);
  const [discrepancyType, setDiscrepancyType] = useState<DiscrepancyType>("other");
  const [discrepancyNote, setDiscrepancyNote] = useState("");

  // Finalization state
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  const thisMonthName = monthName(year, month);
  const prevMonthName = monthName(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);
  const nextMonthName = monthName(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1);
  const cashRows = buildRows(dailyPayments, bankTransactions, matches, "cash", monthStart, monthEnd);
  const creditRows = buildRows(dailyPayments, bankTransactions, matches, "credit", monthStart, monthEnd);
  const truckRows = bankTransactions.filter((t) => t.transactionType === "truck");
  const otherRows = bankTransactions.filter((t) => t.transactionType === "other");
  const currentRows = tab === "cash" ? cashRows : tab === "credit" ? creditRows : [];
  const sections = (["prev", "current", "next"] as const)
    .map((period) => ({
      period,
      rows: currentRows.filter((r) => rowPeriod(r, monthStart, monthEnd) === period),
    }))
    .filter((sec) => sec.rows.length > 0 || sec.period === "current");
  const adjacentCount = sections
    .filter((sec) => sec.period !== "current")
    .reduce((n, sec) => n + sec.rows.length, 0);
  const sectionLabel: Record<Period, string> = {
    prev: `${prevMonthName} — matched to ${thisMonthName} deposits`,
    current: thisMonthName,
    next: `${nextMonthName} 1–10 — after month-end`,
  };

  // Running totals for selection — amount is stored in the Map at selection time
  const selectedSitelinkTotal = Array.from(selectedSitelinkItems.values()).reduce(
    (sum, v) => sum + v.amount,
    0,
  );

  const selectedBankTotal = Array.from(selectedBankIds).reduce((sum, id) => {
    const t = bankTransactions.find((t) => t.bankTransactionId === id);
    return sum + (t?.transactionAmount ?? 0);
  }, 0);

  const selectionBalances =
    selectedSitelinkIds.size > 0 &&
    selectedBankIds.size > 0 &&
    Math.abs(selectedSitelinkTotal - selectedBankTotal) < 0.02;

  const selectionImbalance =
    selectedSitelinkIds.size > 0 && selectedBankIds.size > 0 && !selectionBalances
      ? selectedBankTotal - selectedSitelinkTotal
      : null;

  // Summary totals cover the reconciliation month only. `dailyPayments` can
  // include prior-month payments (loaded to render cross-month matches) and
  // `bankTransactions` includes a buffer into next month — neither belongs in
  // this month's totals.
  const monthPayments = dailyPayments.filter((p) => p.date >= monthStart && p.date <= monthEnd);
  const monthBankTxns = bankTransactions.filter((t) => !t.isNextMonth);
  const lateBankTxns = bankTransactions.filter((t) => t.isNextMonth);
  const sumBank = (txns: BankTransaction[], type: string) =>
    txns.filter((t) => t.transactionType === type).reduce((s, t) => s + t.transactionAmount, 0);

  const totalSitelink = {
    cash: monthPayments.reduce((s, p) => s + p.cash + p.check, 0),
    cards: monthPayments.reduce((s, p) => s + cardsTotal(p), 0),
    ach: monthPayments.reduce((s, p) => s + p.ach, 0),
    credit: monthPayments.reduce((s, p) => s + ccTotal(p), 0),
  };
  const totalBank = {
    cash: sumBank(monthBankTxns, "cash"),
    credit: sumBank(monthBankTxns, "creditCard"),
  };
  const lateBank = {
    cash: sumBank(lateBankTxns, "cash"),
    credit: sumBank(lateBankTxns, "creditCard"),
  };
  const unmatchedSitelink = {
    cash: cashRows
      .filter((r) => r.type === "sitelink_only")
      .reduce((s, r) => s + (r.type === "sitelink_only" ? r.sitelinkAmount : 0), 0),
    credit: creditRows
      .filter((r) => r.type === "sitelink_only")
      .reduce((s, r) => s + (r.type === "sitelink_only" ? r.sitelinkAmount : 0), 0),
  };

  // Matched bank totals (this month's deposits only) — deduplicate by
  // bankTransactionId so 1:N matches don't double-count the same transaction
  const matchedBankSum = (connTypes: string[]) =>
    [...new Set(matches.filter((m) => connTypes.includes(m.connectionType)).map((m) => m.bankTransactionId))].reduce(
      (s, id) => s + (monthBankTxns.find((t) => t.bankTransactionId === id)?.transactionAmount ?? 0),
      0,
    );
  const matchedBankTotal = {
    cash: matchedBankSum(["cash"]),
    credit: matchedBankSum(["creditCard", "ach"]),
  };

  const lateNote = (amount: number) =>
    amount > 0.005 ? `+${fmt$(amount)} cleared in ${nextMonthName}` : undefined;
  const unmatchedNote = (amount: number) =>
    amount > 0.005 ? `${fmt$(amount)} unmatched` : "All matched";

  const clearSelection = () => {
    setSelectedSitelinkItems(new Map());
    setSelectedBankIds(new Set());
    setShowDiscrepancyForm(false);
    setDiscrepancyNote("");
    setDiscrepancyType("other");
    setError(null);
  };

  const toggleSitelink = (id: number, subType: "cash" | "cards" | "ach", amount: number) => {
    setError(null);
    setLastResult(null);
    setSelectedSitelinkItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      // Clicking the same row again deselects; clicking a different sub-type replaces
      if (existing && existing.subType === subType) {
        next.delete(id);
      } else {
        next.set(id, { subType, amount });
      }
      return next;
    });
  };

  const toggleBank = (id: number) => {
    setError(null);
    setLastResult(null);
    setSelectedBankIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleStart = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/reconciliation/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facilityId, month, year }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to start reconciliation");
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  };

  const handleAutoMatch = () => {
    setError(null);
    setLastResult(null);
    const bankAccountIds = bankAccounts.map((a) => a.bankAccountId);
    startTransition(async () => {
      try {
        const result = await autoMatchAction(facilityId, bankAccountIds, month, year);
        setLastResult(
          result.matched > 0
            ? {
                text: `Auto-match created ${result.matched} match${result.matched === 1 ? "" : "es"}.`,
                undo: () => runUndo(() => undoAutoMatchAction(result.pairs)),
              }
            : { text: "No new automatic matches found." },
        );
        clearSelection();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Auto-match failed");
      }
    });
  };

  // Per-row type for the selected SiteLink rows (a mixed cards + ACH selection
  // must not be saved under a single type)
  const paymentConnectionTypes = () =>
    Object.fromEntries(
      Array.from(selectedSitelinkItems.entries()).map(([id, v]) => [
        id,
        v.subType === "cash" ? "cash" : v.subType === "ach" ? "ach" : "creditCard",
      ]),
    ) as Record<number, "cash" | "creditCard" | "ach">;

  const handleMatch = () => {
    if (!selectionBalances) return;
    setError(null);
    setLastResult(null);

    const bankIds = Array.from(selectedBankIds);
    const sitelinkIds = Array.from(selectedSitelinkIds);
    const firstSubType = Array.from(selectedSitelinkItems.values())[0]?.subType;
    const connType = tab === "cash" ? "cash" : firstSubType === "ach" ? "ach" : "creditCard";

    // Validate: only allow 1:N or N:1 (not N:M)
    if (bankIds.length > 1 && sitelinkIds.length > 1) {
      setError(
        "Cannot match multiple bank rows to multiple SiteLink rows at once. " +
          "Match one side at a time.",
      );
      return;
    }

    startTransition(async () => {
      try {
        await createMatchesAction(bankIds, sitelinkIds, connType, facilityId, paymentConnectionTypes());
        clearSelection();
        setLastResult({
          text: "Matched.",
          undo: () => runUndo(() => unmatchGroupAction(bankIds[0], sitelinkIds[0])),
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Match failed");
      }
    });
  };

  const handleMatchWithDiscrepancy = () => {
    if (!discrepancyNote.trim()) {
      setError("Please enter a note explaining the discrepancy.");
      return;
    }
    if (!reconciliation) return;

    const bankIds = Array.from(selectedBankIds);
    const sitelinkIds = Array.from(selectedSitelinkIds);
    const firstSubType = Array.from(selectedSitelinkItems.values())[0]?.subType;
    const connType = tab === "cash" ? "cash" : firstSubType === "ach" ? "ach" : "creditCard";

    if (bankIds.length > 1 && sitelinkIds.length > 1) {
      setError("Cannot match multiple bank rows to multiple SiteLink rows at once.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createMatchWithDiscrepancyAction(
          bankIds,
          sitelinkIds,
          connType,
          facilityId,
          reconciliation.reconciliationId,
          discrepancyType,
          discrepancyNote.trim(),
          paymentConnectionTypes(),
        );
        clearSelection();
        setLastResult({
          text: "Matched with note.",
          undo: () => runUndo(() => unmatchGroupAction(bankIds[0], sitelinkIds[0])),
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Match failed");
      }
    });
  };

  const handleRecategorize = (bankTransactionId: number, newType: string) => {
    startTransition(async () => {
      try {
        await recategorizeTransactionAction(
          bankTransactionId,
          newType as "cash" | "creditCard" | "truck" | "other",
        );
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Recategorize failed");
      }
    });
  };

  const handleUnmatch = (bankTransactionId: number, dailyPaymentId: number) => {
    setError(null);
    setLastResult(null);
    startTransition(async () => {
      try {
        const { removed } = await unmatchGroupAction(bankTransactionId, dailyPaymentId);
        setHoveredGroup(null);
        setLastResult({ text: `Unmatched ${removed} row${removed === 1 ? "" : "s"}.` });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unmatch failed");
      }
    });
  };

  const runUndo = (undo: () => Promise<{ removed: number }>) => {
    setError(null);
    startTransition(async () => {
      try {
        const { removed } = await undo();
        setLastResult({ text: `Undone — removed ${removed} match${removed === 1 ? "" : "es"}.` });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Undo failed");
      }
    });
  };

  const handleSubmitForReview = () => {
    if (!reconciliation) return;
    setError(null);
    startTransition(async () => {
      try {
        await submitForReviewAction(reconciliation.reconciliationId);
        setShowSubmitConfirm(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to submit for review");
      }
    });
  };

  const handleMarkComplete = () => {
    if (!reconciliation) return;
    setError(null);
    startTransition(async () => {
      try {
        await markCompleteAction(reconciliation.reconciliationId, reviewNotes.trim() || undefined);
        setReviewNotes("");
        setShowReviewPanel(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to mark complete");
      }
    });
  };

  const handleRequestChanges = () => {
    if (!reconciliation) return;
    setError(null);
    startTransition(async () => {
      try {
        await requestChangesAction(reconciliation.reconciliationId, reviewNotes.trim() || undefined);
        setReviewNotes("");
        setShowReviewPanel(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to request changes");
      }
    });
  };

  // ── Not started ────────────────────────────────────────────────────────────

  if (!reconciliation) {
    const cashDiff = totalBank.cash - totalSitelink.cash;
    const creditDiff = totalBank.credit - totalSitelink.credit;
    return (
      <div className="border rounded-lg p-8 text-center space-y-6">
        <div>
          <CircleDashed className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold">Reconciliation Not Started</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {bankTransactions.length} bank transactions ·{" "}
            {dailyPayments.length} SiteLink daily payments
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
          <SummaryCard label={`SiteLink Cash / Check · ${thisMonthName}`} value={fmt$(totalSitelink.cash)} />
          <SummaryCard
            label={`Bank Cash Deposits · ${thisMonthName}`}
            value={fmt$(totalBank.cash)}
            diff={cashDiff}
            notes={[lateNote(lateBank.cash)]}
          />
          <SummaryCard
            label={`SiteLink Credit Card · ${thisMonthName}`}
            value={fmt$(totalSitelink.credit)}
            notes={[`Cards ${fmt$(totalSitelink.cards)} · ACH ${fmt$(totalSitelink.ach)}`]}
          />
          <SummaryCard
            label={`Bank CC Deposits · ${thisMonthName}`}
            value={fmt$(totalBank.credit)}
            diff={creditDiff}
            notes={[lateNote(lateBank.credit)]}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleStart} disabled={isPending} size="lg">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Start Reconciliation
        </Button>
      </div>
    );
  }

  // ── Workspace ──────────────────────────────────────────────────────────────

  const statusCfg = STATUS[reconciliation.status as keyof typeof STATUS] ?? {
    label: reconciliation.status,
    cls: "bg-muted text-muted-foreground",
  };
  const isEditable = reconciliation.status === "in_progress";
  const isPendingReview = reconciliation.status === "pending_review";
  const isCompleted = reconciliation.status === "completed";
  const canReview = ["ADMIN", "OWNER", "SUPERVISOR"].includes(userRole);
  // Reviewers can fix matches while reviewing without sending it back
  const canMatch = isEditable || (isPendingReview && canReview);
  const totalUnmatched = cashRows.filter((r) => r.type !== "matched").length +
    creditRows.filter((r) => r.type !== "matched").length;
  const cashUnmatched = cashRows.filter((r) => r.type !== "matched").length;
  const creditUnmatched = creditRows.filter((r) => r.type !== "matched").length;

  return (
    <div className="space-y-4">
      {/* Status + action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={statusCfg.cls}>{statusCfg.label}</Badge>
          {lastResult && (
            <span className="text-sm text-muted-foreground">
              {lastResult.text}
              {lastResult.undo && canMatch && (
                <button
                  onClick={lastResult.undo}
                  disabled={isPending}
                  className="ml-2 inline-flex items-center gap-1 font-medium text-primary hover:underline disabled:opacity-50"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo
                </button>
              )}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {canMatch && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoMatch}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="mr-1.5 h-3.5 w-3.5" />
              )}
              Auto-match
            </Button>
          )}
          {canMatch && selectedSitelinkIds.size > 0 && selectedBankIds.size > 0 && (
            <>
              {selectionBalances && (
                <Button size="sm" onClick={handleMatch} disabled={isPending}>
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Match Selected
                </Button>
              )}
              {!selectionBalances && !showDiscrepancyForm && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                  onClick={() => setShowDiscrepancyForm(true)}
                  disabled={isPending}
                >
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                  Match with Note…
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            </>
          )}
          {isEditable && selectedSitelinkIds.size === 0 && selectedBankIds.size === 0 && (
            <Button
              size="sm"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isPending}
            >
              <SendHorizontal className="mr-1.5 h-3.5 w-3.5" />
              Submit for Review
            </Button>
          )}
          {isPendingReview && canReview && !showReviewPanel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReviewPanel(true)}
              disabled={isPending}
            >
              Review & Finalize
            </Button>
          )}
        </div>
      </div>

      {/* Submit for review confirmation */}
      {showSubmitConfirm && isEditable && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
          <p className="text-sm font-medium">
            Submit this reconciliation for review?
          </p>
          {totalUnmatched > 0 && (
            <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {totalUnmatched} unmatched transaction{totalUnmatched !== 1 ? "s" : ""} remain. You can still submit, but the reviewer will see them.
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmitForReview} disabled={isPending}>
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirm Submit
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reviewer panel — shown to ADMIN/OWNER/SUPERVISOR when status is pending_review */}
      {isPendingReview && canReview && showReviewPanel && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5 space-y-3">
          <p className="text-sm font-medium">
            Review this reconciliation and mark it complete, or send it back for changes.
          </p>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Review Notes (optional)
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes for the office manager…"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleMarkComplete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              )}
              Mark as Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleRequestChanges}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Request Changes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReviewPanel(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Pending review banner for non-reviewers */}
      {isPendingReview && !canReview && (
        <div className="border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 bg-yellow-50/50 dark:bg-yellow-900/10 flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
          <Clock className="h-4 w-4 shrink-0" />
          This reconciliation has been submitted and is awaiting review by the accounting team.
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div className="border border-green-300 dark:border-green-700 rounded-lg p-3 bg-green-50/50 dark:bg-green-900/10 flex items-center gap-2 text-sm text-green-800 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          This reconciliation has been reviewed and marked complete.
        </div>
      )}

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Selection totals — shown when anything is selected */}
      {canMatch && (selectedSitelinkIds.size > 0 || selectedBankIds.size > 0) && (
        <div className="border rounded-lg p-3 bg-muted/40 flex flex-wrap gap-4 text-sm">
          <span>
            <span className="text-muted-foreground">Selected SiteLink:</span>{" "}
            <span className="font-semibold">{fmt$(selectedSitelinkTotal)}</span>
            {selectedSitelinkIds.size > 1 && (
              <span className="text-muted-foreground ml-1">
                ({selectedSitelinkIds.size} rows)
              </span>
            )}
          </span>
          <span>
            <span className="text-muted-foreground">Selected Bank:</span>{" "}
            <span className="font-semibold">{fmt$(selectedBankTotal)}</span>
            {selectedBankIds.size > 1 && (
              <span className="text-muted-foreground ml-1">
                ({selectedBankIds.size} rows)
              </span>
            )}
          </span>
          {selectionImbalance !== null && (
            <span className={selectionImbalance < 0 ? "text-destructive" : "text-yellow-600"}>
              {selectionImbalance > 0 ? "+" : ""}
              {fmt$(selectionImbalance)} difference — adjust selection to balance
            </span>
          )}
          {selectionBalances && (
            <span className="text-green-700 dark:text-green-400 font-medium">
              ✓ Amounts balance — ready to match
            </span>
          )}
        </div>
      )}

      {/* Discrepancy form — shown when "Match with Note" is clicked */}
      {canMatch && showDiscrepancyForm && (
        <div className="border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 bg-yellow-50/50 dark:bg-yellow-900/10 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <span className="text-sm font-medium">
              Match with Discrepancy —{" "}
              <span className="text-yellow-700 dark:text-yellow-400">
                {selectionImbalance !== null
                  ? `${selectionImbalance > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(selectionImbalance)} difference`
                  : "amounts differ"}
              </span>
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Reason
              </label>
              <select
                value={discrepancyType}
                onChange={(e) => setDiscrepancyType(e.target.value as DiscrepancyType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="bank_fee">Bank Fee</option>
                <option value="timing_difference">Timing Difference</option>
                <option value="error">Recording Error</option>
                <option value="refund">Refund / Chargeback</option>
                <option value="multi_day_combination">Multi-day Combination</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Note <span className="text-destructive">*</span>
              </label>
              <textarea
                value={discrepancyNote}
                onChange={(e) => setDiscrepancyNote(e.target.value)}
                placeholder="Explain the discrepancy…"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleMatchWithDiscrepancy}
              disabled={isPending || !discrepancyNote.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirm Match
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowDiscrepancyForm(false);
                setDiscrepancyNote("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Totals summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label={`SiteLink Cash / Check · ${thisMonthName}`}
          value={fmt$(totalSitelink.cash)}
          notes={[unmatchedNote(unmatchedSitelink.cash)]}
        />
        <SummaryCard
          label={`Bank Cash Deposits · ${thisMonthName}`}
          value={fmt$(totalBank.cash)}
          matched={matchedBankTotal.cash}
          diff={totalBank.cash - totalSitelink.cash}
          notes={[lateNote(lateBank.cash)]}
        />
        <SummaryCard
          label={`SiteLink Credit Card · ${thisMonthName}`}
          value={fmt$(totalSitelink.credit)}
          notes={[
            `Cards ${fmt$(totalSitelink.cards)} · ACH ${fmt$(totalSitelink.ach)}`,
            unmatchedNote(unmatchedSitelink.credit),
          ]}
        />
        <SummaryCard
          label={`Bank CC Deposits · ${thisMonthName}`}
          value={fmt$(totalBank.credit)}
          matched={matchedBankTotal.credit}
          diff={totalBank.credit - totalSitelink.credit}
          notes={[lateNote(lateBank.credit)]}
        />
      </div>

      {/* Tabs + table */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "cash" | "credit" | "truck" | "other" | "sundries");
          clearSelection();
        }}
      >
        <TabsList>
          <TabsTrigger value="cash">
            Cash / Check
            {cashUnmatched > 0 && (
              <span className="ml-1.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                {cashUnmatched}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="credit">
            Credit Card
            {creditUnmatched > 0 && (
              <span className="ml-1.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                {creditUnmatched}
              </span>
            )}
          </TabsTrigger>
          {truckRows.length > 0 && (
            <TabsTrigger value="truck">
              Truck
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {truckRows.length}
              </span>
            </TabsTrigger>
          )}
          {otherRows.length > 0 && (
            <TabsTrigger value="other">
              Other
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {otherRows.length}
              </span>
            </TabsTrigger>
          )}
          <TabsTrigger value="sundries">
            Sundries
            {sundries.length > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {sundries.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {(tab === "cash" || tab === "credit") && adjacentCount > 0 && (
          <label className="ml-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none align-middle">
            <input
              type="checkbox"
              checked={showAdjacent}
              onChange={(e) => {
                setShowAdjacent(e.target.checked);
                clearSelection();
              }}
              className="h-3.5 w-3.5 accent-primary"
            />
            Show {prevMonthName} / {nextMonthName} rows ({adjacentCount})
          </label>
        )}

        {tab === "sundries" ? (
          <SundriesTable sundries={sundries} />
        ) : tab === "truck" ? (
          <TruckTable rows={truckRows} bankAccounts={bankAccounts} />
        ) : tab === "other" ? (
          <TruckTable rows={otherRows} bankAccounts={bankAccounts} />
        ) : (
          <TooltipProvider delayDuration={150}>
          <div className="mt-4 border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">SiteLink</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Bank</th>
                  <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">
                    Diff
                  </th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  {canMatch && (
                    <th className="w-8 p-3" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No transactions for this period.
                    </td>
                  </tr>
                ) : (
                  sections
                    .filter((sec) => showAdjacent || sec.period === "current")
                    .map((sec) => {
                      const totals = sumRows(sec.rows);
                      const isCurrent = sec.period === "current";
                      return (
                        <Fragment key={sec.period}>
                          <tr
                            className={
                              isCurrent
                                ? "bg-primary/5 border-y"
                                : "bg-muted/40 border-y text-muted-foreground"
                            }
                          >
                            <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                              {sectionLabel[sec.period]}
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-semibold">
                              {fmt$(totals.sitelink)}
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-semibold">
                              {fmt$(totals.bank)}
                            </td>
                            <td className="hidden sm:table-cell" />
                            <td className="px-3 py-2 text-center text-xs">
                              {sec.rows.length} row{sec.rows.length === 1 ? "" : "s"}
                            </td>
                            {canMatch && <td />}
                          </tr>
                          {sec.rows.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                No {thisMonthName} transactions.
                              </td>
                            </tr>
                          ) : (
                            sec.rows.map((row, i) => (
                              <MatchRow
                                key={`${sec.period}-${i}`}
                                row={row}
                                isEditable={canMatch}
                                selectedSitelinkIds={selectedSitelinkIds}
                                selectedBankIds={selectedBankIds}
                                onToggleSitelink={(id, subType, amount) => toggleSitelink(id, subType, amount)}
                                onToggleBank={toggleBank}
                                onUnmatch={handleUnmatch}
                                onRecategorize={handleRecategorize}
                                isPending={isPending}
                                hoveredGroup={hoveredGroup}
                                onHoverGroup={setHoveredGroup}
                              />
                            ))
                          )}
                        </Fragment>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
          </TooltipProvider>
        )}
      </Tabs>

      {/* Helper text */}
      {canMatch && selectedSitelinkIds.size === 0 && selectedBankIds.size === 0 && (
        <p className="text-xs text-muted-foreground">
          Click unmatched rows to select them. Select one or more SiteLink rows and one or more
          bank rows whose amounts balance, then click{" "}
          <span className="font-medium">Match Selected</span>.
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  diff,
  matched,
  notes,
}: {
  label: string;
  value: string;
  diff?: number;
  matched?: number;
  notes?: (string | undefined)[];
}) {
  const fmt$ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
      {matched !== undefined && (
        <div className="text-xs mt-0.5 text-muted-foreground">
          {fmt$(matched)} matched
        </div>
      )}
      {diff !== undefined && Math.abs(diff) > 0.01 && (
        <div
          className={`text-xs mt-0.5 font-medium ${diff < 0 ? "text-destructive" : "text-green-600"}`}
        >
          {diff > 0 ? "+" : ""}
          {fmt$(diff)} vs SiteLink
        </div>
      )}
      {notes?.filter(Boolean).map((n) => (
        <div key={n} className="text-xs mt-0.5 text-muted-foreground">
          {n}
        </div>
      ))}
    </div>
  );
}

// Rent is booked via an adjusting entry in QuickBooks, so it's excluded from
// the selected total by default. Other exclusions are remembered per browser.
const SUNDRY_EXCLUDED_KEY = "reconciliation.sundries.excluded";
const DEFAULT_EXCLUDED_SUNDRIES = ["rent"];

function loadExcludedSundries(): Set<string> {
  try {
    const raw = localStorage.getItem(SUNDRY_EXCLUDED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // storage unavailable — fall back to defaults
  }
  return new Set(DEFAULT_EXCLUDED_SUNDRIES);
}

function SundriesTable({ sundries }: { sundries: { description: string; monthlyAmount: number }[] }) {
  const fmt$ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  // Keyed by lowercased description so the choice carries across facilities/months
  const [excluded, setExcluded] = useState<Set<string>>(
    () => new Set(DEFAULT_EXCLUDED_SUNDRIES),
  );
  useEffect(() => setExcluded(loadExcludedSundries()), []);

  const keyOf = (description: string) => description.trim().toLowerCase();
  const isIncluded = (description: string) => !excluded.has(keyOf(description));

  const updateExcluded = (next: Set<string>) => {
    setExcluded(next);
    try {
      localStorage.setItem(SUNDRY_EXCLUDED_KEY, JSON.stringify([...next]));
    } catch {
      // ignore — selection still works for this session
    }
  };

  const toggle = (description: string) => {
    const next = new Set(excluded);
    const key = keyOf(description);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updateExcluded(next);
  };

  const allIncluded = sundries.every((r) => isIncluded(r.description));
  const toggleAll = () => {
    const next = new Set(excluded);
    for (const r of sundries) {
      if (allIncluded) next.add(keyOf(r.description));
      else next.delete(keyOf(r.description));
    }
    updateExcluded(next);
  };

  const total = sundries.reduce((s, r) => s + r.monthlyAmount, 0);
  const selectedTotal = sundries
    .filter((r) => isIncluded(r.description))
    .reduce((s, r) => s + r.monthlyAmount, 0);
  const selectedCount = sundries.filter((r) => isIncluded(r.description)).length;

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-b">
            <th className="w-10 p-3">
              {sundries.length > 0 && (
                <input
                  type="checkbox"
                  checked={allIncluded}
                  onChange={toggleAll}
                  aria-label="Include all in total"
                  className="h-3.5 w-3.5 accent-primary align-middle"
                />
              )}
            </th>
            <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Monthly Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sundries.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                No sundry income found for the last day of this month.
              </td>
            </tr>
          ) : (
            sundries.map((row, i) => {
              const included = isIncluded(row.description);
              return (
                <tr
                  key={i}
                  className={`hover:bg-muted/20 cursor-pointer ${included ? "" : "text-muted-foreground"}`}
                  onClick={() => toggle(row.description)}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggle(row.description)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Include ${row.description} in total`}
                      className="h-3.5 w-3.5 accent-primary align-middle"
                    />
                  </td>
                  <td className="p-3">{row.description}</td>
                  <td className={`p-3 text-right ${included ? "" : "line-through decoration-muted-foreground/50"}`}>
                    {fmt$(row.monthlyAmount)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {sundries.length > 0 && (
          <tfoot>
            <tr className="bg-muted/40 border-t font-semibold">
              <td />
              <td className="p-3">
                Selected total
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({selectedCount} of {sundries.length})
                </span>
              </td>
              <td className="p-3 text-right">{fmt$(selectedTotal)}</td>
            </tr>
            <tr className="text-xs text-muted-foreground">
              <td />
              <td className="px-3 pb-3">All sundries</td>
              <td className="px-3 pb-3 text-right">{fmt$(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function txnTypeLabel(type: string) {
  switch (type) {
    case "cash": return "Cash / Check";
    case "creditCard": return "Credit Card";
    case "truck": return "Truck";
    case "other": return "Other";
    default: return type;
  }
}

function MatchRow({
  row,
  isEditable,
  selectedSitelinkIds,
  selectedBankIds,
  onToggleSitelink,
  onToggleBank,
  onUnmatch,
  onRecategorize,
  isPending,
  hoveredGroup,
  onHoverGroup,
}: {
  row: TableRow;
  isEditable: boolean;
  selectedSitelinkIds: Set<number>;
  selectedBankIds: Set<number>;
  onToggleSitelink: (id: number, subType: "cash" | "cards" | "ach", amount: number) => void;
  onToggleBank: (id: number) => void;
  onUnmatch: (bankId: number, paymentId: number) => void;
  onRecategorize: (bankTransactionId: number, newType: string) => void;
  isPending: boolean;
  hoveredGroup: string | null;
  onHoverGroup: (key: string | null) => void;
}) {
  const [isEditingType, setIsEditingType] = useState(false);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const fmt$ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  if (row.type === "matched") {
    const hasDiff = Math.abs(row.diff) > 0.01;
    const isAch = row.subType === "ach";
    return (
      <tr
        className={hoveredGroup === row.groupKey ? "bg-muted/40" : ""}
        onMouseEnter={() => onHoverGroup(row.groupKey)}
        onMouseLeave={() => {
          onHoverGroup(null);
          setConfirmUnmatch(false);
        }}
      >
        <td className="p-3 text-muted-foreground">
          {fmtDate(row.date)}
          {row.isNextMonth && (
            <span className="ml-1 text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">
              next mo.
            </span>
          )}
          {row.isPrevMonth && (
            <span className="ml-1 text-[10px] text-orange-600 dark:text-orange-400 font-medium">
              prev mo.
            </span>
          )}
        </td>
        <td className="p-3 text-right">
          {fmt$(row.sitelinkAmount)}
          {isAch && (
            <span className="ml-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              ACH
            </span>
          )}
        </td>
        <td className="p-3 text-right">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-4">
                {fmt$(row.bankAmount)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Bank transaction date: {fmtDateFull(row.bankDate)}
            </TooltipContent>
          </Tooltip>
        </td>
        <td
          className={`p-3 text-right hidden sm:table-cell ${hasDiff ? "text-destructive font-medium" : "text-muted-foreground/40"}`}
        >
          {hasDiff
            ? (row.diff > 0 ? "+" : "") + fmt$(row.diff)
            : "—"}
        </td>
        <td className="p-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {row.matchType === "automatic" ? "Auto" : "Matched"}
          </span>
        </td>
        {isEditable && (
          <td className="p-3 text-right whitespace-nowrap">
            {confirmUnmatch ? (
              <span className="inline-flex items-center gap-1">
                <button
                  onClick={() => onUnmatch(row.bankTransactionId, row.dailyPaymentId)}
                  disabled={isPending}
                  title={`Unmatch all ${row.groupSize} rows of this split match`}
                  className="rounded px-1.5 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  Unmatch {row.groupSize}
                </button>
                <button
                  onClick={() => setConfirmUnmatch(false)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <button
                onClick={() =>
                  row.groupSize > 1
                    ? setConfirmUnmatch(true)
                    : onUnmatch(row.bankTransactionId, row.dailyPaymentId)
                }
                disabled={isPending}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                title={
                  row.groupSize > 1
                    ? `Unmatch this split match (${row.groupSize} rows)`
                    : "Unmatch"
                }
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Unmatch</span>
              </button>
            )}
          </td>
        )}
      </tr>
    );
  }

  if (row.type === "sitelink_only") {
    const isSelected = selectedSitelinkIds.has(row.dailyPaymentId);
    const isAch = row.subType === "ach";
    return (
      <tr
        className={`transition-colors ${
          isSelected
            ? isAch ? "bg-indigo-100/60 dark:bg-indigo-900/20" : "bg-primary/10"
            : isAch ? "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10" : "hover:bg-muted/30"
        } ${isEditable ? "cursor-pointer" : ""}`}
        onClick={() => isEditable && onToggleSitelink(row.dailyPaymentId, row.subType, row.sitelinkAmount)}
      >
        <td className="p-3 text-muted-foreground">{fmtDate(row.date)}</td>
        <td className="p-3 text-right">
          <span className="font-medium">{fmt$(row.sitelinkAmount)}</span>
          {isAch && (
            <span className="ml-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              ACH
            </span>
          )}
        </td>
        <td className="p-3 text-right text-muted-foreground/30">—</td>
        <td className="p-3 text-right hidden sm:table-cell text-muted-foreground/30">—</td>
        <td className="p-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            SiteLink only
          </span>
        </td>
        {isEditable && <td className="p-3" />}
      </tr>
    );
  }

  // bank_only
  const isSelected = selectedBankIds.has(row.bankTransactionId);
  return (
    <tr
      className={`transition-colors ${
        isSelected ? "bg-primary/10" : "hover:bg-muted/30"
      } ${isEditable && !isEditingType ? "cursor-pointer" : ""}`}
      onClick={() => !isEditingType && isEditable && onToggleBank(row.bankTransactionId)}
    >
      <td className="p-3 text-muted-foreground">
        {fmtDate(row.date)}
        {row.isNextMonth && (
          <span className="ml-1 text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">
            next mo.
          </span>
        )}
      </td>
      <td className="p-3 text-right text-muted-foreground/30">—</td>
      <td className="p-3 text-right font-medium">{fmt$(row.bankAmount)}</td>
      <td className="p-3 text-right hidden sm:table-cell text-muted-foreground/30">—</td>
      <td className="p-3">
        {isEditable && isEditingType ? (
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <select
              autoFocus
              defaultValue={row.transactionType}
              onBlur={() => setIsEditingType(false)}
              onChange={(e) => {
                onRecategorize(row.bankTransactionId, e.target.value);
                setIsEditingType(false);
              }}
              className="text-xs rounded border border-input bg-background px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="cash">Cash / Check</option>
              <option value="creditCard">Credit Card</option>
              <option value="truck">Truck</option>
              <option value="other">Other</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {txnTypeLabel(row.transactionType)}
            </span>
            {isEditable && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingType(true); }}
                title="Change deposit type"
                className="text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </td>
      {isEditable && <td className="p-3" />}
    </tr>
  );
}

function TruckTable({
  rows,
  bankAccounts,
}: {
  rows: BankTransaction[];
  bankAccounts: BankAccount[];
}) {
  const fmt$ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  const total = rows.reduce((s, t) => s + t.transactionAmount, 0);

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 border-b">
            <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Account</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                No truck account transactions for this period.
              </td>
            </tr>
          ) : (
            rows.map((t, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="p-3 text-muted-foreground">{fmtDate(t.transactionDate)}</td>
                <td className="p-3 text-muted-foreground">
                  {bankAccounts.find((a) => a.bankAccountId === t.bankAccountId)?.bankName ?? "—"}
                </td>
                <td className="p-3 text-right font-medium">{fmt$(t.transactionAmount)}</td>
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-muted/40 border-t font-semibold">
              <td colSpan={2} className="p-3">Total</td>
              <td className="p-3 text-right">{fmt$(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
