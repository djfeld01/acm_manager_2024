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

const bonus = pgTable(
  "bonus",
  {
    bonusId: text("bonus_id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    date: date("date").notNull(),
    bonusMonth: date("date"),
    employeeId: varchar("employee_id").references(() => userDetails.id),
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    bonusAmount: real("bonus_amount").notNull(),
    bonusType: text("bonus_type").notNull(),
    bonusNote: text("bonus_note"),
    payPeriodId: text("pay_period_id").references(() => payPeriod.payPeriodId),
    bonusHasBeenPaid: boolean("bonus_has_been_paid").default(false),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const bonusRelations = relations(bonus, ({ one }) => ({
  payPeriod: one(payPeriod, {
    fields: [bonus.payPeriodId],
    references: [payPeriod.payPeriodId],
  }),
  user: one(userDetails, {
    fields: [bonus.employeeId],
    references: [userDetails.id],
  }),
  facility: one(storageFacilities, {
    fields: [bonus.facilityId],
    references: [storageFacilities.sitelinkId],
  }),
}));
export default bonus;
