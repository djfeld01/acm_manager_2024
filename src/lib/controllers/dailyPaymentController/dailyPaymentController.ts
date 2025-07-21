import { db } from "@/db";
import {
  bankAccount,
  bankTransaction,
  dailyPayments,
  transactionsToDailyPayments,
} from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

// Utility to sum CC fields
function getCreditCardTotal(dp: any) {
  return (
    (dp.visa ?? 0) +
    (dp.mastercard ?? 0) +
    (dp.americanExpress ?? 0) +
    (dp.discover ?? 0) +
    (dp.dinersClub ?? 0) +
    (dp.debit ?? 0) +
    (dp.ach ?? 0)
  );
}

function getCashCheckTotal(dp: any) {
  return (dp.cash ?? 0) + (dp.check ?? 0);
}

export async function getDailyPaymentMatchLists(sitelinkId: string) {
  // Get all daily payments for this facility, sorted by date descending
  const dailyPaymentsList = await db
    .select()
    .from(dailyPayments)
    .where(eq(dailyPayments.facilityId, sitelinkId))
    .orderBy(desc(dailyPayments.date));

  // Get bank accounts for this facility
  const bankAccountsList = await db
    .select()
    .from(bankAccount)
    .where(eq(bankAccount.sitelinkId, sitelinkId));

  // Get all bank transactions for this facility's bank accounts, sorted by date descending
  const bankAccountIds = bankAccountsList.map((ba) => ba.bankAccountId);
  const bankTransactionsList =
    bankAccountIds.length > 0
      ? await db
          .select()
          .from(bankTransaction)
          .where(inArray(bankTransaction.bankAccountId, bankAccountIds))
          .orderBy(desc(bankTransaction.transactionDate))
      : [];

  // Get all matches from the join table for this facility
  const bankTransactionIds = bankTransactionsList.map(
    (bt) => bt.bankTransactionId
  );
  const matches = await db
    .select()
    .from(transactionsToDailyPayments)
    .where(
      inArray(transactionsToDailyPayments.bankTransactionId, bankTransactionIds)
    );

  // Build matched lists
  const matchedCash = [];
  const matchedCC = [];
  const unmatchedCash = [];
  const unmatchedCC = [];
  const unmatchedBankTransactions = [...bankTransactionsList];

  for (const dp of dailyPaymentsList) {
    // Find matches for cash/check and cc
    const cashMatch = matches.find(
      (m) => m.dailyPaymentId === dp.Id && m.connectionType === "cash"
    );
    const ccMatch = matches.find(
      (m) => m.dailyPaymentId === dp.Id && m.connectionType === "creditCard"
    );

    if (cashMatch) {
      const bt = bankTransactionsList.find(
        (b) => b.bankTransactionId === cashMatch.bankTransactionId
      );
      if (bt) {
        matchedCash.push({ dailyPayment: dp, bankTransaction: bt });
        // Remove from unmatchedBankTransactions
        const idx = unmatchedBankTransactions.findIndex(
          (b) => b.bankTransactionId === bt.bankTransactionId
        );
        if (idx !== -1) unmatchedBankTransactions.splice(idx, 1);
      }
    } else {
      const cashCheckAmount = getCashCheckTotal(dp);
      if (cashCheckAmount > 0) {
        unmatchedCash.push({ dailyPayment: dp, amount: cashCheckAmount });
      }
    }

    if (ccMatch) {
      const bt = bankTransactionsList.find(
        (b) => b.bankTransactionId === ccMatch.bankTransactionId
      );
      if (bt) {
        matchedCC.push({ dailyPayment: dp, bankTransaction: bt });
        const idx = unmatchedBankTransactions.findIndex(
          (b) => b.bankTransactionId === bt.bankTransactionId
        );
        if (idx !== -1) unmatchedBankTransactions.splice(idx, 1);
      }
    } else {
      const ccAmount = getCreditCardTotal(dp);
      if (ccAmount > 0) {
        unmatchedCC.push({ dailyPayment: dp, amount: ccAmount });
      }
    }
  }

  // Sort final arrays by date descending
  const sortByDateDesc = (a: any, b: any) => {
    const dateA = new Date(a.dailyPayment?.date || a.transactionDate);
    const dateB = new Date(b.dailyPayment?.date || b.transactionDate);
    return dateB.getTime() - dateA.getTime();
  };

  matchedCash.sort(sortByDateDesc);
  matchedCC.sort(sortByDateDesc);
  unmatchedCash.sort(sortByDateDesc);
  unmatchedCC.sort(sortByDateDesc);

  // Sort unmatched bank transactions by transaction date descending
  unmatchedBankTransactions.sort((a, b) => {
    const dateA = new Date(a.transactionDate);
    const dateB = new Date(b.transactionDate);
    return dateB.getTime() - dateA.getTime();
  });

  console.log("Matched Cash:", matchedCash[0]);
  console.log("Matched Credit Cards:", matchedCC[0]);
  console.log("Unmatched Cash/Checks:", unmatchedCash[0]);
  console.log("Unmatched Credit Cards:", unmatchedCC[0]);
  console.log("Unmatched Bank Transactions:", unmatchedBankTransactions[0]);
  return {
    matchedCash,
    matchedCC,
    unmatchedCash,
    unmatchedCC,
    unmatchedBankTransactions,
  };
}

