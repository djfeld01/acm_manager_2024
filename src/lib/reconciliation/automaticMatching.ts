import { db } from "@/db";
import {
  bankTransaction,
  dailyPayments,
  bankAccount,
  storageFacilities,
  transactionsToDailyPayments,
} from "@/db/schema";
import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";
import {
  DailyPaymentTotals,
  calculateCashCheckTotal,
  calculateCreditCardTotal,
  aggregateDailyPayment,
} from "./dailyPaymentAggregation";
import { getMonthStart, getMonthEnd } from "./dateUtils";

// Types for matching results
export interface PotentialMatch {
  bankTransactionId: number;
  dailyPaymentId: number;
  facilityId: string;
  bankAccountId: number;
  transactionDate: string;
  transactionAmount: number;
  transactionType: string;
  dailyPaymentDate: string;
  dailyPaymentCashCheck: number;
  dailyPaymentCreditCard: number;
  matchType: "exact" | "close" | "possible";
  matchConfidence: number; // 0.0 to 1.0
  amountDifference: number;
  dateDifference: number; // days
  connectionType: "cash" | "creditCard";
}

export interface MatchingSummary {
  facilityId: string;
  facilityName: string;
  bankAccountId: number;
  totalBankTransactions: number;
  totalDailyPayments: number;
  exactMatches: number;
  closeMatches: number;
  possibleMatches: number;
  unmatchedBankTransactions: number;
  unmatchedDailyPayments: number;
  potentialMatches: PotentialMatch[];
}

export interface AutoMatchingResult {
  month: number;
  year: number;
  facilitySummaries: MatchingSummary[];
  overallStats: {
    totalExactMatches: number;
    totalCloseMatches: number;
    totalPossibleMatches: number;
    totalUnmatched: number;
    matchingAccuracy: number;
  };
}

/**
 * Calculate match confidence based on amount and date differences
 */
function calculateMatchConfidence(
  amountDiff: number,
  dateDiff: number,
  transactionAmount: number
): { confidence: number; matchType: "exact" | "close" | "possible" } {
  // Perfect match
  if (amountDiff === 0 && dateDiff === 0) {
    return { confidence: 1.0, matchType: "exact" };
  }

  // Calculate amount confidence (percentage difference)
  const amountConfidence = Math.max(
    0,
    1 - Math.abs(amountDiff) / transactionAmount
  );

  // Calculate date confidence (penalize each day difference)
  const dateConfidence = Math.max(0, 1 - dateDiff * 0.1); // 10% penalty per day

  // Combined confidence (weighted average)
  const confidence = amountConfidence * 0.8 + dateConfidence * 0.2;

  // Determine match type based on confidence
  if (confidence >= 0.95) {
    return { confidence, matchType: "exact" };
  } else if (confidence >= 0.8) {
    return { confidence, matchType: "close" };
  } else if (confidence >= 0.6) {
    return { confidence, matchType: "possible" };
  } else {
    return { confidence: 0, matchType: "possible" };
  }
}

/**
 * Calculate the difference in days between two dates
 */
function calculateDateDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get unmatched bank transactions for a facility and month
 */
async function getUnmatchedBankTransactions(
  facilityId: string,
  bankAccountId: number,
  month: number,
  year: number
): Promise<
  Array<{
    bankTransactionId: number;
    transactionDate: string;
    transactionAmount: number;
    transactionType: string;
  }>
> {
  const startDate = getMonthStart(year, month);
  const endDate = getMonthEnd(year, month);

  const transactions = await db
    .select({
      bankTransactionId: bankTransaction.bankTransactionId,
      transactionDate: bankTransaction.transactionDate,
      transactionAmount: bankTransaction.transactionAmount,
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
        gte(bankTransaction.transactionDate, startDate),
        lte(bankTransaction.transactionDate, endDate),
        isNull(transactionsToDailyPayments.bankTransactionId) // Not already matched
      )
    )
    .orderBy(bankTransaction.transactionDate);

  return transactions.map((t) => ({
    bankTransactionId: t.bankTransactionId,
    transactionDate: t.transactionDate,
    transactionAmount: Number(t.transactionAmount),
    transactionType: t.transactionType,
  }));
}

/**
 * Get unmatched daily payments for a facility and month
 */
