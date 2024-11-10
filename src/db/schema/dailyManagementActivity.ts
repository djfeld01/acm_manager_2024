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
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";

const dailyManagementOccupancy = pgTable(
  "daily_management_occupancy",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    date: date("date").notNull(),
  },
  (table) => ({
    dateIndex: index().on(table.date),
    pkDateFacility: primaryKey({ columns: [table.facilityId, table.date] }),
  })
);

export const dailyManagementOccupancyRelations = relations(
  dailyManagementOccupancy,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [dailyManagementOccupancy.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export default dailyManagementOccupancy;
