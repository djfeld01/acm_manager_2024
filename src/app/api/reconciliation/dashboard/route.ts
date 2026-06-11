import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  monthlyReconciliation,
  storageFacilities,
  bankAccount,
  transactionsToDailyPayments,
  bankTransaction,
  dailyPayments,
  reconciliationDiscrepancies,
} from "@/db/schema";
import { eq, and, sql, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has appropriate role
    const userRole = session.user.role || "";
    if (!["ADMIN", "OWNER", "SUPERVISOR"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid month or year" },
        { status: 400 }
      );
    }

    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    // Single query: all facilities + bank accounts
    const facilitiesWithBankAccounts = await db
      .select({
        facilityId: storageFacilities.sitelinkId,
        facilityName: storageFacilities.facilityName,
        bankAccountId: bankAccount.bankAccountId,
      })
      .from(storageFacilities)
      .innerJoin(
        bankAccount,
        eq(storageFacilities.sitelinkId, bankAccount.sitelinkId)
      );

    // Group by facility in JS
    const facilitiesMap = new Map<
      string,
      { facilityId: string; facilityName: string; bankAccountIds: number[] }
    >();
    for (const item of facilitiesWithBankAccounts) {
      if (!facilitiesMap.has(item.facilityId)) {
        facilitiesMap.set(item.facilityId, {
          facilityId: item.facilityId,
          facilityName: item.facilityName,
          bankAccountIds: [],
        });
      }
      facilitiesMap.get(item.facilityId)!.bankAccountIds.push(item.bankAccountId);
    }
    const facilities = Array.from(facilitiesMap.values());
    const allFacilityIds = facilities.map((f) => f.facilityId);
    const allBankAccountIds = facilitiesWithBankAccounts.map((r) => r.bankAccountId);

    // Single query: all reconciliations for this month across all facilities
    const allReconciliations =
      allFacilityIds.length > 0
        ? await db
            .select({
              reconciliationId: monthlyReconciliation.reconciliationId,
              facilityId: monthlyReconciliation.facilityId,
              status: monthlyReconciliation.status,
              createdAt: monthlyReconciliation.createdAt,
              totalExpectedCashCheck: monthlyReconciliation.totalExpectedCashCheck,
              totalActualCashCheck: monthlyReconciliation.totalActualCashCheck,
              totalExpectedCreditCard: monthlyReconciliation.totalExpectedCreditCard,
              totalActualCreditCard: monthlyReconciliation.totalActualCreditCard,
              totalTransactionsMatched: monthlyReconciliation.totalTransactionsMatched,
              totalTransactionsUnmatched: monthlyReconciliation.totalTransactionsUnmatched,
              totalDiscrepancies: monthlyReconciliation.totalDiscrepancies,
              bankAccountId: monthlyReconciliation.bankAccountId,
            })
            .from(monthlyReconciliation)
            .where(
              and(
                sql`${monthlyReconciliation.facilityId} = ANY(ARRAY[${sql.join(allFacilityIds.map((id) => sql`${id}`), sql`, `)}])`,
                eq(monthlyReconciliation.reconciliationMonth, month),
                eq(monthlyReconciliation.reconciliationYear, year)
              )
            )
        : [];

    // Single query: bank transaction counts grouped by bank account
    const bankTxnCountRows =
      allBankAccountIds.length > 0
        ? await db
            .select({
              bankAccountId: bankTransaction.bankAccountId,
              txnCount: count(),
            })
            .from(bankTransaction)
            .where(
              and(
                sql`${bankTransaction.bankAccountId} = ANY(ARRAY[${sql.join(allBankAccountIds.map((id) => sql`${id}`), sql`, `)}])`,
                sql`${bankTransaction.transactionDate} >= ${startDate}`,
                sql`${bankTransaction.transactionDate} <= ${endDate}`
              )
            )
            .groupBy(bankTransaction.bankAccountId)
        : [];

    // Single query: daily payment totals grouped by facility
    const dailyPaymentTotalRows =
      allFacilityIds.length > 0
        ? await db
            .select({
              facilityId: dailyPayments.facilityId,
              totalCash: sql<number>`COALESCE(SUM(COALESCE(${dailyPayments.cash}, 0) + COALESCE(${dailyPayments.check}, 0)), 0)`,
              totalCreditCard: sql<number>`COALESCE(SUM(
                COALESCE(${dailyPayments.visa}, 0) +
                COALESCE(${dailyPayments.mastercard}, 0) +
                COALESCE(${dailyPayments.americanExpress}, 0) +
                COALESCE(${dailyPayments.discover}, 0) +
                COALESCE(${dailyPayments.ach}, 0) +
                COALESCE(${dailyPayments.dinersClub}, 0) +
                COALESCE(${dailyPayments.debit}, 0)
              ), 0)`,
            })
            .from(dailyPayments)
            .where(
              and(
                sql`${dailyPayments.facilityId} = ANY(ARRAY[${sql.join(allFacilityIds.map((id) => sql`${id}`), sql`, `)}])`,
                sql`${dailyPayments.date} >= ${startDate}`,
                sql`${dailyPayments.date} <= ${endDate}`
              )
            )
            .groupBy(dailyPayments.facilityId)
        : [];

    // Index lookup maps built from the batched results
    const reconsByFacility = new Map<string, typeof allReconciliations>();
    for (const rec of allReconciliations) {
      if (!reconsByFacility.has(rec.facilityId!)) {
        reconsByFacility.set(rec.facilityId!, []);
      }
      reconsByFacility.get(rec.facilityId!)!.push(rec);
    }

    const bankTxnCountByAccountId = new Map<number, number>();
    for (const row of bankTxnCountRows) {
      bankTxnCountByAccountId.set(row.bankAccountId!, Number(row.txnCount));
    }

    const dailyPaymentTotalByFacility = new Map<
      string,
      { totalCash: number; totalCreditCard: number }
    >();
    for (const row of dailyPaymentTotalRows) {
      dailyPaymentTotalByFacility.set(row.facilityId!, {
        totalCash: Number(row.totalCash),
        totalCreditCard: Number(row.totalCreditCard),
      });
    }

    const statusPriority = {
      not_started: 0,
      in_progress: 1,
      pending_review: 2,
      completed: 3,
    };

    // Assemble per-facility results purely from in-memory maps (no more DB calls)
    const facilitiesWithStatus = facilities.map((facility) => {
      const reconciliations = reconsByFacility.get(facility.facilityId) ?? [];

      if (reconciliations.length === 0) {
        const totalTransactions = facility.bankAccountIds.reduce(
          (sum, id) => sum + (bankTxnCountByAccountId.get(id) ?? 0),
          0
        );
        const totals = dailyPaymentTotalByFacility.get(facility.facilityId);
        const totalAmount = totals
          ? totals.totalCash + totals.totalCreditCard
          : 0;

        return {
          facilityId: facility.facilityId,
          facilityName: facility.facilityName,
          bankAccountIds: facility.bankAccountIds,
          status: "not_started" as const,
          totalTransactions,
          matchedTransactions: 0,
          discrepancies: 0,
          totalAmount,
          lastUpdated: null,
          assignedTo: null,
        };
      }

      const aggregatedData = reconciliations.reduce(
        (acc, rec) => {
          const expectedCashCheck = Number(rec.totalExpectedCashCheck) || 0;
          const actualCashCheck = Number(rec.totalActualCashCheck) || 0;
          const expectedCreditCard = Number(rec.totalExpectedCreditCard) || 0;
          const actualCreditCard = Number(rec.totalActualCreditCard) || 0;
          return {
            totalExpected: acc.totalExpected + expectedCashCheck + expectedCreditCard,
            totalActual: acc.totalActual + actualCashCheck + actualCreditCard,
            totalTransactionsMatched:
              acc.totalTransactionsMatched + (rec.totalTransactionsMatched || 0),
            totalTransactionsUnmatched:
              acc.totalTransactionsUnmatched + (rec.totalTransactionsUnmatched || 0),
            totalDiscrepancies: acc.totalDiscrepancies + (rec.totalDiscrepancies || 0),
            latestCreatedAt:
              !acc.latestCreatedAt ||
              (rec.createdAt && rec.createdAt > acc.latestCreatedAt)
                ? rec.createdAt
                : acc.latestCreatedAt,
          };
        },
        {
          totalExpected: 0,
          totalActual: 0,
          totalTransactionsMatched: 0,
          totalTransactionsUnmatched: 0,
          totalDiscrepancies: 0,
          latestCreatedAt: null as Date | null,
        }
      );

      const overallStatus = reconciliations.reduce((currentStatus, rec) => {
        return statusPriority[rec.status as keyof typeof statusPriority] >
          statusPriority[currentStatus as keyof typeof statusPriority]
          ? rec.status
          : currentStatus;
      }, "not_started");

      return {
        facilityId: facility.facilityId,
        facilityName: facility.facilityName,
        bankAccountIds: facility.bankAccountIds,
        status: overallStatus,
        totalTransactions:
          aggregatedData.totalTransactionsMatched +
          aggregatedData.totalTransactionsUnmatched,
        matchedTransactions: aggregatedData.totalTransactionsMatched,
        discrepancies: aggregatedData.totalDiscrepancies,
        totalAmount: Math.max(
          aggregatedData.totalExpected,
          aggregatedData.totalActual
        ),
        lastUpdated: aggregatedData.latestCreatedAt?.toISOString() || null,
        assignedTo: "Office Manager",
      };
    });

    // Calculate overall stats
    const stats = {
      totalFacilities: facilitiesWithStatus.length,
      completedReconciliations: facilitiesWithStatus.filter(
        (f) => f.status === "completed"
      ).length,
      pendingReview: facilitiesWithStatus.filter(
        (f) => f.status === "pending_review"
      ).length,
      inProgress: facilitiesWithStatus.filter((f) => f.status === "in_progress")
        .length,
      totalDiscrepancies: facilitiesWithStatus.reduce(
        (sum, f) => sum + f.discrepancies,
        0
      ),
      totalAmount: facilitiesWithStatus.reduce(
        (sum, f) => sum + f.totalAmount,
        0
      ),
      matchingAccuracy:
        facilitiesWithStatus.length > 0
          ? facilitiesWithStatus.reduce((sum, f) => {
              if (f.totalTransactions === 0) return sum;
              return sum + (f.matchedTransactions / f.totalTransactions) * 100;
            }, 0) / facilitiesWithStatus.length
          : 0,
    };

    return NextResponse.json({
      facilities: facilitiesWithStatus,
      stats,
      month,
      year,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
