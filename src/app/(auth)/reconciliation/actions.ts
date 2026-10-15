"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  bankTransaction,
  dailyPayments,
  transactionsToDailyPayments,
  reconciliationDiscrepancies,
  monthlyReconciliation,
} from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { exactCents } from "@/lib/exactCents";

type ConnectionType = "cash" | "creditCard" | "ach";

export type MatchPair = { bankTransactionId: number; dailyPaymentId: number };

function daysBetween(a: string, b: string): number {
  return (
    Math.abs(new Date(a).getTime() - new Date(b).getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

function cardsAmt(p: {
  visa: number;
  mastercard: number;
  americanExpress: number;
  discover: number;
  dinersClub: number;
  debit: number;
}) {
  return (
    p.visa +
    p.mastercard +
    p.americanExpress +
    p.discover +
    p.dinersClub +
    p.debit
  );
}

function sitelinkAmt(
  p: {
    cash: unknown; check: unknown; visa: unknown; mastercard: unknown;
    americanExpress: unknown; discover: unknown; ach: unknown;
    dinersClub: unknown; debit: unknown;
  },
  connectionType: ConnectionType,
): number {
  const f = (v: unknown) => parseFloat((v as string | null)?.toString() ?? "0");
  if (connectionType === "cash") return f(p.cash) + f(p.check);
  if (connectionType === "ach") return f(p.ach);
  return cardsAmt({
    visa: f(p.visa), mastercard: f(p.mastercard), americanExpress: f(p.americanExpress),
    discover: f(p.discover), dinersClub: f(p.dinersClub), debit: f(p.debit),
  });
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
): Promise<{ matched: number; pairs: MatchPair[] }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  if (bankAccountIds.length === 0) return { matched: 0, pairs: [] };

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
      cash: exactCents(dailyPayments.cash),
      check: exactCents(dailyPayments.check),
      visa: exactCents(dailyPayments.visa),
      mastercard: exactCents(dailyPayments.mastercard),
      americanExpress: exactCents(dailyPayments.americanExpress),
      discover: exactCents(dailyPayments.discover),
      ach: exactCents(dailyPayments.ach),
      dinersClub: exactCents(dailyPayments.dinersClub),
      debit: exactCents(dailyPayments.debit),
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
  // Cards and ACH are tracked separately so the same daily payment can match
  // to two different bank CC deposits (one for cards, one for ACH).
  const matchedCardsIds = new Set(
    existingMatches
      .filter((m) => m.connectionType === "creditCard")
      .map((m) => m.dailyPaymentId),
  );
  const matchedAchIds = new Set(
    existingMatches
      .filter((m) => m.connectionType === "ach")
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
    cardsAmt: cardsAmt({
      visa: parseFloat(p.visa?.toString() ?? "0"),
      mastercard: parseFloat(p.mastercard?.toString() ?? "0"),
      americanExpress: parseFloat(p.americanExpress?.toString() ?? "0"),
      discover: parseFloat(p.discover?.toString() ?? "0"),
      dinersClub: parseFloat(p.dinersClub?.toString() ?? "0"),
      debit: parseFloat(p.debit?.toString() ?? "0"),
    }),
    achAmt: parseFloat(p.ach?.toString() ?? "0"),
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
  const usedCardsIds = new Set<number>();
  const usedAchIds = new Set<number>();

  function tryMatch(
    connType: ConnectionType,
    usedPaymentIds: Set<number>,
    matchedPaymentIds: Set<number>,
    getAmt: (p: (typeof payments)[0]) => number,
  ) {
    // ACH deposits arrive at the bank as "creditCard" type — the bank doesn't
    // distinguish. Both cards and ach passes search the same creditCard pool.
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
  tryMatch("creditCard", usedCardsIds, matchedCardsIds, (p) => p.cardsAmt);
  tryMatch("ach", usedAchIds, matchedAchIds, (p) => p.achAmt);

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

  return {
    matched: toCreate.length,
    pairs: toCreate.map((m) => ({
      bankTransactionId: m.bankTransactionId,
      dailyPaymentId: m.dailyPaymentId,
    })),
  };
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
  // One deposit can combine ACH and card days; each payment keeps its own type
  paymentConnectionTypes?: Record<number, ConnectionType>,
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
      cash: exactCents(dailyPayments.cash),
      check: exactCents(dailyPayments.check),
      visa: exactCents(dailyPayments.visa),
      mastercard: exactCents(dailyPayments.mastercard),
      americanExpress: exactCents(dailyPayments.americanExpress),
      discover: exactCents(dailyPayments.discover),
      ach: exactCents(dailyPayments.ach),
      dinersClub: exactCents(dailyPayments.dinersClub),
      debit: exactCents(dailyPayments.debit),
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
      const type = paymentConnectionTypes?.[p.dailyPaymentId] ?? connectionType;
      const amt = sitelinkAmt(p, type);
      records.push({
        bankTransactionId: bankId,
        dailyPaymentId: p.dailyPaymentId,
        connectionType: type,
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

// ─── Match with discrepancy ────────────────────────────────────────────────
// Same as createMatchesAction but also records an explanation for the
// amount difference in the reconciliation_discrepancies table.

export type DiscrepancyType =
  | "bank_fee"
  | "timing_difference"
  | "refund"
  | "error"
  | "multi_day_combination"
  | "other";

export async function createMatchWithDiscrepancyAction(
  bankTransactionIds: number[],
  dailyPaymentIds: number[],
  connectionType: ConnectionType,
  facilityId: string,
  reconciliationId: number,
  discrepancyType: DiscrepancyType,
  note: string,
  paymentConnectionTypes?: Record<number, ConnectionType>,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (bankTransactionIds.length === 0 || dailyPaymentIds.length === 0) return;
  if (!note.trim()) throw new Error("A note is required for discrepancy matches");

  // Fetch actual amounts (same logic as createMatchesAction)
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
      cash: exactCents(dailyPayments.cash),
      check: exactCents(dailyPayments.check),
      visa: exactCents(dailyPayments.visa),
      mastercard: exactCents(dailyPayments.mastercard),
      americanExpress: exactCents(dailyPayments.americanExpress),
      discover: exactCents(dailyPayments.discover),
      ach: exactCents(dailyPayments.ach),
      dinersClub: exactCents(dailyPayments.dinersClub),
      debit: exactCents(dailyPayments.debit),
    })
    .from(dailyPayments)
    .where(inArray(dailyPayments.Id, dailyPaymentIds));

  const totalBank = bankTxns.reduce(
    (s, t) => s + parseFloat(t.amount?.toString() ?? "0"),
    0,
  );
  const totalSitelink = payments.reduce(
    (s, p) =>
      s + sitelinkAmt(p, paymentConnectionTypes?.[p.dailyPaymentId] ?? connectionType),
    0,
  );

  const difference = totalBank - totalSitelink;

  // Build match records
  const records: {
    bankTransactionId: number;
    dailyPaymentId: number;
    connectionType: ConnectionType;
    amount: number;
    depositDifference: number;
    reconciliationNotes: string;
  }[] = [];

  if (bankTransactionIds.length === 1) {
    const bankId = bankTransactionIds[0];
    for (const p of payments) {
      const type = paymentConnectionTypes?.[p.dailyPaymentId] ?? connectionType;
      const amt = sitelinkAmt(p, type);
      records.push({
        bankTransactionId: bankId,
        dailyPaymentId: p.dailyPaymentId,
        connectionType: type,
        amount: amt,
        depositDifference: difference,
        reconciliationNotes: note,
      });
    }
  } else {
    const paymentId = dailyPaymentIds[0];
    for (const t of bankTxns) {
      records.push({
        bankTransactionId: t.bankTransactionId,
        dailyPaymentId: paymentId,
        connectionType,
        amount: parseFloat(t.amount?.toString() ?? "0"),
        depositDifference: difference,
        reconciliationNotes: note,
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

  // Record the discrepancy for review
  await db.insert(reconciliationDiscrepancies).values({
    reconciliationId,
    discrepancyType,
    description: note,
    amount: Math.abs(difference).toFixed(2),
    status: "pending_approval",
    createdBy: session.user.id,
    createdAt: new Date(),
    referenceTransactionIds: JSON.stringify(bankTransactionIds),
    referenceDailyPaymentIds: JSON.stringify(dailyPaymentIds),
  });
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

// Removes the whole match a row belongs to. Split matches are stored as one
// link per row (1 bank → N payments, or N bank → 1 payment), so unmatching a
// single link would leave the rest of the split half-matched. Also drops the
// pending discrepancy recorded by "Match with Note" for that match.
export async function unmatchGroupAction(
  bankTransactionId: number,
  dailyPaymentId: number,
): Promise<{ removed: number }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [link] = await db
    .select({ connectionType: transactionsToDailyPayments.connectionType })
    .from(transactionsToDailyPayments)
    .where(
      and(
        eq(transactionsToDailyPayments.bankTransactionId, bankTransactionId),
        eq(transactionsToDailyPayments.dailyPaymentId, dailyPaymentId),
      ),
    );
  if (!link) return { removed: 0 };

  // Cards and ACH can share one deposit, so treat them as one family here
  const sameType = inArray(
    transactionsToDailyPayments.connectionType,
    link.connectionType === "cash" ? ["cash"] : ["creditCard", "ach"],
  );
  const bankLinks = await db
    .select({
      bankTransactionId: transactionsToDailyPayments.bankTransactionId,
      dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
    })
    .from(transactionsToDailyPayments)
    .where(and(sameType, eq(transactionsToDailyPayments.bankTransactionId, bankTransactionId)));

  // 1 bank → N payments groups by the bank side; otherwise by the payment side
  const group =
    bankLinks.length > 1
      ? bankLinks
      : await db
          .select({
            bankTransactionId: transactionsToDailyPayments.bankTransactionId,
            dailyPaymentId: transactionsToDailyPayments.dailyPaymentId,
          })
          .from(transactionsToDailyPayments)
          .where(and(sameType, eq(transactionsToDailyPayments.dailyPaymentId, dailyPaymentId)));

  const bankIds = [...new Set(group.map((g) => g.bankTransactionId))];
  const paymentIds = [...new Set(group.map((g) => g.dailyPaymentId))];

  await db
    .delete(transactionsToDailyPayments)
    .where(
      and(
        sameType,
        inArray(transactionsToDailyPayments.bankTransactionId, bankIds),
        inArray(transactionsToDailyPayments.dailyPaymentId, paymentIds),
      ),
    );

  // Discrepancies only store their transaction ids as JSON text, so match in JS
  const pending = await db
    .select({
      discrepancyId: reconciliationDiscrepancies.discrepancyId,
      referenceTransactionIds: reconciliationDiscrepancies.referenceTransactionIds,
      referenceDailyPaymentIds: reconciliationDiscrepancies.referenceDailyPaymentIds,
    })
    .from(reconciliationDiscrepancies)
    .where(eq(reconciliationDiscrepancies.status, "pending_approval"));

  const parseIds = (raw: string | null) => {
    try {
      return (JSON.parse(raw ?? "[]") as unknown[]).map(Number);
    } catch {
      return [];
    }
  };
  const staleIds = pending
    .filter(
      (d) =>
        parseIds(d.referenceTransactionIds).some((id) => bankIds.includes(id)) &&
        parseIds(d.referenceDailyPaymentIds).some((id) => paymentIds.includes(id)),
    )
    .map((d) => d.discrepancyId);
  if (staleIds.length > 0) {
    await db
      .delete(reconciliationDiscrepancies)
      .where(inArray(reconciliationDiscrepancies.discrepancyId, staleIds));
  }

  return { removed: group.length };
}

// Undo for a just-run auto-match. Only removes links still marked automatic,
// so anything the user re-matched by hand in the meantime is left alone.
export async function undoAutoMatchAction(pairs: MatchPair[]): Promise<{ removed: number }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  let removed = 0;
  for (const p of pairs) {
    const rows = await db
      .delete(transactionsToDailyPayments)
      .where(
        and(
          eq(transactionsToDailyPayments.bankTransactionId, p.bankTransactionId),
          eq(transactionsToDailyPayments.dailyPaymentId, p.dailyPaymentId),
          eq(transactionsToDailyPayments.matchType, "automatic"),
        ),
      )
      .returning({ id: transactionsToDailyPayments.bankTransactionId });
    removed += rows.length;
  }
  return { removed };
}

// ─── Finalization actions ──────────────────────────────────────────────────

// Ashley (Office Manager / Manager): in_progress → pending_review
export async function submitForReviewAction(reconciliationId: number): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(monthlyReconciliation)
    .set({
      status: "pending_review",
      submittedForReviewAt: new Date(),
    })
    .where(eq(monthlyReconciliation.reconciliationId, reconciliationId));
}

// David (Accounting Manager / Admin / Owner): pending_review → completed
export async function markCompleteAction(
  reconciliationId: number,
  notes?: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(monthlyReconciliation)
    .set({
      status: "completed",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      completedAt: new Date(),
      ...(notes ? { reviewNotes: notes } : {}),
    })
    .where(eq(monthlyReconciliation.reconciliationId, reconciliationId));
}

// David: pending_review → in_progress (send back for changes)
export async function requestChangesAction(
  reconciliationId: number,
  notes?: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(monthlyReconciliation)
    .set({
      status: "in_progress",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      ...(notes ? { reviewNotes: notes } : {}),
    })
    .where(eq(monthlyReconciliation.reconciliationId, reconciliationId));
}

// David: approve a single discrepancy
export async function approveDiscrepancyAction(
  discrepancyId: number,
  notes?: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(reconciliationDiscrepancies)
    .set({
      status: "approved",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      ...(notes ? { approvalNotes: notes } : {}),
    })
    .where(eq(reconciliationDiscrepancies.discrepancyId, discrepancyId));
}

// David: reject a single discrepancy (sends it back as rejected)
export async function rejectDiscrepancyAction(
  discrepancyId: number,
  notes?: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(reconciliationDiscrepancies)
    .set({
      status: "rejected",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      ...(notes ? { approvalNotes: notes } : {}),
    })
    .where(eq(reconciliationDiscrepancies.discrepancyId, discrepancyId));
}

// ─── Recategorize bank transaction ────────────────────────────────────────

export async function recategorizeTransactionAction(
  bankTransactionId: number,
  newType: "cash" | "creditCard" | "truck" | "other",
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(bankTransaction)
    .set({ transactionType: newType })
    .where(eq(bankTransaction.bankTransactionId, bankTransactionId));
}
