import { db } from "@/db";
import {
  bankTransaction,
  dailyPayments,
  transactionsToDailyPayments,
  monthlyReconciliation,
  reconciliationDiscrepancies,
  multiDayDiscrepancies,
  bankAccount,
  storageFacilities,
} from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import {
  calculateCashCheckTotal,
  calculateCreditCardTotal,
} from "./dailyPaymentAggregation";

// Types for manual matching operations
export interface ManualMatchRequest {
  bankTransactionId: number;
  dailyPaymentId: number;
  connectionType: "cash" | "creditCard";
  amount: number;
  notes?: string;
  reconciliationId: number;
  matchedBy: string; // User ID
}

export interface PartialMatchRequest {
  bankTransactionId: number;
  dailyPaymentIds: number[];
  connectionType: "cash" | "creditCard";
  totalAmount: number;
  discrepancyAmount: number;
  discrepancyReason: string;
  notes?: string;
  reconciliationId: number;
  matchedBy: string;
}

export interface MultiDayMatchRequest {
  bankTransactionId: number;
  dailyPaymentIds: number[];
  connectionType: "cash" | "creditCard";
  discrepancyType: "multi_day_combination";
  description: string;
  notes?: string;
  reconciliationId: number;
  matchedBy: string;
}

export interface MatchValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAmount?: number;
  suggestedConnectionType?: "cash" | "creditCard";
}

export interface UnmatchRequest {
  bankTransactionId: number;
  dailyPaymentId: number;
  reason: string;
  unmatchedBy: string;
}

/**
 * Validate a manual match request
 */
