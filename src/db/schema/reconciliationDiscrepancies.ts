import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import monthlyReconciliation from "./monthlyReconciliation";
import users from "./user";

// Enum for discrepancy types
export const discrepancyTypeEnum = pgEnum("discrepancy_type", [
  "multi_day_combination",
  "refund",
  "error",
  "timing_difference",
  "bank_fee",
  "other",
]);

export type DiscrepancyType =
  | "multi_day_combination"
  | "refund"
  | "error"
  | "timing_difference"
  | "bank_fee"
  | "other";

// Enum for discrepancy status
export const discrepancyStatusEnum = pgEnum("discrepancy_status", [
  "pending_approval",
  "approved",
  "rejected",
  "resolved",
]);

export type DiscrepancyStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "resolved";

const reconciliationDiscrepancies = pgTable(
  "reconciliation_discrepancies",
  {
    discrepancyId: serial("discrepancy_id").primaryKey(),

    // Link to the monthly reconciliation
    reconciliationId: integer("reconciliation_id")
      .notNull()
      .references(() => monthlyReconciliation.reconciliationId, {
        onDelete: "cascade",
      }),

    // Discrepancy details
    discrepancyType: discrepancyTypeEnum("discrepancy_type").notNull(),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

    // Status tracking
    status: discrepancyStatusEnum("status")
      .notNull()
      .default("pending_approval"),

    // User tracking
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id), // Office Manager who identified the discrepancy
    approvedBy: text("approved_by").references(() => users.id), // Director of Accounting who approved/rejected

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    approvedAt: timestamp("approved_at"),
    resolvedAt: timestamp("resolved_at"),

    // Additional details
    notes: text("notes"), // Additional notes from creator
    approvalNotes: text("approval_notes"), // Notes from approver

    // Reference information (optional)
    referenceTransactionIds: text("reference_transaction_ids"), // JSON array of related transaction IDs
    referenceDailyPaymentIds: text("reference_daily_payment_ids"), // JSON array of related daily payment IDs

    // Flag for critical discrepancies that need immediate attention
    isCritical: boolean("is_critical").default(false),
  },
  (table) => ({
    // Indexes for performance
    reconciliationIndex: index("discrepancy_reconciliation_idx").on(
      table.reconciliationId
    ),
    statusIndex: index("discrepancy_status_idx").on(table.status),
    typeIndex: index("discrepancy_type_idx").on(table.discrepancyType),
    createdByIndex: index("discrepancy_created_by_idx").on(table.createdBy),
    approvedByIndex: index("discrepancy_approved_by_idx").on(table.approvedBy),
    criticalIndex: index("discrepancy_critical_idx").on(table.isCritical),
  })
);

// Relations
export const reconciliationDiscrepanciesRelations = relations(
  reconciliationDiscrepancies,
  ({ one }) => ({
    // Monthly reconciliation relationship
    reconciliation: one(monthlyReconciliation, {
      fields: [reconciliationDiscrepancies.reconciliationId],
      references: [monthlyReconciliation.reconciliationId],
    }),

    // User relationships
    creator: one(users, {
      fields: [reconciliationDiscrepancies.createdBy],
      references: [users.id],
      relationName: "discrepancy_creator",
    }),
    approver: one(users, {
      fields: [reconciliationDiscrepancies.approvedBy],
      references: [users.id],
      relationName: "discrepancy_approver",
    }),
  })
);

export type ReconciliationDiscrepancy =
  typeof reconciliationDiscrepancies.$inferSelect;
export type CreateReconciliationDiscrepancy =
  typeof reconciliationDiscrepancies.$inferInsert;

export default reconciliationDiscrepancies;
