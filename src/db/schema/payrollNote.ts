import { relations, eq } from "drizzle-orm";
import {
  pgTable,
  varchar,
  date,
  real,
  text,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { payPeriod, storageFacilities, userDetails } from "@/db/schema";

const payrollNote = pgTable(
  "payrollNote",
  {
    payrollNoteId: text("payrollNote_id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    date: date("date").notNull(),
    employeeId: varchar("employee_id").references(() => userDetails.id),
    note: text("note").notNull(),
    payPeriodId: text("pay_period_id").references(() => payPeriod.payPeriodId),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const payrollNoteRelations = relations(payrollNote, ({ one }) => ({
  payPeriod: one(payPeriod, {
    fields: [payrollNote.payPeriodId],
    references: [payPeriod.payPeriodId],
  }),
  user: one(userDetails, {
    fields: [payrollNote.employeeId],
    references: [userDetails.id],
  }),
}));
export default payrollNote;
