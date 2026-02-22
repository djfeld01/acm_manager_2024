import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  storageFacilities,
  bankAccount,
  monthlyReconciliation,
  bankTransaction,
} from "@/db/schema";
import { eq, and, sql, count, inArray } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonthNav } from "@/components/reconciliation/MonthNav";
import { Building2, ArrowRight } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

type FacilityStatus = "completed" | "pending_review" | "in_progress" | "not_started";

const STATUS_CONFIG: Record<FacilityStatus, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  pending_review: { label: "Pending Review", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  in_progress: { label: "In Progress", cls: "bg-primary/10 text-primary" },
  not_started: { label: "Not Started", cls: "bg-muted text-muted-foreground" },
};

export default async function ReconciliationPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const userRole = session.user.role || "";
  if (!["ADMIN", "OWNER", "SUPERVISOR"].includes(userRole)) redirect("/unauthorized");

  const sp = await searchParams;
  const now = new Date();
  const month = Math.min(12, Math.max(1, parseInt(sp.month || String(now.getMonth() + 1))));
  const year = parseInt(sp.year || String(now.getFullYear()));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  // Fetch all facilities with bank accounts
  const rows = await db
    .select({
      facilityId: storageFacilities.sitelinkId,
      facilityName: storageFacilities.facilityName,
      bankAccountId: bankAccount.bankAccountId,
      bankName: bankAccount.bankName,
    })
    .from(storageFacilities)
    .innerJoin(bankAccount, eq(storageFacilities.sitelinkId, bankAccount.sitelinkId))
    .orderBy(storageFacilities.facilityName);

  // Group by facility
  type FacilityInfo = {
    facilityId: string;
    facilityName: string;
    bankAccountIds: number[];
    bankNames: string[];
  };

  const facilityMap = new Map<string, FacilityInfo>();
  for (const row of rows) {
    if (!facilityMap.has(row.facilityId)) {
      facilityMap.set(row.facilityId, {
        facilityId: row.facilityId,
        facilityName: row.facilityName,
        bankAccountIds: [],
        bankNames: [],
      });
    }
    const f = facilityMap.get(row.facilityId)!;
    f.bankAccountIds.push(row.bankAccountId);
    if (!f.bankNames.includes(row.bankName)) f.bankNames.push(row.bankName);
  }

  const facilities = Array.from(facilityMap.values());

  // Reconciliation records for this month/year
  const recs = await db
    .select({
      facilityId: monthlyReconciliation.facilityId,
      status: monthlyReconciliation.status,
      totalTransactionsMatched: monthlyReconciliation.totalTransactionsMatched,
      totalDiscrepancies: monthlyReconciliation.totalDiscrepancies,
    })
    .from(monthlyReconciliation)
    .where(
      and(
        eq(monthlyReconciliation.reconciliationMonth, month),
        eq(monthlyReconciliation.reconciliationYear, year),
      ),
    );

  const recMap = new Map(recs.map((r) => [r.facilityId, r]));

  // Bank transaction counts grouped by account
  const allBankAccountIds = facilities.flatMap((f) => f.bankAccountIds);
  const txnCounts =
    allBankAccountIds.length > 0
      ? await db
          .select({ bankAccountId: bankTransaction.bankAccountId, total: count() })
          .from(bankTransaction)
          .where(
            and(
              inArray(bankTransaction.bankAccountId, allBankAccountIds),
              sql`${bankTransaction.transactionDate} >= ${startDate}`,
              sql`${bankTransaction.transactionDate} <= ${endDate}`,
            ),
          )
          .groupBy(bankTransaction.bankAccountId)
      : [];

  const txnCountByAccount = new Map(txnCounts.map((r) => [r.bankAccountId, r.total]));

  // Build summaries
  const summaries = facilities.map((f) => {
    const rec = recMap.get(f.facilityId);
    const bankTxnCount = f.bankAccountIds.reduce(
      (sum, id) => sum + Number(txnCountByAccount.get(id) ?? 0),
      0,
    );
    return {
      ...f,
      status: (rec?.status ?? "not_started") as FacilityStatus,
      matched: rec?.totalTransactionsMatched ?? 0,
      discrepancies: rec?.totalDiscrepancies ?? 0,
      bankTxnCount,
    };
  });

  const counts = {
    completed: summaries.filter((s) => s.status === "completed").length,
    pendingReview: summaries.filter((s) => s.status === "pending_review").length,
    inProgress: summaries.filter((s) => s.status === "in_progress").length,
    notStarted: summaries.filter((s) => s.status === "not_started").length,
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
            <p className="text-primary-foreground/80 mt-0.5">{monthLabel}</p>
          </div>
          <MonthNav month={month} year={year} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Completed" value={counts.completed} valueClass="text-green-600" />
        <StatCard label="Pending Review" value={counts.pendingReview} valueClass="text-yellow-600 dark:text-yellow-400" />
        <StatCard label="In Progress" value={counts.inProgress} valueClass="text-primary" />
        <StatCard label="Not Started" value={counts.notStarted} valueClass="text-muted-foreground" />
      </div>

      {/* Facility list */}
      <div className="border rounded-lg divide-y">
        {summaries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No facilities with bank accounts configured.
          </div>
        ) : (
          summaries.map((f) => {
            const cfg = STATUS_CONFIG[f.status];
            return (
              <div
                key={f.facilityId}
                className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
              >
                <Building2 className="h-8 w-8 text-muted-foreground/50 shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{f.facilityName}</span>
                    <Badge className={cfg.cls}>{cfg.label}</Badge>
                    {f.discrepancies > 0 && (
                      <Badge className="bg-destructive/10 text-destructive">
                        {f.discrepancies} {f.discrepancies === 1 ? "discrepancy" : "discrepancies"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                    <span>{f.bankNames.join(", ")}</span>
                    {f.bankTxnCount > 0 && (
                      <span>{f.bankTxnCount} bank transactions</span>
                    )}
                    {f.matched > 0 && <span>{f.matched} matched</span>}
                  </div>
                </div>

                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <Link href={`/reconciliation/${f.facilityId}?month=${month}&year=${year}`}>
                    {f.status === "not_started" ? "Start" : "Open"}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
