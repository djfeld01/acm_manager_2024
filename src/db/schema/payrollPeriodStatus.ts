import { pgEnum, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import userDetails from "./userDetails";
import payPeriod from "./payPeriod";

export const payrollPeriodStatusEnum = pgEnum("payroll_period_status_enum", [
  "NOT_STARTED",
  "EMPLOYEE_SUBMITTED",
  "SUPERVISOR_APPROVED",
  "FINALIZED",
]);

const payrollPeriodStatus = pgTable(
  "payroll_period_status",
  {
    id: serial("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => userDetails.id),
    payPeriodId: text("pay_period_id")
      .notNull()
      .references(() => payPeriod.payPeriodId),
    status: payrollPeriodStatusEnum("status").notNull().default("NOT_STARTED"),
    employeeSubmittedAt: timestamp("employee_submitted_at", { precision: 6, withTimezone: true }),
    supervisorApprovedAt: timestamp("supervisor_approved_at", { precision: 6, withTimezone: true }),
    supervisorApprovedBy: text("supervisor_approved_by").references(() => userDetails.id),
    finalizedAt: timestamp("finalized_at", { precision: 6, withTimezone: true }),
    finalizedBy: text("finalized_by").references(() => userDetails.id),
    supervisorNotes: text("supervisor_notes"),
    adminNotes: text("admin_notes"),
  },
  (table) => ({
    uniqueEmployeePeriod: unique().on(table.employeeId, table.payPeriodId),
  })
);

export type PayrollPeriodStatus = typeof payrollPeriodStatus.$inferSelect;
export default payrollPeriodStatus;
