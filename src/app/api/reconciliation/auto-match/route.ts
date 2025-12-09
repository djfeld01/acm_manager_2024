import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  bankTransaction,
  dailyPayments,
  transactionsToDailyPayments,
} from "@/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const bankAccountId = parseInt(searchParams.get("bankAccountId") || "0");
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");

    if (!facilityId || !bankAccountId || !month || !year) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid month. Must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    // Get unmatched bank transactions for this period
    const unmatchedBankTransactions = await db
      .select({
        bankTransactionId: bankTransaction.bankTransactionId,
        transactionDate: bankTransaction.transactionDate,
        amount: bankTransaction.transactionAmount,
        transactionType: bankTransaction.transactionType,
      })
      .from(bankTransaction)
      .leftJoin(
        transactionsToDailyPayments,
        eq(
          bankTransaction.bankTransactionId,
          transactionsToDailyPayments.bankTransactionId
        )
      )
      .where(
        and(
          eq(bankTransaction.bankAccountId, bankAccountId),
          sql`${bankTransaction.transactionDate} >= ${startDate}`,
          sql`${bankTransaction.transactionDate} <= ${endDate}`,
          isNull(transactionsToDailyPayments.bankTransactionId) // Not already matched
        )
      );

    // Get daily payments for this facility and period
    const facilityDailyPayments = await db
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
          sql`${dailyPayments.date} <= ${endDate}`
        )
      );

    // Generate potential matches
    const suggestions = [];

    for (const bankTxn of unmatchedBankTransactions) {
      const bankAmount = parseFloat(bankTxn.amount?.toString() || "0");
      const bankDate = new Date(bankTxn.transactionDate || "");

      for (const dailyPayment of facilityDailyPayments) {
        const paymentDate = new Date(dailyPayment.date || "");
        const cashCheckTotal =
          parseFloat(dailyPayment.cash?.toString() || "0") +
          parseFloat(dailyPayment.check?.toString() || "0");
        const creditCardTotal =
          parseFloat(dailyPayment.visa?.toString() || "0") +
          parseFloat(dailyPayment.mastercard?.toString() || "0") +
          parseFloat(dailyPayment.americanExpress?.toString() || "0") +
          parseFloat(dailyPayment.discover?.toString() || "0") +
          parseFloat(dailyPayment.ach?.toString() || "0") +
          parseFloat(dailyPayment.dinersClub?.toString() || "0") +
          parseFloat(dailyPayment.debit?.toString() || "0");

        // Check for cash/check match
        if (cashCheckTotal > 0) {
          const amountDiff = Math.abs(bankAmount - cashCheckTotal);
          const dateDiff =
            Math.abs(bankDate.getTime() - paymentDate.getTime()) /
            (1000 * 60 * 60 * 24);

          if (amountDiff <= 0.01 && dateDiff <= 2) {
            // Exact or very close match within 2 days
            const matchType =
              amountDiff === 0 && dateDiff === 0
                ? "exact"
                : amountDiff <= 0.01 && dateDiff <= 1
                ? "close"
                : "possible";
            const confidence =
              amountDiff === 0 && dateDiff === 0
                ? 1.0
                : amountDiff <= 0.01 && dateDiff <= 1
                ? 0.9
                : 0.7;

            suggestions.push({
              bankTransactionId: bankTxn.bankTransactionId,
              dailyPaymentId: dailyPayment.dailyPaymentId,
              facilityId,
              bankAccountId,
              transactionDate: bankTxn.transactionDate,
              transactionAmount: bankAmount,
              transactionType: bankTxn.transactionType || "unknown",
              dailyPaymentDate: dailyPayment.date,
              dailyPaymentCashCheck: cashCheckTotal,
              dailyPaymentCreditCard: creditCardTotal,
              matchType,
              matchConfidence: confidence,
              amountDifference: amountDiff,
              dateDifference: Math.round(dateDiff),
              connectionType: "cash" as const,
            });
          }
        }

        // Check for credit card match
        if (creditCardTotal > 0) {
          const amountDiff = Math.abs(bankAmount - creditCardTotal);
          const dateDiff =
            Math.abs(bankDate.getTime() - paymentDate.getTime()) /
            (1000 * 60 * 60 * 24);

          if (amountDiff <= 0.01 && dateDiff <= 2) {
            // Exact or very close match within 2 days
            const matchType =
              amountDiff === 0 && dateDiff === 0
                ? "exact"
                : amountDiff <= 0.01 && dateDiff <= 1
                ? "close"
                : "possible";
            const confidence =
              amountDiff === 0 && dateDiff === 0
                ? 1.0
                : amountDiff <= 0.01 && dateDiff <= 1
                ? 0.9
                : 0.7;

            suggestions.push({
              bankTransactionId: bankTxn.bankTransactionId,
              dailyPaymentId: dailyPayment.dailyPaymentId,
              facilityId,
              bankAccountId,
              transactionDate: bankTxn.transactionDate,
              transactionAmount: bankAmount,
              transactionType: bankTxn.transactionType || "unknown",
              dailyPaymentDate: dailyPayment.date,
              dailyPaymentCashCheck: cashCheckTotal,
              dailyPaymentCreditCard: creditCardTotal,
              matchType,
              matchConfidence: confidence,
              amountDifference: amountDiff,
              dateDifference: Math.round(dateDiff),
              connectionType: "creditCard" as const,
            });
          }
        }
      }
    }

    // Sort by confidence (highest first) and limit to top 20
    const sortedSuggestions = suggestions
      .sort((a, b) => b.matchConfidence - a.matchConfidence)
      .slice(0, 20);

    return NextResponse.json({
      suggestions: sortedSuggestions,
      totalFound: suggestions.length,
      facilityId,
      bankAccountId,
      month,
      year,
    });
  } catch (error) {
    console.error("Auto-match suggestions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
