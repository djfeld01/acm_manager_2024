import { pgEnum, pgTable, serial, text, date, numeric, varchar, timestamp } from "drizzle-orm/pg-core";
import userDetails from "./userDetails";

export const compensationTypeEnum = pgEnum("compensation_type", ["HOURLY", "SALARY"]);
export const changeReasonEnum = pgEnum("change_reason", [
  "HIRE",
  "ANNUAL_INCREASE",
  "INTERIM_RAISE",
  "PROMOTION",
  "OTHER",
]);

const employeeCompensation = pgTable("employee_compensation", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id")
    .notNull()
    .references(() => userDetails.id),
  effectiveDate: date("effective_date").notNull(),
  wage: numeric("wage", { precision: 10, scale: 4 }).notNull(),
  compensationType: compensationTypeEnum("compensation_type").notNull(),
  title: varchar("title", { length: 100 }),
  changeReason: changeReasonEnum("change_reason").notNull(),
  notes: text("notes"),
  createdBy: text("created_by").references(() => userDetails.id),
  createdAt: timestamp("created_at", { precision: 6, withTimezone: true }).defaultNow(),
});

export type EmployeeCompensation = typeof employeeCompensation.$inferSelect;
export default employeeCompensation;
