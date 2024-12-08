import { relations, eq } from "drizzle-orm";
import {
  pgTable,
  varchar,
  date,
  real,
  text,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { payPeriod, storageFacilities, userDetails } from "@/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const holidayTypeEnum = pgEnum("holiday_type", [
  "christmas",
  "thanksgiving",
  "newYear",
  "memorialDay",
  "laborDay",
  "fourthOfJuly",
]);
const holiday = pgTable(
  "holiday",
  {
    holidayId: text("holiday_id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    date: date("date").notNull(),
    employeeId: varchar("employee_id").references(() => userDetails.id),
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    holidayHours: real("holiday_hours").notNull().default(8),
    holidayHoursType: holidayTypeEnum("holiday_hours_type").notNull(),
    holidayNote: text("holiday_note"),
    payPeriodId: text("pay_period_id").references(() => payPeriod.payPeriodId),
    holidayHasBeenPaid: boolean("holiday_has_been_paid").default(false),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const holidayRelations = relations(holiday, ({ one }) => ({
  payPeriod: one(payPeriod, {
    fields: [holiday.payPeriodId],
    references: [payPeriod.payPeriodId],
  }),
  user: one(userDetails, {
    fields: [holiday.employeeId],
    references: [userDetails.id],
  }),
  facility: one(storageFacilities, {
    fields: [holiday.facilityId],
    references: [storageFacilities.sitelinkId],
  }),
}));

export const insertHolidaySchema = createInsertSchema(holiday, {
  holidayHours: z.string().transform((val) => parseFloat(val)),
  date: z.date().transform((val) => val.toDateString()),
});

export type AddHolidayHours = z.infer<typeof insertHolidaySchema>;

export default holiday;
