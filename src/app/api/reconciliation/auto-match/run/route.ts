import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  bankTransaction,
  dailyPayments,
  transactionsToDailyPayments,
} from "@/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

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
    const {
      facilityId,
      bankAccountId,
      month,
      year,
      minConfidence = 0.95,
    } = body;

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

    // Find high-confidence matches and create them automatically
    const createdMatches = [];
    const processedBankTransactions = new Set<number>();
    const processedDailyPayments = new Set<number>();

    for (const bankTxn of unmatchedBankTransactions) {
      if (processedBankTransactions.has(bankTxn.bankTransactionId)) continue;

      const bankAmount = parseFloat(bankTxn.amount?.toString() || "0");
      const bankDate = new Date(bankTxn.transactionDate || "");

      for (const dailyPayment of facilityDailyPayments) {
        if (processedDailyPayments.has(dailyPayment.dailyPaymentId)) continue;

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

        // Check for exact cash/check match
        if (cashCheckTotal > 0) {
          const amountDiff = Math.abs(bankAmount - cashCheckTotal);
          const dateDiff =
            Math.abs(bankDate.getTime() - paymentDate.getTime()) /
            (1000 * 60 * 60 * 24);

          if (amountDiff === 0 && dateDiff === 0) {
            // Perfect match
            const confidence = 1.0;

            if (confidence >= minConfidence) {
              // Create the match
              const matchResult = await db
                .insert(transactionsToDailyPayments)
                .values({
                  bankTransactionId: bankTxn.bankTransactionId,
                  dailyPaymentId: dailyPayment.dailyPaymentId,
                  connectionType: "cash",
                  amount: bankAmount,
                  depositDifference: 0,
                  matchType: "automatic",
                  isManualMatch: false,
                  matchConfidence: confidence,
                  matchedBy: session.user.id,
                  matchedAt: new Date(),
                })
                .returning({
                  bankTransactionId:
                    transactionsToDailyPayments.bankTransactionId,
                  dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
                });

              createdMatches.push({
                bankTransactionId: matchResult[0].bankTransactionId,
                dailyPaymentId: matchResult[0].dailyPaymentId,
                connectionType: "cash",
                amount: bankAmount,
                confidence,
                transactionDate: bankTxn.transactionDate,
                dailyPaymentDate: dailyPayment.date,
              });

              processedBankTransactions.add(bankTxn.bankTransactionId);
              processedDailyPayments.add(dailyPayment.dailyPaymentId);
              break; // Move to next bank transaction
            }
          }
        }

        // Check for exact credit card match
        if (
          creditCardTotal > 0 &&
          !processedBankTransactions.has(bankTxn.bankTransactionId)
        ) {
          const amountDiff = Math.abs(bankAmount - creditCardTotal);
          const dateDiff =
            Math.abs(bankDate.getTime() - paymentDate.getTime()) /
            (1000 * 60 * 60 * 24);

          if (amountDiff === 0 && dateDiff === 0) {
            // Perfect match
            const confidence = 1.0;

            if (confidence >= minConfidence) {
              // Create the match
              const matchResult = await db
                .insert(transactionsToDailyPayments)
                .values({
                  bankTransactionId: bankTxn.bankTransactionId,
                  dailyPaymentId: dailyPayment.dailyPaymentId,
                  connectionType: "creditCard",
                  amount: bankAmount,
                  depositDifference: 0,
                  matchType: "automatic",
                  isManualMatch: false,
                  matchConfidence: confidence,
                  matchedBy: session.user.id,
                  matchedAt: new Date(),
                })
                .returning({
                  bankTransactionId:
                    transactionsToDailyPayments.bankTransactionId,
                  dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
                });

              createdMatches.push({
                bankTransactionId: matchResult[0].bankTransactionId,
                dailyPaymentId: matchResult[0].dailyPaymentId,
                connectionType: "creditCard",
                amount: bankAmount,
                confidence,
                transactionDate: bankTxn.transactionDate,
                dailyPaymentDate: dailyPayment.date,
              });

              processedBankTransactions.add(bankTxn.bankTransactionId);
              processedDailyPayments.add(dailyPayment.dailyPaymentId);
              break; // Move to next bank transaction
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      matchesCreated: createdMatches.length,
      matches: createdMatches,
      minConfidence,
      facilityId,
      bankAccountId,
      month,
      year,
    });
  } catch (error) {
    console.error("Auto-match run API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
