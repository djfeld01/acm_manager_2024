import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  index,
  date,
  numeric,
  unique,
  primaryKey,
  pgEnum,
  integer,
  timestamp,
  real,
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";

const dailyManagementSundries = pgTable(
  "daily_management_sundries",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    sundryType: varchar("sundryType").notNull(),
    dailyTotal: real("daily_total").notNull(),
    monthlyTotal: real("monthly_total").notNull(),
    yearlyTotal: real("yearly_total").notNull(),
    date: date("date").notNull(),
    sortId: integer("sort_id"),
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
      columns: [table.facilityId, table.date, table.sundryType],
    }),
  })
);

export const dailyManagementSundriesRelations = relations(
  dailyManagementSundries,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [dailyManagementSundries.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export default dailyManagementSundries;
