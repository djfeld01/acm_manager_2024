import { pgEnum, pgTable, serial, text, numeric, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import userDetails from "./userDetails";
import payPeriod from "./payPeriod";
import storageFacilities from "./storageFacilities";

export const hoursStatusEnum = pgEnum("hours_status", ["DRAFT", "SUBMITTED", "APPROVED"]);

const hoursEntry = pgTable(
  "hours_entry",
  {
    id: serial("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => userDetails.id),
    payPeriodId: text("pay_period_id")
      .notNull()
      .references(() => payPeriod.payPeriodId),
    facilityId: varchar("facility_id").references(() => storageFacilities.sitelinkId),
    regularHours: numeric("regular_hours", { precision: 6, scale: 2 }).notNull().default("0"),
    overtimeHours: numeric("overtime_hours", { precision: 6, scale: 2 }).notNull().default("0"),
    status: hoursStatusEnum("status").notNull().default("DRAFT"),
    enteredBy: text("entered_by").references(() => userDetails.id),
    approvedBy: text("approved_by").references(() => userDetails.id),
    approvedAt: timestamp("approved_at", { precision: 6, withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { precision: 6, withTimezone: true }),
  },
  (table) => ({
    uniqueEmployeePeriodFacility: unique().on(
      table.employeeId,
      table.payPeriodId,
      table.facilityId
    ),
  })
);

export type HoursEntry = typeof hoursEntry.$inferSelect;
export default hoursEntry;