async function getUnmatchedDailyPayments(
  facilityId: string,
  month: number,
  year: number
): Promise<DailyPaymentTotals[]> {
  const startDate = getMonthStart(year, month);
  const endDate = getMonthEnd(year, month);

  const payments = await db
    .select()
    .from(dailyPayments)
    .leftJoin(
      transactionsToDailyPayments,
      eq(dailyPayments.Id, transactionsToDailyPayments.dailyPaymentId)
    )
    .where(
      and(
        eq(dailyPayments.facilityId, facilityId),
        gte(dailyPayments.date, startDate),
        lte(dailyPayments.date, endDate),
        isNull(transactionsToDailyPayments.dailyPaymentId) // Not already matched
      )
    )
    .orderBy(dailyPayments.date);

  return payments.map((p) => aggregateDailyPayment(p.daily_payment));
}

/**
 * Find potential matches between bank transactions and daily payments
 */
function findPotentialMatches(
  bankTransactions: Array<{
    bankTransactionId: number;
    transactionDate: string;
    transactionAmount: number;
    transactionType: string;
  }>,
  dailyPayments: DailyPaymentTotals[],
  facilityId: string,
  bankAccountId: number
): PotentialMatch[] {
  const potentialMatches: PotentialMatch[] = [];

  for (const transaction of bankTransactions) {
    for (const payment of dailyPayments) {
      // Try matching with cash/check total
      const cashCheckDiff = Math.abs(
        transaction.transactionAmount - payment.cashCheckTotal
      );
      const cashCheckDateDiff = calculateDateDifference(
        transaction.transactionDate,
        payment.date
      );

      if (payment.cashCheckTotal > 0) {
        const cashCheckMatch = calculateMatchConfidence(
          cashCheckDiff,
          cashCheckDateDiff,
          transaction.transactionAmount
        );

        if (cashCheckMatch.confidence >= 0.6) {
          potentialMatches.push({
            bankTransactionId: transaction.bankTransactionId,
            dailyPaymentId:
              payment.facilityId === facilityId
                ? parseInt(payment.date.replace(/-/g, ""))
                : 0, // Temporary ID logic
            facilityId,
            bankAccountId,
            transactionDate: transaction.transactionDate,
            transactionAmount: transaction.transactionAmount,
            transactionType: transaction.transactionType,
            dailyPaymentDate: payment.date,
            dailyPaymentCashCheck: payment.cashCheckTotal,
            dailyPaymentCreditCard: payment.creditCardTotal,
            matchType: cashCheckMatch.matchType,
            matchConfidence: cashCheckMatch.confidence,
            amountDifference: cashCheckDiff,
            dateDifference: cashCheckDateDiff,
            connectionType: "cash",
          });
        }
      }

      // Try matching with credit card total
      const creditCardDiff = Math.abs(
        transaction.transactionAmount - payment.creditCardTotal
      );
      const creditCardDateDiff = calculateDateDifference(
        transaction.transactionDate,
        payment.date
      );

      if (payment.creditCardTotal > 0) {
        const creditCardMatch = calculateMatchConfidence(
          creditCardDiff,
          creditCardDateDiff,
          transaction.transactionAmount
        );

        if (creditCardMatch.confidence >= 0.6) {
          potentialMatches.push({
            bankTransactionId: transaction.bankTransactionId,
            dailyPaymentId:
              payment.facilityId === facilityId
                ? parseInt(payment.date.replace(/-/g, ""))
                : 0, // Temporary ID logic
            facilityId,
            bankAccountId,
            transactionDate: transaction.transactionDate,
            transactionAmount: transaction.transactionAmount,
            transactionType: transaction.transactionType,
            dailyPaymentDate: payment.date,
            dailyPaymentCashCheck: payment.cashCheckTotal,
            dailyPaymentCreditCard: payment.creditCardTotal,
            matchType: creditCardMatch.matchType,
            matchConfidence: creditCardMatch.confidence,
            amountDifference: creditCardDiff,
            dateDifference: creditCardDateDiff,
            connectionType: "creditCard",
          });
        }
      }
    }
  }

  // Sort by confidence (highest first) and remove duplicates
  return potentialMatches
    .sort((a, b) => b.matchConfidence - a.matchConfidence)
    .filter((match, index, array) => {
      // Remove duplicate matches for the same bank transaction (keep highest confidence)
      return (
        array.findIndex(
          (m) => m.bankTransactionId === match.bankTransactionId
        ) === index
      );
    });
}

/**
 * Run automatic matching for a specific facility and month
 */
