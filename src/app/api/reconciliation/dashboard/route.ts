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

    // Get all facilities with their bank accounts (grouped by facility)
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

    // Group by facility to handle multiple bank accounts per facility
    const facilitiesMap = new Map<
      string,
      {
        facilityId: string;
        facilityName: string;
        bankAccountIds: number[];
      }
    >();

    facilitiesWithBankAccounts.forEach((item) => {
      if (!facilitiesMap.has(item.facilityId)) {
        facilitiesMap.set(item.facilityId, {
          facilityId: item.facilityId,
          facilityName: item.facilityName,
          bankAccountIds: [],
        });
      }
      facilitiesMap
        .get(item.facilityId)!
        .bankAccountIds.push(item.bankAccountId);
    });

    const facilities = Array.from(facilitiesMap.values());

    // Get reconciliation status for each facility (aggregating across all bank accounts)
    const facilitiesWithStatus = await Promise.all(
      facilities.map(async (facility) => {
        // Check if reconciliation exists for this facility/month/year (across all bank accounts)
        const reconciliations = await db
          .select({
            reconciliationId: monthlyReconciliation.reconciliationId,
            status: monthlyReconciliation.status,
            createdAt: monthlyReconciliation.createdAt,
            totalExpectedCashCheck:
              monthlyReconciliation.totalExpectedCashCheck,
            totalActualCashCheck: monthlyReconciliation.totalActualCashCheck,
            totalExpectedCreditCard:
              monthlyReconciliation.totalExpectedCreditCard,
            totalActualCreditCard: monthlyReconciliation.totalActualCreditCard,
            totalTransactionsMatched:
              monthlyReconciliation.totalTransactionsMatched,
            totalTransactionsUnmatched:
              monthlyReconciliation.totalTransactionsUnmatched,
            totalDiscrepancies: monthlyReconciliation.totalDiscrepancies,
            bankAccountId: monthlyReconciliation.bankAccountId,
          })
          .from(monthlyReconciliation)
          .where(
            and(
              eq(monthlyReconciliation.facilityId, facility.facilityId),
              eq(monthlyReconciliation.reconciliationMonth, month),
              eq(monthlyReconciliation.reconciliationYear, year)
            )
          );

        if (reconciliations.length === 0) {
          // No reconciliation started yet - get basic stats across all bank accounts
          const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
          const endDate = new Date(year, month, 0).toISOString().split("T")[0];

          // Count bank transactions for this period across all bank accounts for this facility
          const bankTransactionCounts = await Promise.all(
            facility.bankAccountIds.map(async (bankAccountId) => {
              const result = await db
                .select({ count: count() })
                .from(bankTransaction)
                .where(
                  and(
                    eq(bankTransaction.bankAccountId, bankAccountId),
                    sql`${bankTransaction.transactionDate} >= ${startDate}`,
                    sql`${bankTransaction.transactionDate} <= ${endDate}`
                  )
                );
              return result[0]?.count || 0;
            })
          );

          const totalTransactions = bankTransactionCounts.reduce(
            (sum, count) => sum + count,
            0
          );

          // Calculate total amount from daily payments
          const dailyPaymentTotals = await db
            .select({
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
                eq(dailyPayments.facilityId, facility.facilityId),
                sql`${dailyPayments.date} >= ${startDate}`,
                sql`${dailyPayments.date} <= ${endDate}`
              )
            );

          const totalAmount =
            dailyPaymentTotals.length > 0
              ? Number(dailyPaymentTotals[0].totalCash) +
                Number(dailyPaymentTotals[0].totalCreditCard)
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

        // Aggregate data across all reconciliations for this facility
        const aggregatedData = reconciliations.reduce(
          (acc, rec) => {
            const expectedCashCheck = Number(rec.totalExpectedCashCheck) || 0;
            const actualCashCheck = Number(rec.totalActualCashCheck) || 0;
            const expectedCreditCard = Number(rec.totalExpectedCreditCard) || 0;
            const actualCreditCard = Number(rec.totalActualCreditCard) || 0;

            return {
              totalExpected:
                acc.totalExpected + expectedCashCheck + expectedCreditCard,
              totalActual: acc.totalActual + actualCashCheck + actualCreditCard,
              totalTransactionsMatched:
                acc.totalTransactionsMatched +
                (rec.totalTransactionsMatched || 0),
              totalTransactionsUnmatched:
                acc.totalTransactionsUnmatched +
                (rec.totalTransactionsUnmatched || 0),
              totalDiscrepancies:
                acc.totalDiscrepancies + (rec.totalDiscrepancies || 0),
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

        // Determine overall status - if any reconciliation is not completed, show the most progressed status
        const statusPriority = {
          not_started: 0,
          in_progress: 1,
          pending_review: 2,
          completed: 3,
        };

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
          assignedTo: "Office Manager", // TODO: Get from user assignment
        };
      })
    );

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
