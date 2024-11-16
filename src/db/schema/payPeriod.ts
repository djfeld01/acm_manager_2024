import { relations } from "drizzle-orm";
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
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  status: payPeriodStatusEnum("status"),
});

export const payPeriodRelations = relations(payPeriod, ({ many }) => ({
  tenantActivities: many(tenantActivities),
}));
export default payPeriod;