export async function runAutomaticMatchingForFacility(
  facilityId: string,
  month: number,
  year: number
): Promise<MatchingSummary> {
  // Get facility info and bank account
  const facilityInfo = await db
    .select({
      facilityName: storageFacilities.facilityName,
      bankAccountId: bankAccount.bankAccountId,
    })
    .from(storageFacilities)
    .innerJoin(
      bankAccount,
      eq(storageFacilities.sitelinkId, bankAccount.sitelinkId)
    )
    .where(eq(storageFacilities.sitelinkId, facilityId))
    .limit(1);

  if (facilityInfo.length === 0) {
    throw new Error(`Facility ${facilityId} not found or has no bank account`);
  }

  const { facilityName, bankAccountId } = facilityInfo[0];

  // Get unmatched transactions and payments
  const [unmatchedTransactions, unmatchedPayments] = await Promise.all([
    getUnmatchedBankTransactions(facilityId, bankAccountId, month, year),
    getUnmatchedDailyPayments(facilityId, month, year),
  ]);

  // Find potential matches
  const potentialMatches = findPotentialMatches(
    unmatchedTransactions,
    unmatchedPayments,
    facilityId,
    bankAccountId
  );

  // Calculate statistics
  const exactMatches = potentialMatches.filter(
    (m) => m.matchType === "exact"
  ).length;
  const closeMatches = potentialMatches.filter(
    (m) => m.matchType === "close"
  ).length;
  const possibleMatches = potentialMatches.filter(
    (m) => m.matchType === "possible"
  ).length;

  return {
    facilityId,
    facilityName,
    bankAccountId,
    totalBankTransactions: unmatchedTransactions.length,
    totalDailyPayments: unmatchedPayments.length,
    exactMatches,
    closeMatches,
    possibleMatches,
    unmatchedBankTransactions:
      unmatchedTransactions.length - potentialMatches.length,
    unmatchedDailyPayments: unmatchedPayments.length - potentialMatches.length,
    potentialMatches,
  };
}

/**
 * Run automatic matching for all facilities for a given month
 */
export async function runAutomaticMatchingForAllFacilities(
  month: number,
  year: number
): Promise<AutoMatchingResult> {
  // Get all facilities
  const facilities = await db.select().from(storageFacilities);

  // Run matching for each facility
  const facilitySummaries = await Promise.all(
    facilities.map((facility) =>
      runAutomaticMatchingForFacility(facility.sitelinkId, month, year)
    )
  );

  // Calculate overall statistics
  const overallStats = {
    totalExactMatches: facilitySummaries.reduce(
      (sum, f) => sum + f.exactMatches,
      0
    ),
    totalCloseMatches: facilitySummaries.reduce(
      (sum, f) => sum + f.closeMatches,
      0
    ),
    totalPossibleMatches: facilitySummaries.reduce(
      (sum, f) => sum + f.possibleMatches,
      0
    ),
    totalUnmatched: facilitySummaries.reduce(
      (sum, f) => sum + f.unmatchedBankTransactions + f.unmatchedDailyPayments,
      0
    ),
    matchingAccuracy: 0,
  };

  const totalMatches =
    overallStats.totalExactMatches +
    overallStats.totalCloseMatches +
    overallStats.totalPossibleMatches;
  const totalItems = totalMatches + overallStats.totalUnmatched;
  overallStats.matchingAccuracy =
    totalItems > 0 ? (totalMatches / totalItems) * 100 : 0;

  return {
    month,
    year,
    facilitySummaries,
    overallStats,
  };
}

/**
 * Get the best matches for manual review (highest confidence matches)
 */
export function getBestMatches(
  matchingResult: AutoMatchingResult,
  minConfidence: number = 0.8,
  maxResults: number = 50
): PotentialMatch[] {
  const allMatches = matchingResult.facilitySummaries
    .flatMap((facility) => facility.potentialMatches)
    .filter((match) => match.matchConfidence >= minConfidence)
    .sort((a, b) => b.matchConfidence - a.matchConfidence)
    .slice(0, maxResults);

  return allMatches;
}

/**
 * Get matches that need manual review (lower confidence matches)
 */
export function getMatchesNeedingReview(
  matchingResult: AutoMatchingResult,
  minConfidence: number = 0.6,
  maxConfidence: number = 0.8
): PotentialMatch[] {
  return matchingResult.facilitySummaries
    .flatMap((facility) => facility.potentialMatches)
    .filter(
      (match) =>
        match.matchConfidence >= minConfidence &&
        match.matchConfidence < maxConfidence
    )
    .sort((a, b) => b.matchConfidence - a.matchConfidence);
}
