import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  transactionsToDailyPayments,
  bankTransaction,
  dailyPayments,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
    const { bankTransactionId, dailyPaymentId, connectionType, amount } = body;

    if (
      !bankTransactionId ||
      !dailyPaymentId ||
      !connectionType ||
      amount === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: bankTransactionId, dailyPaymentId, connectionType, amount",
        },
        { status: 400 }
      );
    }

    if (!["cash", "creditCard"].includes(connectionType)) {
      return NextResponse.json(
        { error: "Invalid connectionType. Must be 'cash' or 'creditCard'" },
        { status: 400 }
      );
    }

    // Verify that the bank transaction exists and is not already matched
    const existingBankTransaction = await db
      .select({
        bankTransactionId: bankTransaction.bankTransactionId,
        amount: bankTransaction.transactionAmount,
        transactionDate: bankTransaction.transactionDate,
      })
      .from(bankTransaction)
      .where(eq(bankTransaction.bankTransactionId, bankTransactionId))
      .limit(1);

    if (existingBankTransaction.length === 0) {
      return NextResponse.json(
        { error: "Bank transaction not found" },
        { status: 404 }
      );
    }

    // Check if this bank transaction is already matched
    const existingMatch = await db
      .select({
        bankTransactionId: transactionsToDailyPayments.bankTransactionId,
      })
      .from(transactionsToDailyPayments)
      .where(
        eq(transactionsToDailyPayments.bankTransactionId, bankTransactionId)
      )
      .limit(1);

    if (existingMatch.length > 0) {
      return NextResponse.json(
        { error: "Bank transaction is already matched" },
        { status: 409 }
      );
    }

    // Verify that the daily payment exists
    const existingDailyPayment = await db
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
      .where(eq(dailyPayments.Id, dailyPaymentId))
      .limit(1);

    if (existingDailyPayment.length === 0) {
      return NextResponse.json(
        { error: "Daily payment not found" },
        { status: 404 }
      );
    }

    // Create the match
    const matchResult = await db
      .insert(transactionsToDailyPayments)
      .values({
        bankTransactionId,
        dailyPaymentId,
        connectionType,
        amount: amount,
        depositDifference: 0,
        matchType: "manual",
        isManualMatch: true,
        matchedBy: session.user.id,
        matchedAt: new Date(),
      })
      .returning({
        bankTransactionId: transactionsToDailyPayments.bankTransactionId,
        dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
        connectionType: transactionsToDailyPayments.connectionType,
        amount: transactionsToDailyPayments.amount,
        matchedAt: transactionsToDailyPayments.matchedAt,
      });

    const createdMatch = matchResult[0];

    return NextResponse.json({
      success: true,
      match: {
        bankTransactionId: createdMatch.bankTransactionId,
        dailyPaymentId: createdMatch.dailyPaymentId,
        connectionType: createdMatch.connectionType,
        amount: parseFloat(createdMatch.amount?.toString() || "0"),
        matchedAt: createdMatch.matchedAt?.toISOString(),
        bankTransaction: {
          amount: parseFloat(
            existingBankTransaction[0].amount?.toString() || "0"
          ),
          transactionDate: existingBankTransaction[0].transactionDate,
        },
        dailyPayment: {
          date: existingDailyPayment[0].date,
          cash: parseFloat(existingDailyPayment[0].cash?.toString() || "0"),
          check: parseFloat(existingDailyPayment[0].check?.toString() || "0"),
          creditCardTotal:
            parseFloat(existingDailyPayment[0].visa?.toString() || "0") +
            parseFloat(existingDailyPayment[0].mastercard?.toString() || "0") +
            parseFloat(
              existingDailyPayment[0].americanExpress?.toString() || "0"
            ) +
            parseFloat(existingDailyPayment[0].discover?.toString() || "0") +
            parseFloat(existingDailyPayment[0].ach?.toString() || "0") +
            parseFloat(existingDailyPayment[0].dinersClub?.toString() || "0") +
            parseFloat(existingDailyPayment[0].debit?.toString() || "0"),
        },
      },
    });
  } catch (error) {
    console.error("Create match API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
