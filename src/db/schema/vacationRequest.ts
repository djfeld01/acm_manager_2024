import { pgEnum, pgTable, serial, text, date, numeric, timestamp, varchar } from "drizzle-orm/pg-core";
import userDetails from "./userDetails";
import payPeriod from "./payPeriod";
import storageFacilities from "./storageFacilities";

export const vacationRequestStatusEnum = pgEnum("vacation_request_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

const vacationRequest = pgTable("vacation_request", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id")
    .notNull()
    .references(() => userDetails.id),
  payPeriodId: text("pay_period_id").references(() => payPeriod.payPeriodId),
  facilityId: varchar("facility_id").references(() => storageFacilities.sitelinkId),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  hoursRequested: numeric("hours_requested", { precision: 6, scale: 2 }).notNull(),
  status: vacationRequestStatusEnum("status").notNull().default("PENDING"),
  requestedAt: timestamp("requested_at", { precision: 6, withTimezone: true }).defaultNow(),
  reviewedBy: text("reviewed_by").references(() => userDetails.id),
  reviewedAt: timestamp("reviewed_at", { precision: 6, withTimezone: true }),
  reviewNotes: text("review_notes"),
});

export type VacationRequest = typeof vacationRequest.$inferSelect;
export default vacationRequest;
