"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import {
  autoMatchAction,
  createMatchesAction,
  createMatchWithDiscrepancyAction,
  unmatchAction,
  submitForReviewAction,
  markCompleteAction,
  requestChangesAction,
  approveDiscrepancyAction,
  rejectDiscrepancyAction,
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
  userId: string;
  userRole: string;
}

// ─── Row types ──────────────────────────────────────────────────────────────

type MatchedRow = {
  type: "matched";
  date: string;
  sitelinkAmount: number;
  bankAmount: number;
  bankTransactionId: number;
  dailyPaymentId: number;
  connectionType: string;
  matchType: string;
  diff: number;
  isNextMonth?: boolean;
};

type SitelinkOnlyRow = {
  type: "sitelink_only";
  date: string;
  sitelinkAmount: number;
  dailyPaymentId: number;
};

type BankOnlyRow = {
  type: "bank_only";
  date: string;
  bankAmount: number;
  bankTransactionId: number;
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

function ccTotal(p: DailyPayment) {
  return (
    p.visa + p.mastercard + p.americanExpress + p.discover + p.ach + p.dinersClub + p.debit
  );
}

function buildRows(
  payments: DailyPayment[],
  bankTxns: BankTransaction[],
  allMatches: Match[],
  tab: "cash" | "credit",
): TableRow[] {
  const connType = tab === "cash" ? "cash" : "creditCard";
  const txnType = tab === "cash" ? "cash" : "creditCard";

  const tabMatches = allMatches.filter((m) => m.connectionType === connType);
  const matchedBankIds = new Set(allMatches.map((m) => m.bankTransactionId));
  const matchedPaymentIds = new Set(tabMatches.map((m) => m.dailyPaymentId));

  const rows: TableRow[] = [];

  // Matched pairs — deduplicated on (bankTransactionId, dailyPaymentId)
  const seenPairs = new Set<string>();
  for (const match of tabMatches) {
    const key = `${match.bankTransactionId}-${match.dailyPaymentId}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);

    const payment = payments.find((p) => p.dailyPaymentId === match.dailyPaymentId);
    const txn = bankTxns.find((t) => t.bankTransactionId === match.bankTransactionId);
    if (!payment || !txn) continue;

    const sitelinkAmount = tab === "cash" ? payment.cash + payment.check : ccTotal(payment);
    rows.push({
      type: "matched",
      date: payment.date || txn.transactionDate,
      sitelinkAmount,
      bankAmount: txn.transactionAmount,
      bankTransactionId: match.bankTransactionId,
      dailyPaymentId: match.dailyPaymentId,
      connectionType: connType,
      matchType: match.matchType,
      diff: txn.transactionAmount - sitelinkAmount,
      isNextMonth: txn.isNextMonth,
    });
  }

  // Unmatched SiteLink payments
  for (const p of payments) {
    if (matchedPaymentIds.has(p.dailyPaymentId)) continue;
    const amount = tab === "cash" ? p.cash + p.check : ccTotal(p);
    if (amount === 0) continue;
    rows.push({
      type: "sitelink_only",
      date: p.date,
      sitelinkAmount: amount,
      dailyPaymentId: p.dailyPaymentId,
    });
  }

  // Unmatched bank transactions for this tab's type
  for (const t of bankTxns) {
    if (matchedBankIds.has(t.bankTransactionId)) continue;
    if (t.transactionType !== txnType) continue;
    rows.push({
      type: "bank_only",
      date: t.transactionDate,
      bankAmount: t.transactionAmount,
      bankTransactionId: t.bankTransactionId,
      isNextMonth: t.isNextMonth,
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
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
  userRole,
}: ReconciliationWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"cash" | "credit">("cash");

  // Multi-select: sets of selected IDs
  const [selectedSitelinkIds, setSelectedSitelinkIds] = useState<Set<number>>(new Set());
  const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(new Set());

  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Discrepancy form state
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState(false);
  const [discrepancyType, setDiscrepancyType] = useState<DiscrepancyType>("other");
  const [discrepancyNote, setDiscrepancyNote] = useState("");

  // Finalization state
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const cashRows = buildRows(dailyPayments, bankTransactions, matches, "cash");
  const creditRows = buildRows(dailyPayments, bankTransactions, matches, "credit");
  const currentRows = tab === "cash" ? cashRows : creditRows;

  // Running totals for selection
  const selectedSitelinkTotal = Array.from(selectedSitelinkIds).reduce((sum, id) => {
    const p = dailyPayments.find((p) => p.dailyPaymentId === id);
    if (!p) return sum;
    return sum + (tab === "cash" ? p.cash + p.check : ccTotal(p));
  }, 0);

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

  const totalSitelink = {
    cash: dailyPayments.reduce((s, p) => s + p.cash + p.check, 0),
    credit: dailyPayments.reduce((s, p) => s + ccTotal(p), 0),
  };
  const totalBank = {
    cash: bankTransactions
      .filter((t) => t.transactionType === "cash")
      .reduce((s, t) => s + t.transactionAmount, 0),
    credit: bankTransactions
      .filter((t) => t.transactionType === "creditCard")
      .reduce((s, t) => s + t.transactionAmount, 0),
  };

  const clearSelection = () => {
    setSelectedSitelinkIds(new Set());
    setSelectedBankIds(new Set());
    setShowDiscrepancyForm(false);
    setDiscrepancyNote("");
    setDiscrepancyType("other");
    setError(null);
  };

  const toggleSitelink = (id: number) => {
    setError(null);
    setLastResult(null);
    setSelectedSitelinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
            ? `Auto-match created ${result.matched} match${result.matched === 1 ? "" : "es"}.`
            : "No new automatic matches found.",
        );
        clearSelection();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Auto-match failed");
      }
    });
  };

  const handleMatch = () => {
    if (!selectionBalances) return;
    setError(null);
    setLastResult(null);

    const bankIds = Array.from(selectedBankIds);
    const sitelinkIds = Array.from(selectedSitelinkIds);
    const connType = tab === "cash" ? "cash" : "creditCard";

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
        await createMatchesAction(bankIds, sitelinkIds, connType, facilityId);
        clearSelection();
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
    const connType = tab === "cash" ? "cash" : "creditCard";

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
        );
        clearSelection();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Match failed");
      }
    });
  };

  const handleUnmatch = (bankTransactionId: number, dailyPaymentId: number) => {
    setError(null);
    startTransition(async () => {
      try {
        await unmatchAction(bankTransactionId, dailyPaymentId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unmatch failed");
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
          <SummaryCard label="SiteLink Cash / Check" value={fmt$(totalSitelink.cash)} />
          <SummaryCard label="Bank Cash Deposits" value={fmt$(totalBank.cash)} diff={cashDiff} />
          <SummaryCard label="SiteLink Credit Card" value={fmt$(totalSitelink.credit)} />
          <SummaryCard
            label="Bank CC Deposits"
            value={fmt$(totalBank.credit)}
            diff={creditDiff}
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
            <span className="text-sm text-muted-foreground">{lastResult}</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {isEditable && (
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
          {isEditable && selectedSitelinkIds.size > 0 && selectedBankIds.size > 0 && (
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
      {isEditable && (selectedSitelinkIds.size > 0 || selectedBankIds.size > 0) && (
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
      {isEditable && showDiscrepancyForm && (
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
        <SummaryCard label="SiteLink Cash / Check" value={fmt$(totalSitelink.cash)} />
        <SummaryCard
          label="Bank Cash Deposits"
          value={fmt$(totalBank.cash)}
          diff={totalBank.cash - totalSitelink.cash}
        />
        <SummaryCard label="SiteLink Credit Card" value={fmt$(totalSitelink.credit)} />
        <SummaryCard
          label="Bank CC Deposits"
          value={fmt$(totalBank.credit)}
          diff={totalBank.credit - totalSitelink.credit}
        />
      </div>

      {/* Tabs + table */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "cash" | "credit");
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
        </TabsList>

        <div className="mt-4 border rounded-lg overflow-hidden">
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
                {isEditable && (
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
                currentRows.map((row, i) => (
                  <MatchRow
                    key={i}
                    row={row}
                    isEditable={isEditable}
                    selectedSitelinkIds={selectedSitelinkIds}
                    selectedBankIds={selectedBankIds}
                    onToggleSitelink={toggleSitelink}
                    onToggleBank={toggleBank}
                    onUnmatch={handleUnmatch}
                    isPending={isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Tabs>

      {/* Helper text */}
      {isEditable && selectedSitelinkIds.size === 0 && selectedBankIds.size === 0 && (
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
}: {
  label: string;
  value: string;
  diff?: number;
}) {
  const fmt$ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
      {diff !== undefined && Math.abs(diff) > 0.01 && (
        <div
          className={`text-xs mt-0.5 font-medium ${diff < 0 ? "text-destructive" : "text-green-600"}`}
        >
          {diff > 0 ? "+" : ""}
          {fmt$(diff)} vs SiteLink
        </div>
      )}
    </div>
  );
}

function MatchRow({
  row,
  isEditable,
  selectedSitelinkIds,
  selectedBankIds,
  onToggleSitelink,
  onToggleBank,
  onUnmatch,
  isPending,
}: {
  row: TableRow;
  isEditable: boolean;
  selectedSitelinkIds: Set<number>;
  selectedBankIds: Set<number>;
  onToggleSitelink: (id: number) => void;
  onToggleBank: (id: number) => void;
  onUnmatch: (bankId: number, paymentId: number) => void;
  isPending: boolean;
}) {
  const fmt$ = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  if (row.type === "matched") {
    const hasDiff = Math.abs(row.diff) > 0.01;
    return (
      <tr className="hover:bg-muted/20 group">
        <td className="p-3 text-muted-foreground">
          {fmtDate(row.date)}
          {row.isNextMonth && (
            <span className="ml-1 text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">
              next mo.
            </span>
          )}
        </td>
        <td className="p-3 text-right">{fmt$(row.sitelinkAmount)}</td>
        <td className="p-3 text-right">{fmt$(row.bankAmount)}</td>
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
          <td className="p-3 text-center">
            <button
              onClick={() => onUnmatch(row.bankTransactionId, row.dailyPaymentId)}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-destructive"
              title="Remove match"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </td>
        )}
      </tr>
    );
  }

  if (row.type === "sitelink_only") {
    const isSelected = selectedSitelinkIds.has(row.dailyPaymentId);
    return (
      <tr
        className={`transition-colors ${
          isSelected ? "bg-primary/10" : "hover:bg-muted/30"
        } ${isEditable ? "cursor-pointer" : ""}`}
        onClick={() => isEditable && onToggleSitelink(row.dailyPaymentId)}
      >
        <td className="p-3 text-muted-foreground">{fmtDate(row.date)}</td>
        <td className="p-3 text-right font-medium">{fmt$(row.sitelinkAmount)}</td>
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
      } ${isEditable ? "cursor-pointer" : ""}`}
      onClick={() => isEditable && onToggleBank(row.bankTransactionId)}
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
      <td className="p-3 text-center">
        <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Bank only
        </span>
      </td>
      {isEditable && <td className="p-3" />}
    </tr>
  );
}
