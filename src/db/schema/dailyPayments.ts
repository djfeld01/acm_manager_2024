import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
  bigint,
  PgInteger,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";

const dailyPayments = pgTable(
  "daily_payment",
  {
    Id: serial("daily_payment_id").notNull().primaryKey(),
    facilityId: varchar("facility_id").notNull(),
    date: date("date").notNull(),
    cash: numeric("cash"),
    check: numeric("checks"),
    visa: numeric("visa"),
    mastercard: numeric("mastercard"),
    americanExpress: numeric("american_express"),
    discover: numeric("discover"),
    ach: numeric("ach"),
    dinersClub: numeric("dinersClub"),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const dailyPaymentsRelations = relations(dailyPayments, ({ one }) => ({
  facility: one(storageFacilities, {
    fields: [dailyPayments.facilityId],
    references: [storageFacilities.sitelinkId],
  }),
}));

export default dailyPayments;
