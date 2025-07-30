"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  bankBalance,
  bankTransaction,
  dailyManagementActivity,
  dailyPayments,
  monthlyGoals,
  storageFacilities,
  transactionsToDailyPayments,
} from "@/db/schema";
import { ParsedBankFile } from "@/lib/parseBankDownloads";
import { and, eq, gt, lt } from "drizzle-orm";

export async function getFacilityHeaderData(sitelinkId: string) {
  const session = await auth();
  if (!session || !session.user) {
    return;
  }
  const { user } = session;

  const facility = await db.query.storageFacilities.findFirst({
    where: (storageFacilities, { eq }) =>
      eq(storageFacilities.sitelinkId, sitelinkId),
  });

  return facility;
}

export async function getRentalGoalData(sitelinkId: string) {
  const date = new Date();
  const goalsDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const session = await auth();
  if (!session || !session.user) {
    return;
  }
  const { user } = session;

  const rentalGoal = await db.query.monthlyGoals.findFirst({
    where: (monthlyGoals, { and, eq }) =>
      and(
        eq(monthlyGoals.sitelinkId, sitelinkId),
        eq(monthlyGoals.month, goalsDate)
      ),
    columns: { rentalGoal: true },
  });

  const monthlyRentals = await db.query.dailyManagementActivity.findFirst({
    where: (dailyManagementActivity, { and, eq }) =>
      and(
        eq(dailyManagementActivity.facilityId, sitelinkId),
        eq(dailyManagementActivity.activityType, "Move-Ins")
      ),
    orderBy: (dailyManagementActivity, { desc }) =>
      desc(dailyManagementActivity.date),
    columns: { monthlyTotal: true },
  });
  console.log("🚀 ~ getRentalGoalData ~ monthlyRentals:", monthlyRentals);

  return {
    rentalGoal: rentalGoal?.rentalGoal || 0,
    monthlyRentals: monthlyRentals?.monthlyTotal || 0,
  };
}

export async function addBankTransactions(data: ParsedBankFile[]) {
  const result = await Promise.all(
    data.map(async (file) => {
      const bankAccount = await db.query.bankAccount.findFirst({
        where: (bankAccount, { and, eq }) =>
          and(
            eq(bankAccount.bankAccountNumber, file.accountNumber),
            eq(bankAccount.bankRoutingNumber, file.routingNumber)
          ),
        columns: { bankAccountId: true },
      });
      if (!bankAccount?.bankAccountId) {
        return "ERROR: Bank Account not found";
      }
      const transactions = file.deposits.map((deposit) => {
        return {
          bankAccountId: bankAccount?.bankAccountId,
          downloadedId: deposit.transactionId,
          transactionAmount: deposit.transactionAmount.toString(),
          transactionDate: deposit.transactionDate.toISOString(),
          transactionType: deposit.transactionType,
        };
      });
      const addBalance = await db
        .insert(bankBalance)
        .values({
          bankAccountId: bankAccount?.bankAccountId,
          date: file.balanceDate.toISOString(),
          balance: file.availableBalance.toString(),
        })
        .onConflictDoNothing();
      if (transactions.length > 0) {
        const result = await db
          .insert(bankTransaction)
          .values(transactions)
          .onConflictDoNothing()
          .returning({ id: bankTransaction.bankTransactionId });
        return result;
      } else {
        return "transactions empty";
      }
    })
  );
  return result;
}

export async function commitTransactions(transactionsToCommit: any[]) {
  const session = await auth();
  if (!session || !session.user) {
    return;
  }
  // const creditCardDailyDeposits = transactionsToCommit.filter(
  //   (transaction) =>
  //     transaction.connectionType === "creditCard" &&
  //     transaction.depositDifference < 0.01 &&
  //     transaction.depositDifference > -0.01
  // );
  // const cashCheckDailyDeposits = transactionsToCommit.filter(
  //   (transaction) =>
  //     transaction.connectionType === "cash" &&
  //     transaction.depositDifference < 0.01 &&
  //     transaction.depositDifference > -0.01
  // );

  const result = await db
    .insert(transactionsToDailyPayments)
    .values(transactionsToCommit)
    .onConflictDoNothing()
    .returning({ id: bankTransaction.bankTransactionId });

  const updateCashDailyPayments = await db
    .update(dailyPayments)
    .set({ cashCheckCommitted: true })
    .from(transactionsToDailyPayments)
    .where(
      and(
        eq(transactionsToDailyPayments.dailyPaymentId, dailyPayments.Id),
        eq(transactionsToDailyPayments.connectionType, "cash"),
        lt(transactionsToDailyPayments.depositDifference, 0.01),
        gt(transactionsToDailyPayments.depositDifference, -0.01)
      )
    )
    .returning({
      id: dailyPayments.Id,
      cashCheckCommitted: dailyPayments.cashCheckCommitted,
    });

  console.log(
    "🚀 ~ updateCashDailyPayments ~ result:",
    updateCashDailyPayments
  );

  const updateCreditCardPayments = await db
    .update(dailyPayments)
    .set({ creditCardCommitted: true })
    .from(transactionsToDailyPayments)
    .where(
      and(
        eq(transactionsToDailyPayments.dailyPaymentId, dailyPayments.Id),
        eq(transactionsToDailyPayments.connectionType, "creditCard"),
        lt(transactionsToDailyPayments.depositDifference, 0.01),
        gt(transactionsToDailyPayments.depositDifference, -0.01)
      )
    )
    .returning({
      id: dailyPayments.Id,
      creditCardCommitted: dailyPayments.creditCardCommitted,
    });

  console.log(
    "🚀 ~ updateCreditCardPayments ~ result:",
    updateCreditCardPayments
  );

  return result;
}
