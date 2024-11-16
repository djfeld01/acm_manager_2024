import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  index,
  date,
  unique,
  real,
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";

const dailyPayments = pgTable(
  "daily_payment",
  {
    Id: serial("daily_payment_id").notNull().primaryKey(),
    facilityId: varchar("facility_id").notNull(),
    date: date("date").notNull(),
    cash: real("cash"),
    check: real("check"),
    visa: real("visa"),
    mastercard: real("mastercard"),
    americanExpress: real("american_express"),
    discover: real("discover"),
    ach: real("ach"),
    dinersClub: real("diners_club"),
    debit: real("debit"),
  },
  (table) => ({
    dateIndex: index().on(table.date),
    unq: unique().on(table.date, table.facilityId),
  })
);

export const dailyPaymentsRelations = relations(dailyPayments, ({ one }) => ({
  facility: one(storageFacilities, {
    fields: [dailyPayments.facilityId],
    references: [storageFacilities.sitelinkId],
  }),
}));

export default dailyPayments;
