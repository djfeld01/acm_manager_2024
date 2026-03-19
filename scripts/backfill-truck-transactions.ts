/**
 * Backfill truck account transactions for 2025–2026.
 *
 * Finds all bank accounts with depositType = "truck", then updates every
 * bankTransaction from those accounts with a transactionDate in 2025 or 2026
 * to have transactionType = "truck".
 *
 * Run with:
 *   npx ts-node --project tsconfig.json -e "require('./scripts/backfill-truck-transactions.ts')"
 * Or simpler:
 *   npx tsx scripts/backfill-truck-transactions.ts
 */

import { db } from "../src/db";
import { bankAccount, bankTransaction } from "../src/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

async function main() {
  // 1. Find all truck bank accounts
  const truckAccounts = await db
    .select({ bankAccountId: bankAccount.bankAccountId, bankName: bankAccount.bankName })
    .from(bankAccount)
    .where(eq(bankAccount.depositType, "truck"));

  if (truckAccounts.length === 0) {
    console.log("No truck accounts found. Nothing to do.");
    return;
  }

  console.log(`Found ${truckAccounts.length} truck account(s):`);
  for (const acct of truckAccounts) {
    console.log(`  - ${acct.bankName} (id: ${acct.bankAccountId})`);
  }

  const truckAccountIds = truckAccounts.map((a) => a.bankAccountId);

  // 2. Preview: count how many transactions will be updated
  const preview = await db
    .select({ count: sql<number>`count(*)` })
    .from(bankTransaction)
    .where(
      sql`${inArray(bankTransaction.bankAccountId, truckAccountIds)}
        AND EXTRACT(YEAR FROM ${bankTransaction.transactionDate}::date) IN (2025, 2026)
        AND ${bankTransaction.transactionType} != 'truck'`
    );

  const count = Number(preview[0]?.count ?? 0);
  console.log(`\n${count} transaction(s) to relabel as "truck".`);

  if (count === 0) {
    console.log("Nothing to update.");
    return;
  }

  // 3. Update them
  const updated = await db
    .update(bankTransaction)
    .set({ transactionType: "truck" })
    .where(
      sql`${inArray(bankTransaction.bankAccountId, truckAccountIds)}
        AND EXTRACT(YEAR FROM ${bankTransaction.transactionDate}::date) IN (2025, 2026)
        AND ${bankTransaction.transactionType} != 'truck'`
    )
    .returning({ id: bankTransaction.bankTransactionId });

  console.log(`✓ Updated ${updated.length} transaction(s) to type "truck".`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
