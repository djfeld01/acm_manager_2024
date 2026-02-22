"use client";

import { useState } from "react";
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
} from "lucide-react";

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

// ─── Row types for the matching table ──────────────────────────────────────

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
};

type TableRow = MatchedRow | SitelinkOnlyRow | BankOnlyRow;

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ccTotal(p: DailyPayment) {
  return p.visa + p.mastercard + p.americanExpress + p.discover + p.ach + p.dinersClub + p.debit;
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

  // Matched pairs
  for (const match of tabMatches) {
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

  // Unmatched bank transactions (for this tab's type)
  for (const t of bankTxns) {
    if (matchedBankIds.has(t.bankTransactionId)) continue;
    if (t.transactionType !== txnType) continue;
    rows.push({
      type: "bank_only",
      date: t.transactionDate,
      bankAmount: t.transactionAmount,
      bankTransactionId: t.bankTransactionId,
    });
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS = {
  in_progress: { label: "In Progress", cls: "bg-primary/10 text-primary" },
  pending_review: { label: "Pending Review", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  completed: { label: "Completed", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive" },
} as const;

// ─── Main component ────────────────────────────────────────────────────────

export function ReconciliationWorkspace({
  facilityId,
  month,
  year,
  bankAccounts,
  reconciliation,
  bankTransactions,
  dailyPayments,
  matches,
}: ReconciliationWorkspaceProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"cash" | "credit">("cash");
  const [selectedSitelinkId, setSelectedSitelinkId] = useState<number | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cashRows = buildRows(dailyPayments, bankTransactions, matches, "cash");
  const creditRows = buildRows(dailyPayments, bankTransactions, matches, "credit");
  const currentRows = tab === "cash" ? cashRows : creditRows;

  const totalSitelink = {
    cash: dailyPayments.reduce((s, p) => s + p.cash + p.check, 0),
    credit: dailyPayments.reduce((s, p) => s + ccTotal(p), 0),
  };
  const totalBank = {
    cash: bankTransactions.filter((t) => t.transactionType === "cash").reduce((s, t) => s + t.transactionAmount, 0),
    credit: bankTransactions.filter((t) => t.transactionType === "creditCard").reduce((s, t) => s + t.transactionAmount, 0),
  };

  const clearSelection = () => {
    setSelectedSitelinkId(null);
    setSelectedBankId(null);
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      for (const account of bankAccounts) {
        const res = await fetch("/api/reconciliation/auto-match/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facilityId, bankAccountId: account.bankAccountId, month, year }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Auto-match failed");
        }
      }
      clearSelection();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedSitelinkId || !selectedBankId) return;
    setLoading(true);
    setError(null);
    try {
      const payment = dailyPayments.find((p) => p.dailyPaymentId === selectedSitelinkId);
      const txn = bankTransactions.find((t) => t.bankTransactionId === selectedBankId);
      if (!payment || !txn) throw new Error("Selection not found");

      const connectionType = tab === "cash" ? "cash" : "creditCard";
      const amount = tab === "cash" ? payment.cash + payment.check : ccTotal(payment);

      const res = await fetch("/api/reconciliation/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankTransactionId: selectedBankId, dailyPaymentId: selectedSitelinkId, connectionType, amount }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Match failed");
      }
      clearSelection();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ── Not started ──────────────────────────────────────────────────────────

  if (!reconciliation) {
    const cashDiff = totalBank.cash - totalSitelink.cash;
    const creditDiff = totalBank.credit - totalSitelink.credit;
    return (
      <div className="space-y-6">
        <div className="border rounded-lg p-8 text-center space-y-6">
          <div>
            <CircleDashed className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">Reconciliation Not Started</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {bankTransactions.length} bank transactions · {dailyPayments.length} SiteLink daily payments
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
            <PreviewCard label="SiteLink Cash / Check" value={fmt$(totalSitelink.cash)} />
            <PreviewCard label="Bank Cash Deposits" value={fmt$(totalBank.cash)} diff={cashDiff} />
            <PreviewCard label="SiteLink Credit Card" value={fmt$(totalSitelink.credit)} />
            <PreviewCard label="Bank CC Deposits" value={fmt$(totalBank.credit)} diff={creditDiff} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleStart} disabled={loading} size="lg">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Reconciliation
          </Button>
        </div>
      </div>
    );
  }

  // ── In progress / review / completed ─────────────────────────────────────

  const statusCfg = STATUS[reconciliation.status as keyof typeof STATUS] ?? {
    label: reconciliation.status,
    cls: "bg-muted text-muted-foreground",
  };
  const isEditable = reconciliation.status === "in_progress";

  const totalMatched = matches.length;
  const totalRows = currentRows.length;
  const unmatchedInTab = currentRows.filter((r) => r.type !== "matched").length;

  return (
    <div className="space-y-4">

      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge className={statusCfg.cls}>{statusCfg.label}</Badge>
          <span className="text-sm text-muted-foreground">
            {totalMatched} matched · {unmatchedInTab} unmatched in view
          </span>
        </div>
        <div className="flex gap-2">
          {isEditable && (
            <Button variant="outline" size="sm" onClick={handleAutoMatch} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="mr-1.5 h-3.5 w-3.5" />
              )}
              Auto-match
            </Button>
          )}
          {isEditable && selectedSitelinkId && selectedBankId && (
            <Button size="sm" onClick={handleMatch} disabled={loading}>
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              Match Selected
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Totals row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="SiteLink Cash / Check" value={fmt$(totalSitelink.cash)} />
        <SummaryCard label="Bank Cash Deposits" value={fmt$(totalBank.cash)} diff={totalBank.cash - totalSitelink.cash} />
        <SummaryCard label="SiteLink Credit Card" value={fmt$(totalSitelink.credit)} />
        <SummaryCard label="Bank CC Deposits" value={fmt$(totalBank.credit)} diff={totalBank.credit - totalSitelink.credit} />
      </div>

      {/* Tab + Table */}
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
            {cashRows.filter((r) => r.type !== "matched").length > 0 && (
              <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-800 rounded-full px-1.5 py-0.5 dark:bg-yellow-900/30 dark:text-yellow-400">
                {cashRows.filter((r) => r.type !== "matched").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="credit">
            Credit Card
            {creditRows.filter((r) => r.type !== "matched").length > 0 && (
              <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-800 rounded-full px-1.5 py-0.5 dark:bg-yellow-900/30 dark:text-yellow-400">
                {creditRows.filter((r) => r.type !== "matched").length}
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
                <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">Diff</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                    No transactions for this period.
                  </td>
                </tr>
              ) : (
                currentRows.map((row, i) => (
                  <MatchRow
                    key={i}
                    row={row}
                    selectedSitelinkId={selectedSitelinkId}
                    selectedBankId={selectedBankId}
                    onSelectSitelink={isEditable ? setSelectedSitelinkId : undefined}
                    onSelectBank={isEditable ? setSelectedBankId : undefined}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Tabs>

      {/* Helper text */}
      {isEditable && (
        <p className="text-xs text-muted-foreground">
          {!selectedSitelinkId && !selectedBankId &&
            'Click a "SiteLink only" row to select it, then click the matching bank row, then click "Match Selected".'}
          {selectedSitelinkId && !selectedBankId &&
            "SiteLink payment selected — now click the matching bank deposit row."}
          {selectedSitelinkId && selectedBankId &&
            'Both sides selected — click "Match Selected" to confirm.'}
        </p>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function PreviewCard({ label, value, diff }: { label: string; value: string; diff?: number }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
      {diff !== undefined && Math.abs(diff) > 0.01 && (
        <div className={`text-xs mt-0.5 ${diff < 0 ? "text-destructive" : "text-green-600"}`}>
          {diff > 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(diff)}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, diff }: { label: string; value: string; diff?: number }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
      {diff !== undefined && Math.abs(diff) > 0.01 && (
        <div className={`text-xs mt-0.5 font-medium ${diff < 0 ? "text-destructive" : "text-green-600"}`}>
          {diff > 0 ? "+" : ""}
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(diff)} vs SiteLink
        </div>
      )}
    </div>
  );
}

function MatchRow({
  row,
  selectedSitelinkId,
  selectedBankId,
  onSelectSitelink,
  onSelectBank,
}: {
  row: TableRow;
  selectedSitelinkId: number | null;
  selectedBankId: number | null;
  onSelectSitelink?: (id: number | null) => void;
  onSelectBank?: (id: number | null) => void;
}) {
  if (row.type === "matched") {
    const hasDiff = Math.abs(row.diff) > 0.01;
    return (
      <tr className="hover:bg-muted/20">
        <td className="p-3 text-muted-foreground">{fmtDate(row.date)}</td>
        <td className="p-3 text-right">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.sitelinkAmount)}</td>
        <td className="p-3 text-right">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.bankAmount)}</td>
        <td className={`p-3 text-right hidden sm:table-cell ${hasDiff ? "text-destructive font-medium" : "text-muted-foreground/50"}`}>
          {hasDiff ? (row.diff > 0 ? "+" : "") + new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.diff) : "—"}
        </td>
        <td className="p-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {row.matchType === "automatic" ? "Auto" : "Matched"}
          </span>
        </td>
      </tr>
    );
  }

  if (row.type === "sitelink_only") {
    const isSelected = selectedSitelinkId === row.dailyPaymentId;
    return (
      <tr
        className={`transition-colors ${
          isSelected ? "bg-primary/10" : "hover:bg-muted/30"
        } ${onSelectSitelink ? "cursor-pointer" : ""}`}
        onClick={() => onSelectSitelink?.(isSelected ? null : row.dailyPaymentId)}
      >
        <td className="p-3 text-muted-foreground">{fmtDate(row.date)}</td>
        <td className="p-3 text-right font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.sitelinkAmount)}</td>
        <td className="p-3 text-right text-muted-foreground/40">—</td>
        <td className="p-3 text-right hidden sm:table-cell text-muted-foreground/40">—</td>
        <td className="p-3 text-center">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            SiteLink only
          </span>
        </td>
      </tr>
    );
  }

  // bank_only
  const isSelected = selectedBankId === row.bankTransactionId;
  return (
    <tr
      className={`transition-colors ${
        isSelected ? "bg-primary/10" : "hover:bg-muted/30"
      } ${onSelectBank ? "cursor-pointer" : ""}`}
      onClick={() => onSelectBank?.(isSelected ? null : row.bankTransactionId)}
    >
      <td className="p-3 text-muted-foreground">{fmtDate(row.date)}</td>
      <td className="p-3 text-right text-muted-foreground/40">—</td>
      <td className="p-3 text-right font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.bankAmount)}</td>
      <td className="p-3 text-right hidden sm:table-cell text-muted-foreground/40">—</td>
      <td className="p-3 text-center">
        <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Bank only
        </span>
      </td>
    </tr>
  );
}
