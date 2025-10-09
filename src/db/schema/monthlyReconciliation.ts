import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  pgEnum,
  text,
  index,
  unique,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import storageFacilities from "./storageFacilities";
import users from "./user";
import bankAccount from "./bankAccount";
import reconciliationDiscrepancies from "./reconciliationDiscrepancies";

// Enum for reconciliation status
export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "in_progress",
  "pending_review",
  "completed",
  "rejected",
]);

export type ReconciliationStatus =
  | "in_progress"
  | "pending_review"
  | "completed"
  | "rejected";

const monthlyReconciliation = pgTable(
  "monthly_reconciliation",
  {
    reconciliationId: serial("reconciliation_id").primaryKey(),

    // Month and year for the reconciliation period
    reconciliationMonth: integer("reconciliation_month").notNull(), // 1-12
    reconciliationYear: integer("reconciliation_year").notNull(),

    // Facility being reconciled
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),

    // Bank account for this reconciliation
    bankAccountId: integer("bank_account_id")
      .notNull()
      .references(() => bankAccount.bankAccountId),

    // Status tracking
    status: reconciliationStatusEnum("status").notNull().default("in_progress"),

    // User tracking
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id), // Office Manager
    reviewedBy: text("reviewed_by").references(() => users.id), // Director of Accounting (Admin)

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    submittedForReviewAt: timestamp("submitted_for_review_at"),
    reviewedAt: timestamp("reviewed_at"),
    completedAt: timestamp("completed_at"),

    // Summary totals for quick reference
    totalExpectedCashCheck: numeric("total_expected_cash_check", {
      precision: 10,
      scale: 2,
    }),
    totalActualCashCheck: numeric("total_actual_cash_check", {
      precision: 10,
      scale: 2,
    }),
    totalExpectedCreditCard: numeric("total_expected_credit_card", {
      precision: 10,
      scale: 2,
    }),
    totalActualCreditCard: numeric("total_actual_credit_card", {
      precision: 10,
      scale: 2,
    }),

    // Match statistics
    totalTransactionsMatched: integer("total_transactions_matched").default(0),
    totalTransactionsUnmatched: integer("total_transactions_unmatched").default(
      0
    ),
    totalDiscrepancies: integer("total_discrepancies").default(0),

    // Optional notes
    notes: text("notes"),
    reviewNotes: text("review_notes"), // Notes from reviewer
  },
  (table) => ({
    // Indexes for performance
    facilityDateIndex: index("monthly_rec_facility_date_idx").on(
      table.facilityId,
      table.reconciliationYear,
      table.reconciliationMonth
    ),
    statusIndex: index("monthly_rec_status_idx").on(table.status),
    createdByIndex: index("monthly_rec_created_by_idx").on(table.createdBy),

    // Unique constraint - one reconciliation per facility per month per bank account
    uniqueReconciliation: unique("unique_facility_bank_month_year").on(
      table.facilityId,
      table.bankAccountId,
      table.reconciliationMonth,
      table.reconciliationYear
    ),
  })
);

// Relations
export const monthlyReconciliationRelations = relations(
  monthlyReconciliation,
  ({ one, many }) => ({
    // Facility relationship
    facility: one(storageFacilities, {
      fields: [monthlyReconciliation.facilityId],
      references: [storageFacilities.sitelinkId],
    }),

    // Bank account relationship
    bankAccount: one(bankAccount, {
      fields: [monthlyReconciliation.bankAccountId],
      references: [bankAccount.bankAccountId],
    }),

    // User relationships
    creator: one(users, {
      fields: [monthlyReconciliation.createdBy],
      references: [users.id],
      relationName: "reconciliation_creator",
    }),
    reviewer: one(users, {
      fields: [monthlyReconciliation.reviewedBy],
      references: [users.id],
      relationName: "reconciliation_reviewer",
    }),

    // Discrepancies relationship (defined here to avoid circular imports)
    discrepancies: many(reconciliationDiscrepancies),
  })
);

export type MonthlyReconciliation = typeof monthlyReconciliation.$inferSelect;
export type CreateMonthlyReconciliation =
  typeof monthlyReconciliation.$inferInsert;

export default monthlyReconciliation;
