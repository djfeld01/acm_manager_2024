import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  index,
  date,
  real,
  unique,
  primaryKey,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";

const dailyManagementPaymentReceipt = pgTable(
  "daily_management_payment_receipt",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    date: date("date").notNull(),
    description: varchar("desription").notNull(),
    sortId: integer("sort_id").notNull(),
    dailyAmount: real("daily_amount").notNull(),
    monthlyAmount: real("monthly_amount").notNull(),
    yearlyAmount: real("yearly_amount").notNull(),
    dateCreated: timestamp("date_created", {
      precision: 6,
      withTimezone: true,
    }),
    dateUpdated: timestamp("date_updated", {
      precision: 6,
      withTimezone: true,
    }),
  },
  (table) => ({
    dateIndex: index().on(table.date),
    pkDateFacility: primaryKey({
      columns: [table.facilityId, table.date, table.description],
    }),
  })
);

export const dailyManagementPaymentReceiptRelations = relations(
  dailyManagementPaymentReceipt,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [dailyManagementPaymentReceipt.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export default dailyManagementPaymentReceipt;
