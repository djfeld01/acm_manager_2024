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

const vacation = pgTable(
  "vacation",
  {
    vacationId: text("vacation_id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    date: date("date").notNull(),
    employeeId: varchar("employee_id").references(() => userDetails.id),
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    vacationHours: real("vacation_hours").notNull(),
    vacationNote: text("vacation_note"),
    payPeriodId: text("pay_period_id").references(() => payPeriod.payPeriodId),
    vacationHasBeenPaid: boolean("vacation_has_been_paid").default(false),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const vacationRelations = relations(vacation, ({ one }) => ({
  payPeriod: one(payPeriod, {
    fields: [vacation.payPeriodId],
    references: [payPeriod.payPeriodId],
  }),
  user: one(userDetails, {
    fields: [vacation.employeeId],
    references: [userDetails.id],
  }),
  facility: one(storageFacilities, {
    fields: [vacation.facilityId],
    references: [storageFacilities.sitelinkId],
  }),
}));

export default vacation;
