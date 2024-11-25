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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const mileage = pgTable(
  "mileage",
  {
    mileageId: text("mileage_id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    date: date("date").notNull(),
    employeeId: varchar("employee_id").references(() => userDetails.id),
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    mileage: real("mileage").notNull(),
    mileageRate: real("mileage_rate").notNull().default(0.35),
    mileageNote: text("mileage_note"),
    payPeriodId: text("pay_period_id").references(() => payPeriod.payPeriodId),
    mileageHasBeenPaid: boolean("mileage_has_been_paid").default(false),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const mileageRelations = relations(mileage, ({ one }) => ({
  payPeriod: one(payPeriod, {
    fields: [mileage.payPeriodId],
    references: [payPeriod.payPeriodId],
  }),
  user: one(userDetails, {
    fields: [mileage.employeeId],
    references: [userDetails.id],
  }),
  facility: one(storageFacilities, {
    fields: [mileage.facilityId],
    references: [storageFacilities.sitelinkId],
  }),
}));
export const insertMileageSchema = createInsertSchema(mileage, {
  mileage: z.string().transform((val) => parseFloat(val)),
  date: z.date().transform((val) => val.toDateString()),
});

export type AddMileage = z.infer<typeof insertMileageSchema>;

export default mileage;
