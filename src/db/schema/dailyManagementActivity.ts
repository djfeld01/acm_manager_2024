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
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";

const dailyManagementActivity = pgTable(
  "daily_management_activity",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    activityType: varchar("activityType").notNull(),
    dailyTotal: integer("daily_total").notNull(),
    monthlyTotal: integer("monthly_total").notNull(),
    yearlyTotal: integer("yearly_total").notNull(),
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
      columns: [table.facilityId, table.date, table.activityType],
    }),
  })
);

export const dailyManagementActivityRelations = relations(
  dailyManagementActivity,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [dailyManagementActivity.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export default dailyManagementActivity;