// Add this function to your controller
export async function createMatch(
  dailyPaymentId: number,
  bankTransactionId: number,
  type: "cashCheck" | "creditCard",
  sitelinkId: string
) {
  try {
    await db.insert(transactionsToDailyPayments).values({
      dailyPaymentId: dailyPaymentId,
      bankTransactionId,
      connectionType: type === "cashCheck" ? "cash" : "creditCard",
      amount: 0, // Replace with the actual amount if available
      depositDifference: 0, // Replace with the actual deposit difference if available
      // Add any other required fields that exist in the schema
    });
    return { success: true };
  } catch (error) {
    console.error("Error creating match:", error);
    return { success: false, error };
  }
}

// Add automatic matching function
export async function attemptAutoMatching(sitelinkId: string) {
  const data = await getDailyPaymentMatchLists(sitelinkId);
  const matches = [];

  // Try to match cash/check deposits
  for (const cashDeposit of data.unmatchedCash) {
    const matchingTransaction = data.unmatchedBankTransactions.find(
      (bt) =>
        Math.abs(Number(bt.transactionAmount) - Number(cashDeposit.amount)) <
          0.01 && // Allow for penny differences
        Math.abs(
          new Date(bt.transactionDate).getTime() -
            new Date(cashDeposit.dailyPayment.date).getTime()
        ) <=
          3 * 24 * 60 * 60 * 1000 // Within 3 days
    );

    if (matchingTransaction) {
      const result = await createMatch(
        cashDeposit.dailyPayment.Id,
        matchingTransaction.bankTransactionId,
        "cashCheck",
        sitelinkId
      );
      if (result.success) {
        matches.push({
          type: "cashCheck",
          dailyPayment: cashDeposit.dailyPayment,
          bankTransaction: matchingTransaction,
        });
      }
    }
  }

  // Try to match credit card deposits
  for (const ccDeposit of data.unmatchedCC) {
    const matchingTransaction = data.unmatchedBankTransactions.find(
      (bt) =>
        Math.abs(Number(bt.transactionAmount) - Number(ccDeposit.amount)) <
          0.01 &&
        Math.abs(
          new Date(bt.transactionDate).getTime() -
            new Date(ccDeposit.dailyPayment.date).getTime()
        ) <=
          7 * 24 * 60 * 60 * 1000
    );

    if (matchingTransaction) {
      const result = await createMatch(
        ccDeposit.dailyPayment.Id,
        matchingTransaction.bankTransactionId,
        "creditCard",
        sitelinkId
      );
      if (result.success) {
        matches.push({
          type: "creditCard",
          dailyPayment: ccDeposit.dailyPayment,
          bankTransaction: matchingTransaction,
        });
      }
    }
  }

  return { matchedCount: matches.length, matches };
}
