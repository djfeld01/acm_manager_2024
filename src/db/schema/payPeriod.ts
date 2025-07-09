import { relations, sql } from "drizzle-orm";
import { date, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import tenantActivities from "./tenantActivities";

export const payPeriodStatusEnum = pgEnum("pay_period_status_enum", [
  "Completed",
  "In Process",
  "Current",
  "Future",
]);

const payPeriod = pgTable("pay_period", {
  payPeriodId: text("pay_period_id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  startDate: date("start_date").notNull().unique(),
  endDate: date("end_date"),
  paycheckDate: date("paycheck_date"),
  processingDate: date("processing_date"),
  status: payPeriodStatusEnum("status"),
});

export const payPeriodRelations = relations(payPeriod, ({ many }) => ({
  tenantActivities: many(tenantActivities),
}));

export type PayPeriod = typeof payPeriod.$inferSelect;
export default payPeriod;
