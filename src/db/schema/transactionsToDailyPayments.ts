import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import bankTransaction from "./bankTransaction";
import dailyPayments from "./dailyPayments";
import monthlyReconciliation from "./monthlyReconciliation";
import users from "./user";
import { relations } from "drizzle-orm";

export const connectionTypes = pgEnum("connection_types", [
  "cash",
  "creditCard",
]);

// Enum for match types
export const matchTypeEnum = pgEnum("match_type", [
  "automatic",
  "manual",
  "partial",
]);

export type MatchType = "automatic" | "manual" | "partial";

const transactionsToDailyPayments = pgTable(
  "transactions_to_daily_payments",
  {
    bankTransactionId: integer("bank_transaction_id")
      .references(() => bankTransaction.bankTransactionId, {
        onDelete: "cascade",
      })
      .notNull(),
    dailyPaymentId: integer("daily_payment_id")
      .references(() => dailyPayments.Id, { onDelete: "cascade" })
      .notNull(),
    amount: real("amount").notNull(),
    depositDifference: real("deposit_difference").notNull(),
    connectionType: connectionTypes("connection_type").notNull(),
    note: varchar("note"),

    // New reconciliation tracking fields
    reconciliationId: integer("reconciliation_id").references(
      () => monthlyReconciliation.reconciliationId
    ),

    // Match tracking
    matchType: matchTypeEnum("match_type").notNull().default("manual"),
    isManualMatch: boolean("is_manual_match").notNull().default(true),
    matchConfidence: real("match_confidence"), // 0.0 to 1.0 for automatic matches

    // Audit trail
    matchedBy: text("matched_by").references(() => users.id),
    matchedAt: timestamp("matched_at").defaultNow(),

    // Additional notes for complex matches
    reconciliationNotes: text("reconciliation_notes"),
  },
  (table) => ({
    pkConnection: primaryKey({
      columns: [table.bankTransactionId, table.dailyPaymentId],
    }),

    // New indexes for reconciliation queries
    reconciliationIndex: index("ttdp_reconciliation_idx").on(
      table.reconciliationId
    ),
    matchTypeIndex: index("ttdp_match_type_idx").on(table.matchType),
    matchedByIndex: index("ttdp_matched_by_idx").on(table.matchedBy),
    matchedAtIndex: index("ttdp_matched_at_idx").on(table.matchedAt),
  })
);

export const transactionsToDailyPaymentsRelations = relations(
  transactionsToDailyPayments,
  ({ one }) => ({
    transaction: one(bankTransaction, {
      fields: [transactionsToDailyPayments.bankTransactionId],
      references: [bankTransaction.bankTransactionId],
    }),
    dailyPayment: one(dailyPayments, {
      fields: [transactionsToDailyPayments.dailyPaymentId],
      references: [dailyPayments.Id],
    }),

    // New relationships
    reconciliation: one(monthlyReconciliation, {
      fields: [transactionsToDailyPayments.reconciliationId],
      references: [monthlyReconciliation.reconciliationId],
    }),
    matcher: one(users, {
      fields: [transactionsToDailyPayments.matchedBy],
      references: [users.id],
    }),
  })
);

export type TransactionToDailyPayment =
  typeof transactionsToDailyPayments.$inferSelect;
export type CreateTransactionToDailyPayment =
  typeof transactionsToDailyPayments.$inferInsert;

export default transactionsToDailyPayments;
