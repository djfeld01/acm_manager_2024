"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  bankTransaction,
  dailyPayments,
  transactionsToDailyPayments,
} from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

type ConnectionType = "cash" | "creditCard";

function daysBetween(a: string, b: string): number {
  return (
    Math.abs(new Date(a).getTime() - new Date(b).getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

function ccAmt(p: {
  visa: number;
  mastercard: number;
  americanExpress: number;
  discover: number;
  ach: number;
  dinersClub: number;
  debit: number;
}) {
  return (
    p.visa +
    p.mastercard +
    p.americanExpress +
    p.discover +
    p.ach +
    p.dinersClub +
    p.debit
  );
}

// ─── Auto-match server action ──────────────────────────────────────────────
// Replaces the broken /api/reconciliation/auto-match/run which requires
// perfect same-day same-amount matches. This version allows ±5 day tolerance
// and also tries combining consecutive daily payments to match a single bank
// deposit (multi-day rollup).

export async function autoMatchAction(
  facilityId: string,
  bankAccountIds: number[],
  month: number,
  year: number,
): Promise<{ matched: number }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (bankAccountIds.length === 0) return { matched: 0 };

  // Date windows
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endOfMonth = new Date(year, month, 0); // last day of the month
  const sitelinkEndDate = endOfMonth.toISOString().split("T")[0];

  // Extended window for bank transactions: up to 10 days into next month
  const extendedEnd = new Date(endOfMonth);
  extendedEnd.setDate(extendedEnd.getDate() + 10);
  const bankEndDate = extendedEnd.toISOString().split("T")[0];

  // Fetch bank transactions (extended window)
  const rawBankTxns = await db
    .select({
      bankTransactionId: bankTransaction.bankTransactionId,
      transactionDate: bankTransaction.transactionDate,
      transactionType: bankTransaction.transactionType,
      transactionAmount: bankTransaction.transactionAmount,
    })
    .from(bankTransaction)
    .where(
      and(
        inArray(bankTransaction.bankAccountId, bankAccountIds),
        sql`${bankTransaction.transactionDate} >= ${startDate}`,
        sql`${bankTransaction.transactionDate} <= ${bankEndDate}`,
      ),
    );

  // Fetch daily payments (just the month)
  const rawPayments = await db
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
        sql`${dailyPayments.date} <= ${sitelinkEndDate}`,
      ),
    );

  // Fetch existing matches
  const bankIds = rawBankTxns.map((t) => t.bankTransactionId);
  const existingMatches =
    bankIds.length > 0
      ? await db
          .select({
            bankTransactionId: transactionsToDailyPayments.bankTransactionId,
            dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
            connectionType: transactionsToDailyPayments.connectionType,
          })
          .from(transactionsToDailyPayments)
          .where(inArray(transactionsToDailyPayments.bankTransactionId, bankIds))
      : [];

  // Build matched sets
  const matchedBankIds = new Set(existingMatches.map((m) => m.bankTransactionId));
  const matchedCashIds = new Set(
    existingMatches
      .filter((m) => m.connectionType === "cash")
      .map((m) => m.dailyPaymentId),
  );
  const matchedCCIds = new Set(
    existingMatches
      .filter((m) => m.connectionType === "creditCard")
      .map((m) => m.dailyPaymentId),
  );

  // Normalize amounts
  const bankTxns = rawBankTxns.map((t) => ({
    ...t,
    transactionDate: t.transactionDate ?? "",
    amount: parseFloat(t.transactionAmount?.toString() ?? "0"),
  }));

  const payments = rawPayments.map((p) => ({
    dailyPaymentId: p.dailyPaymentId,
    date: p.date ?? "",
    cashAmt: parseFloat(p.cash?.toString() ?? "0") + parseFloat(p.check?.toString() ?? "0"),
    ccAmt: ccAmt({
      visa: parseFloat(p.visa?.toString() ?? "0"),
      mastercard: parseFloat(p.mastercard?.toString() ?? "0"),
      americanExpress: parseFloat(p.americanExpress?.toString() ?? "0"),
      discover: parseFloat(p.discover?.toString() ?? "0"),
      ach: parseFloat(p.ach?.toString() ?? "0"),
      dinersClub: parseFloat(p.dinersClub?.toString() ?? "0"),
      debit: parseFloat(p.debit?.toString() ?? "0"),
    }),
  }));

  type NewMatch = {
    bankTransactionId: number;
    dailyPaymentId: number;
    connectionType: ConnectionType;
    amount: number;
  };

  const toCreate: NewMatch[] = [];
  const usedBankIds = new Set<number>();
  const usedCashIds = new Set<number>();
  const usedCCIds = new Set<number>();

  function tryMatch(
    connType: ConnectionType,
    usedPaymentIds: Set<number>,
    matchedPaymentIds: Set<number>,
    getAmt: (p: (typeof payments)[0]) => number,
  ) {
    const txnType = connType === "cash" ? "cash" : "creditCard";

    const unmatchedBank = bankTxns.filter(
      (t) =>
        t.transactionType === txnType &&
        !matchedBankIds.has(t.bankTransactionId) &&
        !usedBankIds.has(t.bankTransactionId),
    );

    const unmatchedPayments = payments.filter(
      (p) =>
        getAmt(p) > 0 &&
        !matchedPaymentIds.has(p.dailyPaymentId) &&
        !usedPaymentIds.has(p.dailyPaymentId),
    );

    // Phase 1: 1:1 exact amount, closest date within ±5 days
    for (const txn of unmatchedBank) {
      if (usedBankIds.has(txn.bankTransactionId)) continue;

      let bestPayment: (typeof payments)[0] | null = null;
      let bestDays = 6;

      for (const p of unmatchedPayments) {
        if (usedPaymentIds.has(p.dailyPaymentId)) continue;
        if (Math.abs(getAmt(p) - txn.amount) > 0.02) continue;
        const days = daysBetween(txn.transactionDate, p.date);
        if (days <= 5 && days < bestDays) {
          bestPayment = p;
          bestDays = days;
        }
      }

      if (bestPayment) {
        toCreate.push({
          bankTransactionId: txn.bankTransactionId,
          dailyPaymentId: bestPayment.dailyPaymentId,
          connectionType: connType,
          amount: txn.amount,
        });
        usedBankIds.add(txn.bankTransactionId);
        usedPaymentIds.add(bestPayment.dailyPaymentId);
      }
    }

    // Phase 2: Multi-day rollup — one bank deposit = sum of 2-3 consecutive
    // daily payments (e.g. manager combines two days' cash into one trip)
    const stillUnmatchedBank = bankTxns.filter(
      (t) =>
        t.transactionType === txnType &&
        !matchedBankIds.has(t.bankTransactionId) &&
        !usedBankIds.has(t.bankTransactionId),
    );
    const stillUnmatchedPayments = unmatchedPayments.filter(
      (p) => !usedPaymentIds.has(p.dailyPaymentId),
    );

    // Sort payments by date for consecutive-day search
    const sortedPayments = [...stillUnmatchedPayments].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    for (const txn of stillUnmatchedBank) {
      if (usedBankIds.has(txn.bankTransactionId)) continue;

      let found = false;

      // Try pairs
      for (let i = 0; i < sortedPayments.length && !found; i++) {
        const p1 = sortedPayments[i];
        if (usedPaymentIds.has(p1.dailyPaymentId)) continue;
        if (daysBetween(txn.transactionDate, p1.date) > 8) continue;

        for (let j = i + 1; j < sortedPayments.length && !found; j++) {
          const p2 = sortedPayments[j];
          if (usedPaymentIds.has(p2.dailyPaymentId)) continue;
          if (daysBetween(p1.date, p2.date) > 6) break; // too far apart
          if (daysBetween(txn.transactionDate, p2.date) > 8) continue;

          const pairSum = getAmt(p1) + getAmt(p2);
          if (Math.abs(pairSum - txn.amount) <= 0.02) {
            toCreate.push(
              {
                bankTransactionId: txn.bankTransactionId,
                dailyPaymentId: p1.dailyPaymentId,
                connectionType: connType,
                amount: getAmt(p1),
              },
              {
                bankTransactionId: txn.bankTransactionId,
                dailyPaymentId: p2.dailyPaymentId,
                connectionType: connType,
                amount: getAmt(p2),
              },
            );
            usedBankIds.add(txn.bankTransactionId);
            usedPaymentIds.add(p1.dailyPaymentId);
            usedPaymentIds.add(p2.dailyPaymentId);
            found = true;
          }

          // Try triples
          if (!found) {
            for (let k = j + 1; k < sortedPayments.length; k++) {
              const p3 = sortedPayments[k];
              if (usedPaymentIds.has(p3.dailyPaymentId)) continue;
              if (daysBetween(p2.date, p3.date) > 6) break;
              if (daysBetween(txn.transactionDate, p3.date) > 10) continue;

              const tripleSum = getAmt(p1) + getAmt(p2) + getAmt(p3);
              if (Math.abs(tripleSum - txn.amount) <= 0.02) {
                toCreate.push(
                  {
                    bankTransactionId: txn.bankTransactionId,
                    dailyPaymentId: p1.dailyPaymentId,
                    connectionType: connType,
                    amount: getAmt(p1),
                  },
                  {
                    bankTransactionId: txn.bankTransactionId,
                    dailyPaymentId: p2.dailyPaymentId,
                    connectionType: connType,
                    amount: getAmt(p2),
                  },
                  {
                    bankTransactionId: txn.bankTransactionId,
                    dailyPaymentId: p3.dailyPaymentId,
                    connectionType: connType,
                    amount: getAmt(p3),
                  },
                );
                usedBankIds.add(txn.bankTransactionId);
                usedPaymentIds.add(p1.dailyPaymentId);
                usedPaymentIds.add(p2.dailyPaymentId);
                usedPaymentIds.add(p3.dailyPaymentId);
                found = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  tryMatch("cash", usedCashIds, matchedCashIds, (p) => p.cashAmt);
  tryMatch("creditCard", usedCCIds, matchedCCIds, (p) => p.ccAmt);

  if (toCreate.length > 0) {
    await db.insert(transactionsToDailyPayments).values(
      toCreate.map((m) => ({
        bankTransactionId: m.bankTransactionId,
        dailyPaymentId: m.dailyPaymentId,
        connectionType: m.connectionType,
        amount: m.amount,
        depositDifference: 0,
        matchType: "automatic" as const,
        isManualMatch: false,
        matchedBy: session.user.id,
        matchedAt: new Date(),
      })),
    );
  }

  return { matched: toCreate.length };
}

// ─── Manual multi-match server action ─────────────────────────────────────
// Supports:
//   - 1 bank → N sitelink  (N daily payments combined into one deposit)
//   - N bank → 1 sitelink  (one large SiteLink entry split across bank deposits)
// The amounts array provides how much of each daily payment maps to each bank txn.

export async function createMatchesAction(
  bankTransactionIds: number[],
  dailyPaymentIds: number[],
  connectionType: ConnectionType,
  facilityId: string, // unused but kept for future audit
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (bankTransactionIds.length === 0 || dailyPaymentIds.length === 0) return;

  // Fetch actual amounts
  const bankTxns = await db
    .select({
      bankTransactionId: bankTransaction.bankTransactionId,
      amount: bankTransaction.transactionAmount,
    })
    .from(bankTransaction)
    .where(inArray(bankTransaction.bankTransactionId, bankTransactionIds));

  const payments = await db
    .select({
      dailyPaymentId: dailyPayments.Id,
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
    .where(inArray(dailyPayments.Id, dailyPaymentIds));

  const records: {
    bankTransactionId: number;
    dailyPaymentId: number;
    connectionType: ConnectionType;
    amount: number;
    depositDifference: number;
  }[] = [];

  if (bankTransactionIds.length === 1) {
    // 1 bank → N sitelink: each sitelink entry maps to this bank transaction
    const bankId = bankTransactionIds[0];
    for (const p of payments) {
      const amt =
        connectionType === "cash"
          ? parseFloat(p.cash?.toString() ?? "0") +
            parseFloat(p.check?.toString() ?? "0")
          : ccAmt({
              visa: parseFloat(p.visa?.toString() ?? "0"),
              mastercard: parseFloat(p.mastercard?.toString() ?? "0"),
              americanExpress: parseFloat(p.americanExpress?.toString() ?? "0"),
              discover: parseFloat(p.discover?.toString() ?? "0"),
              ach: parseFloat(p.ach?.toString() ?? "0"),
              dinersClub: parseFloat(p.dinersClub?.toString() ?? "0"),
              debit: parseFloat(p.debit?.toString() ?? "0"),
            });
      records.push({
        bankTransactionId: bankId,
        dailyPaymentId: p.dailyPaymentId,
        connectionType,
        amount: amt,
        depositDifference: 0,
      });
    }
  } else {
    // N bank → 1 sitelink: each bank transaction maps to this daily payment
    const paymentId = dailyPaymentIds[0];
    for (const t of bankTxns) {
      records.push({
        bankTransactionId: t.bankTransactionId,
        dailyPaymentId: paymentId,
        connectionType,
        amount: parseFloat(t.amount?.toString() ?? "0"),
        depositDifference: 0,
      });
    }
  }

  if (records.length > 0) {
    await db.insert(transactionsToDailyPayments).values(
      records.map((r) => ({
        ...r,
        matchType: "manual" as const,
        isManualMatch: true,
        matchedBy: session.user.id,
        matchedAt: new Date(),
      })),
    );
  }
}

// ─── Unmatch action ────────────────────────────────────────────────────────

export async function unmatchAction(
  bankTransactionId: number,
  dailyPaymentId: number,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .delete(transactionsToDailyPayments)
    .where(
      and(
        eq(transactionsToDailyPayments.bankTransactionId, bankTransactionId),
        eq(transactionsToDailyPayments.dailyPaymentId, dailyPaymentId),
      ),
    );
}
