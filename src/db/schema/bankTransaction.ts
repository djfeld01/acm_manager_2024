import {
  bigint,
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import {
  bankAccount,
  depositTypes,
  transactionsToDailyPayments,
} from "@/db/schema";
import { relations } from "drizzle-orm";

const bankTransaction = pgTable(
  "bank_transaction",
  {
    bankTransactionId: serial("bank_transaction_id").primaryKey(),
    downloadedId: varchar("downloaded_id").notNull(),
    bankAccountId: integer("bank_account_id")
      .notNull()
      .references(() => bankAccount.bankAccountId),
    transactionDate: date("transaction_date").notNull().defaultNow(),
    transactionType: depositTypes("transaction_type").notNull(),
    transactionAmount: numeric("transaction_amount").notNull(),
    committed: boolean("committed").default(false),
  },
  (t) => ({
    dateIndex: index().on(t.transactionDate),
    accountIndex: index().on(t.bankAccountId),
    unq: unique().on(
      t.bankAccountId,
      t.downloadedId,
      t.transactionAmount,
      t.transactionDate
    ),
  })
);

export const bankTransactionRelation = relations(
  bankTransaction,
  ({ one, many }) => ({
    bankAccount: one(bankAccount, {
      fields: [bankTransaction.bankAccountId],
      references: [bankAccount.bankAccountId],
    }),
    transactionsToDailyPayments: many(transactionsToDailyPayments),
  })
);

export default bankTransaction;
