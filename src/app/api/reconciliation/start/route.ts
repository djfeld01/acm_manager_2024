import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  monthlyReconciliation,
  storageFacilities,
  bankAccount,
  dailyPayments,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has appropriate role
    const userRole = session.user.role || "";
    if (!["ADMIN", "OWNER", "SUPERVISOR", "MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { facilityId, month, year } = body;

    if (!facilityId || !month || !year) {
      return NextResponse.json(
        { error: "Missing required fields: facilityId, month, year" },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid month. Must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Get all bank accounts for this facility
    const bankAccounts = await db
      .select({
        bankAccountId: bankAccount.bankAccountId,
        bankName: bankAccount.bankName,
        bankAccountNumber: bankAccount.bankAccountNumber,
      })
      .from(bankAccount)
      .where(eq(bankAccount.sitelinkId, facilityId));

    if (bankAccounts.length === 0) {
      return NextResponse.json(
        { error: "No bank accounts found for this facility" },
        { status: 404 }
      );
    }

    // Check if reconciliation already exists for any bank account
    const existingReconciliations = await db
      .select({
        reconciliationId: monthlyReconciliation.reconciliationId,
        bankAccountId: monthlyReconciliation.bankAccountId,
      })
      .from(monthlyReconciliation)
      .where(
        and(
          eq(monthlyReconciliation.facilityId, facilityId),
          eq(monthlyReconciliation.reconciliationMonth, month),
          eq(monthlyReconciliation.reconciliationYear, year)
        )
      );

    if (existingReconciliations.length > 0) {
      return NextResponse.json(
        { error: "Reconciliation already exists for this facility and period" },
        { status: 409 }
      );
    }

    // Calculate expected totals from daily payments for this period
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

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
          eq(dailyPayments.facilityId, facilityId),
          sql`${dailyPayments.date} >= ${startDate}`,
          sql`${dailyPayments.date} <= ${endDate}`
        )
      );

    const expectedCashCheck =
      dailyPaymentTotals.length > 0
        ? Number(dailyPaymentTotals[0].totalCash)
        : 0;
    const expectedCreditCard =
      dailyPaymentTotals.length > 0
        ? Number(dailyPaymentTotals[0].totalCreditCard)
        : 0;

    // Create reconciliation records for each bank account
    const createdReconciliations = await Promise.all(
      bankAccounts.map(async (account) => {
        const result = await db
          .insert(monthlyReconciliation)
          .values({
            facilityId,
            bankAccountId: account.bankAccountId,
            reconciliationMonth: month,
            reconciliationYear: year,
            status: "in_progress",
            totalExpectedCashCheck: expectedCashCheck.toString(),
            totalExpectedCreditCard: expectedCreditCard.toString(),
            totalActualCashCheck: "0",
            totalActualCreditCard: "0",
            totalTransactionsMatched: 0,
            totalTransactionsUnmatched: 0,
            totalDiscrepancies: 0,
            createdBy: session.user.id,
            createdAt: new Date(),
          })
          .returning({
            reconciliationId: monthlyReconciliation.reconciliationId,
            bankAccountId: monthlyReconciliation.bankAccountId,
          });

        return result[0];
      })
    );

    return NextResponse.json({
      success: true,
      message: `Reconciliation started for ${bankAccounts.length} bank account(s)`,
      reconciliations: createdReconciliations,
      facilityId,
      month,
      year,
      expectedTotals: {
        cashCheck: expectedCashCheck,
        creditCard: expectedCreditCard,
      },
    });
  } catch (error) {
    console.error("Start reconciliation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
