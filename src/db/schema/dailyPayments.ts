import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  index,
  date,
  unique,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { storageFacilities, transactionsToDailyPayments } from "@/db/schema";

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
    cashCheckCommitted: boolean("cash_check_committed").default(false),
    creditCardCommitted: boolean("credit_card_committed").default(false),
  },
  (table) => ({
    dateIndex: index().on(table.date),
    unq: unique().on(table.date, table.facilityId),
  })
);

export const dailyPaymentsRelations = relations(
  dailyPayments,
  ({ one, many }) => ({
    facility: one(storageFacilities, {
      fields: [dailyPayments.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
    transactionsToDailyPayments: many(transactionsToDailyPayments),
  })
);

export default dailyPayments;
