import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  storageFacilities,
  bankAccount,
  monthlyReconciliation,
  bankTransaction,
  reconciliationDiscrepancies,
} from "@/db/schema";
import { eq, and, sql, count, inArray } from "drizzle-orm";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonthNav } from "@/components/reconciliation/MonthNav";
import { Building2, ArrowRight } from "lucide-react";
import { pickFacilityReconciliation } from "./facilityReconciliation";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string; status?: string }>;
}

// "open" = anything not completed — the reconciliations that still need work
type StatusFilter = "all" | "open" | FacilityStatus;
const STATUS_FILTERS: StatusFilter[] = ["all", "open", "completed", "pending_review", "in_progress", "not_started"];

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

  const statusFilter: StatusFilter = STATUS_FILTERS.includes(sp.status as StatusFilter)
    ? (sp.status as StatusFilter)
    : "all";
  const filterHref = (status: StatusFilter) =>
    `/reconciliation?month=${month}&year=${year}${status === "all" ? "" : `&status=${status}`}`;

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
    // Match the facility page, which only opens current clients
    .where(eq(storageFacilities.currentClient, true))
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
      reconciliationId: monthlyReconciliation.reconciliationId,
      facilityId: monthlyReconciliation.facilityId,
      status: monthlyReconciliation.status,
      totalTransactionsMatched: monthlyReconciliation.totalTransactionsMatched,
    })
    .from(monthlyReconciliation)
    .where(
      and(
        eq(monthlyReconciliation.reconciliationMonth, month),
        eq(monthlyReconciliation.reconciliationYear, year),
      ),
    );

  // One row per bank account — pick the same representative as the facility page
  const recsByFacility = new Map<string, typeof recs>();
  for (const r of recs) {
    recsByFacility.set(r.facilityId, [...(recsByFacility.get(r.facilityId) ?? []), r]);
  }
  const recMap = new Map(
    [...recsByFacility].map(([id, rows]) => [id, pickFacilityReconciliation(rows)]),
  );

  // Pending discrepancies per facility, across all of its bank-account rows.
  // (monthly_reconciliation.total_discrepancies is never updated, so the badge
  // never showed.)
  const pendingDiscrepancies = await db
    .select({ facilityId: monthlyReconciliation.facilityId, total: count() })
    .from(reconciliationDiscrepancies)
    .innerJoin(
      monthlyReconciliation,
      eq(reconciliationDiscrepancies.reconciliationId, monthlyReconciliation.reconciliationId),
    )
    .where(
      and(
        eq(reconciliationDiscrepancies.status, "pending_approval"),
        eq(monthlyReconciliation.reconciliationMonth, month),
        eq(monthlyReconciliation.reconciliationYear, year),
      ),
    )
    .groupBy(monthlyReconciliation.facilityId);
  const pendingByFacility = new Map(
    pendingDiscrepancies.map((r) => [r.facilityId, Number(r.total)]),
  );

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
      discrepancies: pendingByFacility.get(f.facilityId) ?? 0,
      bankTxnCount,
    };
  });

  const counts = {
    completed: summaries.filter((s) => s.status === "completed").length,
    pendingReview: summaries.filter((s) => s.status === "pending_review").length,
    inProgress: summaries.filter((s) => s.status === "in_progress").length,
    notStarted: summaries.filter((s) => s.status === "not_started").length,
  };
  const openCount = summaries.length - counts.completed;

  const visible = summaries.filter((s) =>
    statusFilter === "all"
      ? true
      : statusFilter === "open"
        ? s.status !== "completed"
        : s.status === statusFilter,
  );

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
      {/* Stats — click to filter by that status, click again to clear */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            ["completed", counts.completed, "text-green-600"],
            ["pending_review", counts.pendingReview, "text-yellow-600 dark:text-yellow-400"],
            ["in_progress", counts.inProgress, "text-primary"],
            ["not_started", counts.notStarted, "text-muted-foreground"],
          ] as const
        ).map(([status, value, valueClass]) => (
          <StatCard
            key={status}
            label={STATUS_CONFIG[status].label}
            value={value}
            valueClass={valueClass}
            href={filterHref(statusFilter === status ? "all" : status)}
            active={statusFilter === status}
          />
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Show:</span>
        <div className="inline-flex rounded-md border p-0.5">
          {(
            [
              ["all", `All (${summaries.length})`],
              ["open", `Not done (${openCount})`],
            ] as const
          ).map(([value, label]) => (
            <Link
              key={value}
              href={filterHref(value)}
              className={`rounded px-3 py-1 transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        {statusFilter !== "all" && statusFilter !== "open" && (
          <span className="text-muted-foreground">
            Showing {STATUS_CONFIG[statusFilter].label} only ·{" "}
            <Link href={filterHref("all")} className="text-primary hover:underline">
              Clear
            </Link>
          </span>
        )}
      </div>

      {/* Facility list */}
      <div className="border rounded-lg divide-y">
        {summaries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No facilities with bank accounts configured.
          </div>
        ) : visible.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            {statusFilter === "open"
              ? `All ${monthLabel} reconciliations are complete.`
              : `No ${STATUS_CONFIG[statusFilter as FacilityStatus].label.toLowerCase()} reconciliations for ${monthLabel}.`}
          </div>
        ) : (
          visible.map((f) => {
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

                {/* Styled Link rather than <Button asChild>: Radix Slot renders
                    nothing when RSC hands it a lazy child, which silently
                    dropped the button for some rows. */}
                <Link
                  href={`/reconciliation/${f.facilityId}?month=${month}&year=${year}`}
                  className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
                >
                  {f.status === "not_started" ? "Start" : "Open"}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
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
  href,
  active,
}: {
  label: string;
  value: number;
  valueClass: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`border rounded-lg p-4 transition-colors hover:bg-muted/40 ${
        active ? "ring-2 ring-primary border-primary" : ""
      }`}
    >
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </Link>
  );
}
