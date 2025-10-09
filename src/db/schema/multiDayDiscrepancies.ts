import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import reconciliationDiscrepancies from "./reconciliationDiscrepancies";
import dailyPayments from "./dailyPayments";
import users from "./user";

// Junction table for multi-day discrepancies that combine multiple daily payments
const multiDayDiscrepancies = pgTable(
  "multi_day_discrepancies",
  {
    multiDayId: serial("multi_day_id").primaryKey(),

    // Link to the parent discrepancy
    discrepancyId: integer("discrepancy_id")
      .notNull()
      .references(() => reconciliationDiscrepancies.discrepancyId, {
        onDelete: "cascade",
      }),

    // Link to the daily payment that's part of this multi-day combination
    dailyPaymentId: integer("daily_payment_id")
      .notNull()
      .references(() => dailyPayments.Id, {
        onDelete: "cascade",
      }),

    // Optional notes specific to this daily payment's inclusion
    notes: text("notes"),

    // Audit trail
    addedBy: text("added_by")
      .notNull()
      .references(() => users.id),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (table) => ({
    // Indexes for performance
    discrepancyIndex: index("multi_day_discrepancy_idx").on(
      table.discrepancyId
    ),
    dailyPaymentIndex: index("multi_day_daily_payment_idx").on(
      table.dailyPaymentId
    ),
    addedByIndex: index("multi_day_added_by_idx").on(table.addedBy),
  })
);

// Relations
export const multiDayDiscrepanciesRelations = relations(
  multiDayDiscrepancies,
  ({ one }) => ({
    // Parent discrepancy relationship
    discrepancy: one(reconciliationDiscrepancies, {
      fields: [multiDayDiscrepancies.discrepancyId],
      references: [reconciliationDiscrepancies.discrepancyId],
    }),

    // Daily payment relationship
    dailyPayment: one(dailyPayments, {
      fields: [multiDayDiscrepancies.dailyPaymentId],
      references: [dailyPayments.Id],
    }),

    // User who added this combination
    addedByUser: one(users, {
      fields: [multiDayDiscrepancies.addedBy],
      references: [users.id],
    }),
  })
);

export type MultiDayDiscrepancy = typeof multiDayDiscrepancies.$inferSelect;
export type CreateMultiDayDiscrepancy =
  typeof multiDayDiscrepancies.$inferInsert;

export default multiDayDiscrepancies;
