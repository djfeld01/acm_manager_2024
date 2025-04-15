import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  varchar,
} from "drizzle-orm/pg-core";
import bankTransaction from "./bankTransaction";
import dailyPayments from "./dailyPayments";
import { relations } from "drizzle-orm";

export const connectionTypes = pgEnum("connection_types", [
  "cash",
  "creditCard",
]);
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
  },
  (table) => ({
    pkConnection: primaryKey({
      columns: [table.bankTransactionId, table.dailyPaymentId],
    }),
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
  })
);

export default transactionsToDailyPayments;