export async function validateManualMatch(
  request: ManualMatchRequest
): Promise<MatchValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if bank transaction exists and is not already matched
    const bankTxn = await db
      .select({
        bankTransactionId: bankTransaction.bankTransactionId,
        transactionAmount: bankTransaction.transactionAmount,
        transactionDate: bankTransaction.transactionDate,
        bankAccountId: bankTransaction.bankAccountId,
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
          eq(bankTransaction.bankTransactionId, request.bankTransactionId),
          isNull(transactionsToDailyPayments.bankTransactionId)
        )
      )
      .limit(1);

    if (bankTxn.length === 0) {
      errors.push("Bank transaction not found or already matched");
      return { isValid: false, errors, warnings };
    }

    // Check if daily payment exists and is not already matched
    const dailyPayment = await db
      .select()
      .from(dailyPayments)
      .leftJoin(
        transactionsToDailyPayments,
        eq(dailyPayments.Id, transactionsToDailyPayments.dailyPaymentId)
      )
      .where(
        and(
          eq(dailyPayments.Id, request.dailyPaymentId),
          isNull(transactionsToDailyPayments.dailyPaymentId)
        )
      )
      .limit(1);

    if (dailyPayment.length === 0) {
      errors.push("Daily payment not found or already matched");
      return { isValid: false, errors, warnings };
    }

    const payment = dailyPayment[0].daily_payment;
    const transaction = bankTxn[0];

    // Validate facility/bank account relationship
    const facilityBankAccount = await db
      .select()
      .from(bankAccount)
      .where(
        and(
          eq(bankAccount.bankAccountId, transaction.bankAccountId),
          eq(bankAccount.sitelinkId, payment.facilityId)
        )
      )
      .limit(1);

    if (facilityBankAccount.length === 0) {
      errors.push(
        "Bank transaction and daily payment are from different facilities"
      );
      return { isValid: false, errors, warnings };
    }

    // Calculate expected amounts
    const cashCheckTotal = calculateCashCheckTotal(payment);
    const creditCardTotal = calculateCreditCardTotal(payment);
    const transactionAmount = Number(transaction.transactionAmount);

    // Validate connection type and amount
    let expectedAmount: number;
    let suggestedConnectionType: "cash" | "creditCard";

    if (request.connectionType === "cash") {
      expectedAmount = cashCheckTotal;
      suggestedConnectionType = "cash";
    } else {
      expectedAmount = creditCardTotal;
      suggestedConnectionType = "creditCard";
    }

    // Check if the other connection type might be a better match
    const cashDiff = Math.abs(transactionAmount - cashCheckTotal);
    const creditDiff = Math.abs(transactionAmount - creditCardTotal);

    if (
      request.connectionType === "cash" &&
      creditDiff < cashDiff &&
      creditCardTotal > 0
    ) {
      warnings.push(
        `Credit card total (${creditCardTotal}) might be a better match than cash/check (${cashCheckTotal})`
      );
      suggestedConnectionType = "creditCard";
    } else if (
      request.connectionType === "creditCard" &&
      cashDiff < creditDiff &&
      cashCheckTotal > 0
    ) {
      warnings.push(
        `Cash/check total (${cashCheckTotal}) might be a better match than credit card (${creditCardTotal})`
      );
      suggestedConnectionType = "cash";
    }

    // Check amount differences
    const amountDiff = Math.abs(transactionAmount - expectedAmount);
    const percentDiff =
      expectedAmount > 0 ? (amountDiff / expectedAmount) * 100 : 100;

    if (amountDiff === 0) {
      // Perfect match
    } else if (percentDiff <= 1) {
      warnings.push(
        `Small amount difference: $${amountDiff.toFixed(
          2
        )} (${percentDiff.toFixed(2)}%)`
      );
    } else if (percentDiff <= 5) {
      warnings.push(
        `Moderate amount difference: $${amountDiff.toFixed(
          2
        )} (${percentDiff.toFixed(2)}%)`
      );
    } else {
      warnings.push(
        `Large amount difference: $${amountDiff.toFixed(
          2
        )} (${percentDiff.toFixed(2)}%)`
      );
    }

    // Check date differences
    const dateDiff =
      Math.abs(
        new Date(transaction.transactionDate).getTime() -
          new Date(payment.date).getTime()
      ) /
      (1000 * 60 * 60 * 24);

    if (dateDiff > 7) {
      warnings.push(`Large date difference: ${Math.ceil(dateDiff)} days`);
    } else if (dateDiff > 3) {
      warnings.push(`Moderate date difference: ${Math.ceil(dateDiff)} days`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestedAmount: expectedAmount,
      suggestedConnectionType,
    };
  } catch (error) {
    errors.push(
      `Validation error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return { isValid: false, errors, warnings };
  }
}

/**
 * Create a manual match between a bank transaction and daily payment
 */
export async function createManualMatch(request: ManualMatchRequest): Promise<{
  success: boolean;
  matchId?: { bankTransactionId: number; dailyPaymentId: number };
  error?: string;
}> {
  try {
    // Validate the match first
    const validation = await validateManualMatch(request);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(", ")}`,
      };
    }

    // Get the actual amounts for calculation
    const [bankTxn, dailyPayment] = await Promise.all([
      db
        .select()
        .from(bankTransaction)
        .where(eq(bankTransaction.bankTransactionId, request.bankTransactionId))
        .limit(1),
      db
        .select()
        .from(dailyPayments)
        .where(eq(dailyPayments.Id, request.dailyPaymentId))
        .limit(1),
    ]);

    if (bankTxn.length === 0 || dailyPayment.length === 0) {
      return { success: false, error: "Transaction or payment not found" };
    }

    const transactionAmount = Number(bankTxn[0].transactionAmount);
    const payment = dailyPayment[0];
    const expectedAmount =
      request.connectionType === "cash"
        ? calculateCashCheckTotal(payment)
        : calculateCreditCardTotal(payment);

    const depositDifference = transactionAmount - expectedAmount;

    // Create the match
    await db.insert(transactionsToDailyPayments).values({
      bankTransactionId: request.bankTransactionId,
      dailyPaymentId: request.dailyPaymentId,
      amount: request.amount,
      depositDifference,
      connectionType: request.connectionType,
      note: request.notes,
      reconciliationId: request.reconciliationId,
      matchType: "manual",
      isManualMatch: true,
      matchConfidence: 1.0, // Manual matches get full confidence
      matchedBy: request.matchedBy,
      matchedAt: new Date(),
      reconciliationNotes: request.notes,
    });

    return {
      success: true,
      matchId: {
        bankTransactionId: request.bankTransactionId,
        dailyPaymentId: request.dailyPaymentId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create match: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Create a partial match with discrepancy tracking
 */
export async function createPartialMatch(
  request: PartialMatchRequest
): Promise<{
  success: boolean;
  matchIds?: Array<{ bankTransactionId: number; dailyPaymentId: number }>;
  discrepancyId?: number;
  error?: string;
}> {
  try {
    const matchIds: Array<{
      bankTransactionId: number;
      dailyPaymentId: number;
    }> = [];

    // Start a transaction
    await db.transaction(async (tx) => {
      // Create matches for each daily payment
      for (const dailyPaymentId of request.dailyPaymentIds) {
        const dailyPayment = await tx
          .select()
          .from(dailyPayments)
          .where(eq(dailyPayments.Id, dailyPaymentId))
          .limit(1);

        if (dailyPayment.length === 0) {
          throw new Error(`Daily payment ${dailyPaymentId} not found`);
        }

        const payment = dailyPayment[0];
        const expectedAmount =
          request.connectionType === "cash"
            ? calculateCashCheckTotal(payment)
            : calculateCreditCardTotal(payment);

        // Calculate proportional amount
        const proportionalAmount =
          (expectedAmount / request.totalAmount) * request.totalAmount;

        await tx.insert(transactionsToDailyPayments).values({
          bankTransactionId: request.bankTransactionId,
          dailyPaymentId,
          amount: proportionalAmount,
          depositDifference:
            request.discrepancyAmount *
            (proportionalAmount / request.totalAmount),
          connectionType: request.connectionType,
          note: request.notes,
          reconciliationId: request.reconciliationId,
          matchType: "partial",
          isManualMatch: true,
          matchConfidence: 0.8, // Partial matches get lower confidence
          matchedBy: request.matchedBy,
          matchedAt: new Date(),
          reconciliationNotes: request.notes,
        });

        matchIds.push({
          bankTransactionId: request.bankTransactionId,
          dailyPaymentId,
        });
      }

      // Create discrepancy record
      const discrepancyResult = await tx
        .insert(reconciliationDiscrepancies)
        .values({
          reconciliationId: request.reconciliationId,
          discrepancyType: "error", // Partial matches are typically due to errors
          description: request.discrepancyReason,
          amount: Math.abs(request.discrepancyAmount).toString(),
          status: "pending_approval",
          createdBy: request.matchedBy,
          notes: request.notes,
          referenceTransactionIds: JSON.stringify([request.bankTransactionId]),
          referenceDailyPaymentIds: JSON.stringify(request.dailyPaymentIds),
          isCritical: Math.abs(request.discrepancyAmount) > 100, // Flag large discrepancies
        })
        .returning({
          discrepancyId: reconciliationDiscrepancies.discrepancyId,
        });

      return discrepancyResult[0].discrepancyId;
    });

    return { success: true, matchIds };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create partial match: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Create a multi-day combination match
 */
export async function createMultiDayMatch(
  request: MultiDayMatchRequest
): Promise<{
  success: boolean;
  discrepancyId?: number;
  error?: string;
}> {
  try {
    let discrepancyId: number = 0;

    discrepancyId = await db.transaction(async (tx) => {
      // Calculate total expected amount from all daily payments
      const dailyPaymentRecords = await tx
        .select()
        .from(dailyPayments)
        .where(inArray(dailyPayments.Id, request.dailyPaymentIds));

      const totalExpected = dailyPaymentRecords.reduce(
        (sum: number, payment: typeof dailyPayments.$inferSelect) => {
          const amount =
            request.connectionType === "cash"
              ? calculateCashCheckTotal(payment)
              : calculateCreditCardTotal(payment);
          return sum + amount;
        },
        0
      );

      // Get bank transaction amount
      const bankTxn = await tx
        .select()
        .from(bankTransaction)
        .where(eq(bankTransaction.bankTransactionId, request.bankTransactionId))
        .limit(1);

      if (bankTxn.length === 0) {
        throw new Error("Bank transaction not found");
      }

      const transactionAmount = Number(bankTxn[0].transactionAmount);
      const difference = transactionAmount - totalExpected;

      // Create matches for each daily payment
      for (const dailyPaymentId of request.dailyPaymentIds) {
        const payment = dailyPaymentRecords.find(
          (p: typeof dailyPayments.$inferSelect) => p.Id === dailyPaymentId
        );
        if (!payment) continue;

        const expectedAmount =
          request.connectionType === "cash"
            ? calculateCashCheckTotal(payment)
            : calculateCreditCardTotal(payment);

        await tx.insert(transactionsToDailyPayments).values({
          bankTransactionId: request.bankTransactionId,
          dailyPaymentId,
          amount: expectedAmount,
          depositDifference: difference * (expectedAmount / totalExpected),
          connectionType: request.connectionType,
          note: request.notes,
          reconciliationId: request.reconciliationId,
          matchType: "manual",
          isManualMatch: true,
          matchConfidence: 0.9,
          matchedBy: request.matchedBy,
          matchedAt: new Date(),
          reconciliationNotes: `Multi-day combination: ${request.description}`,
        });
      }

      // Create discrepancy record
      const discrepancyResult = await tx
        .insert(reconciliationDiscrepancies)
        .values({
          reconciliationId: request.reconciliationId,
          discrepancyType: request.discrepancyType,
          description: request.description,
          amount: Math.abs(difference).toString(),
          status: "pending_approval",
          createdBy: request.matchedBy,
          notes: request.notes,
          referenceTransactionIds: JSON.stringify([request.bankTransactionId]),
          referenceDailyPaymentIds: JSON.stringify(request.dailyPaymentIds),
          isCritical: Math.abs(difference) > 50,
        })
        .returning({
          discrepancyId: reconciliationDiscrepancies.discrepancyId,
        });

      discrepancyId = discrepancyResult[0].discrepancyId;

      // Create multi-day discrepancy records
      for (const dailyPaymentId of request.dailyPaymentIds) {
        await tx.insert(multiDayDiscrepancies).values({
          discrepancyId,
          dailyPaymentId,
          notes: `Part of multi-day combination for transaction ${request.bankTransactionId}`,
          addedBy: request.matchedBy,
        });
      }

      return discrepancyId;
    });

    return { success: true, discrepancyId };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create multi-day match: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Unmatch a previously matched transaction
 */
export async function unmatchTransaction(request: UnmatchRequest): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if the match exists
    const existingMatch = await db
      .select()
      .from(transactionsToDailyPayments)
      .where(
        and(
          eq(
            transactionsToDailyPayments.bankTransactionId,
            request.bankTransactionId
          ),
          eq(transactionsToDailyPayments.dailyPaymentId, request.dailyPaymentId)
        )
      )
      .limit(1);

    if (existingMatch.length === 0) {
      return { success: false, error: "Match not found" };
    }

    // Delete the match
    await db
      .delete(transactionsToDailyPayments)
      .where(
        and(
          eq(
            transactionsToDailyPayments.bankTransactionId,
            request.bankTransactionId
          ),
          eq(transactionsToDailyPayments.dailyPaymentId, request.dailyPaymentId)
        )
      );

    // TODO: Log the unmatch action for audit trail
    // This could be added to a separate audit log table

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to unmatch: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Get all matches for a reconciliation period
 */
export async function getMatchesForReconciliation(reconciliationId: number) {
  return await db
    .select({
      bankTransactionId: transactionsToDailyPayments.bankTransactionId,
      dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
      amount: transactionsToDailyPayments.amount,
      depositDifference: transactionsToDailyPayments.depositDifference,
      connectionType: transactionsToDailyPayments.connectionType,
      matchType: transactionsToDailyPayments.matchType,
      matchConfidence: transactionsToDailyPayments.matchConfidence,
      matchedBy: transactionsToDailyPayments.matchedBy,
      matchedAt: transactionsToDailyPayments.matchedAt,
      notes: transactionsToDailyPayments.reconciliationNotes,
      // Bank transaction details
      transactionDate: bankTransaction.transactionDate,
      transactionAmount: bankTransaction.transactionAmount,
      transactionType: bankTransaction.transactionType,
      // Daily payment details
      paymentDate: dailyPayments.date,
      facilityId: dailyPayments.facilityId,
    })
    .from(transactionsToDailyPayments)
    .innerJoin(
      bankTransaction,
      eq(
        transactionsToDailyPayments.bankTransactionId,
        bankTransaction.bankTransactionId
      )
    )
    .innerJoin(
      dailyPayments,
      eq(transactionsToDailyPayments.dailyPaymentId, dailyPayments.Id)
    )
    .where(eq(transactionsToDailyPayments.reconciliationId, reconciliationId))
    .orderBy(bankTransaction.transactionDate, dailyPayments.date);
}
