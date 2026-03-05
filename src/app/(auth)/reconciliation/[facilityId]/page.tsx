import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  storageFacilities,
  bankAccount,
  monthlyReconciliation,
  bankTransaction,
  dailyPayments,
  transactionsToDailyPayments,
  dailyManagementPaymentReceipt,
} from "@/db/schema";
import { eq, and, sql, inArray, ne } from "drizzle-orm";
import { ReconciliationWorkspace } from "@/components/reconciliation/ReconciliationWorkspace";
import { MonthNav } from "@/components/reconciliation/MonthNav";

interface PageProps {
  params: Promise<{ facilityId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function FacilityReconciliationPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const userRole = session.user.role || "";
  if (!["ADMIN", "OWNER", "SUPERVISOR", "MANAGER"].includes(userRole))
    redirect("/unauthorized");

  const { facilityId } = await params;
  const sp = await searchParams;
  const now = new Date();
  const month = Math.min(
    12,
    Math.max(1, parseInt(sp.month || String(now.getMonth() + 1))),
  );
  const year = parseInt(sp.year || String(now.getFullYear()));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  // Month-end date (for daily payments — only fetch the current month)
  const monthEndDate = new Date(year, month, 0).toISOString().split("T")[0];
  // Extended end for bank transactions: +10 days to catch deposits that clear
  // in early next month (e.g. Jan 30 SiteLink → Feb 2 bank deposit)
  const extendedBankEnd = new Date(year, month, 10).toISOString().split("T")[0];
  // Keep endDate alias for existing code that uses it
  const endDate = monthEndDate;

  // Facility + bank accounts
  const facilityRows = await db
    .select({
      facilityName: storageFacilities.facilityName,
      bankAccountId: bankAccount.bankAccountId,
      bankName: bankAccount.bankName,
      depositType: bankAccount.depositType,
    })
    .from(storageFacilities)
    .innerJoin(
      bankAccount,
      eq(storageFacilities.sitelinkId, bankAccount.sitelinkId),
    )
    .where(
      and(
        eq(storageFacilities.sitelinkId, facilityId),
        eq(storageFacilities.currentClient, true),
      ),
    );

  if (facilityRows.length === 0) redirect("/reconciliation");

  const facilityName = facilityRows[0].facilityName;
  const bankAccounts = facilityRows.map((r) => ({
    bankAccountId: r.bankAccountId,
    bankName: r.bankName,
    depositType: r.depositType,
  }));
  const bankAccountIds = bankAccounts.map((a) => a.bankAccountId);

  // Monthly reconciliation record (if any)
  const recRows = await db
    .select({
      reconciliationId: monthlyReconciliation.reconciliationId,
      status: monthlyReconciliation.status,
      totalExpectedCashCheck: monthlyReconciliation.totalExpectedCashCheck,
      totalExpectedCreditCard: monthlyReconciliation.totalExpectedCreditCard,
      totalActualCashCheck: monthlyReconciliation.totalActualCashCheck,
      totalActualCreditCard: monthlyReconciliation.totalActualCreditCard,
      totalTransactionsMatched: monthlyReconciliation.totalTransactionsMatched,
      totalTransactionsUnmatched:
        monthlyReconciliation.totalTransactionsUnmatched,
      totalDiscrepancies: monthlyReconciliation.totalDiscrepancies,
      notes: monthlyReconciliation.notes,
    })
    .from(monthlyReconciliation)
    .where(
      and(
        eq(monthlyReconciliation.facilityId, facilityId),
        eq(monthlyReconciliation.reconciliationMonth, month),
        eq(monthlyReconciliation.reconciliationYear, year),
      ),
    );
  const recRow = recRows[0] ?? null;

  // Bank transactions: fetch current month + 10-day buffer into next month
  // so late-clearing deposits are visible in this reconciliation period
  const bankTxns =
    bankAccountIds.length > 0
      ? await db
          .select({
            bankTransactionId: bankTransaction.bankTransactionId,
            bankAccountId: bankTransaction.bankAccountId,
            transactionDate: bankTransaction.transactionDate,
            transactionType: bankTransaction.transactionType,
            transactionAmount: bankTransaction.transactionAmount,
          })
          .from(bankTransaction)
          .where(
            and(
              inArray(bankTransaction.bankAccountId, bankAccountIds),
              sql`${bankTransaction.transactionDate} >= ${startDate}`,
              sql`${bankTransaction.transactionDate} <= ${extendedBankEnd}`,
            ),
          )
          .orderBy(bankTransaction.transactionDate)
      : [];

  // Daily payments for the period
  const payments = await db
    .select({
      dailyPaymentId: dailyPayments.Id,
      date: dailyPayments.date,
      cash: dailyPayments.cash,
      check: dailyPayments.check,
      visa: dailyPayments.visa,
      mastercard: dailyPayments.mastercard,
      americanExpress: dailyPayments.americanExpress,
      discover: dailyPayments.discover,
      ach: dailyPayments.ach,
      dinersClub: dailyPayments.dinersClub,
      debit: dailyPayments.debit,
    })
    .from(dailyPayments)
    .where(
      and(
        eq(dailyPayments.facilityId, facilityId),
        sql`${dailyPayments.date} >= ${startDate}`,
        sql`${dailyPayments.date} <= ${endDate}`,
      ),
    )
    .orderBy(dailyPayments.date);

  // Existing matches for these bank transactions
  const bankTxnIds = bankTxns.map((t) => t.bankTransactionId);
  const matchRows =
    bankTxnIds.length > 0
      ? await db
          .select({
            bankTransactionId: transactionsToDailyPayments.bankTransactionId,
            dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
            amount: transactionsToDailyPayments.amount,
            connectionType: transactionsToDailyPayments.connectionType,
            depositDifference: transactionsToDailyPayments.depositDifference,
            matchType: transactionsToDailyPayments.matchType,
          })
          .from(transactionsToDailyPayments)
          .where(
            inArray(transactionsToDailyPayments.bankTransactionId, bankTxnIds),
          )
      : [];

  // Sundries: daily_management_payment_receipt rows on the last day of the month
  const sundriesRows = await db
    .select({
      description: dailyManagementPaymentReceipt.description,
      monthlyAmount: dailyManagementPaymentReceipt.monthlyAmount,
      sortId: dailyManagementPaymentReceipt.sortId,
    })
    .from(dailyManagementPaymentReceipt)
    .where(
      and(
        eq(dailyManagementPaymentReceipt.facilityId, facilityId),
        eq(dailyManagementPaymentReceipt.date, monthEndDate),
      ),
    )
    .orderBy(dailyManagementPaymentReceipt.sortId);

  const serializedSundries = sundriesRows.map((r) => ({
    description: r.description,
    monthlyAmount: parseFloat(r.monthlyAmount?.toString() ?? "0"),
  }));

  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Serialize numeric fields (Drizzle returns numeric columns as strings)
  // Tag transactions that fall after month-end (late-clearing deposits)
  const serializedBankTxns = bankTxns.map((t) => ({
    ...t,
    transactionAmount: parseFloat(t.transactionAmount?.toString() ?? "0"),
    isNextMonth: (t.transactionDate ?? "") > monthEndDate,
  }));

  const serializedPayments = payments.map((p) => ({
    dailyPaymentId: p.dailyPaymentId,
    date: p.date ?? "",
    cash: parseFloat(p.cash?.toString() ?? "0"),
    check: parseFloat(p.check?.toString() ?? "0"),
    visa: parseFloat(p.visa?.toString() ?? "0"),
    mastercard: parseFloat(p.mastercard?.toString() ?? "0"),
    americanExpress: parseFloat(p.americanExpress?.toString() ?? "0"),
    discover: parseFloat(p.discover?.toString() ?? "0"),
    ach: parseFloat(p.ach?.toString() ?? "0"),
    dinersClub: parseFloat(p.dinersClub?.toString() ?? "0"),
    debit: parseFloat(p.debit?.toString() ?? "0"),
  }));

  const serializedMatches = matchRows.map((m) => ({
    ...m,
    amount: parseFloat(m.amount?.toString() ?? "0"),
    depositDifference: parseFloat(m.depositDifference?.toString() ?? "0"),
  }));

  const serializedRec = recRow
    ? {
        reconciliationId: recRow.reconciliationId,
        status: recRow.status,
        totalExpectedCashCheck: parseFloat(
          recRow.totalExpectedCashCheck?.toString() ?? "0",
        ),
        totalExpectedCreditCard: parseFloat(
          recRow.totalExpectedCreditCard?.toString() ?? "0",
        ),
        totalActualCashCheck: parseFloat(
          recRow.totalActualCashCheck?.toString() ?? "0",
        ),
        totalActualCreditCard: parseFloat(
          recRow.totalActualCreditCard?.toString() ?? "0",
        ),
        totalTransactionsMatched: recRow.totalTransactionsMatched ?? 0,
        totalTransactionsUnmatched: recRow.totalTransactionsUnmatched ?? 0,
        totalDiscrepancies: recRow.totalDiscrepancies ?? 0,
        notes: recRow.notes,
      }
    : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{facilityName}</h1>
            <p className="text-primary-foreground/80 mt-0.5">
              Bank Reconciliation · {monthLabel}
              {bankAccounts.length > 0 &&
                ` · ${bankAccounts.map((a) => a.bankName).join(", ")}`}
            </p>
          </div>
          <MonthNav month={month} year={year} />
        </div>
      </div>

      <ReconciliationWorkspace
        facilityId={facilityId}
        facilityName={facilityName}
        month={month}
        year={year}
        bankAccounts={bankAccounts}
        reconciliation={serializedRec}
        bankTransactions={serializedBankTxns}
        dailyPayments={serializedPayments}
        matches={serializedMatches}
        sundries={serializedSundries}
        userId={session.user.id}
        userRole={userRole}
      />
    </div>
  );
}
