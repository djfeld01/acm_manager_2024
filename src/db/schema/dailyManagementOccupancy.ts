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
  timestamp,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";

const dailyManagementOccupancy = pgTable(
  "daily_management_occupancy",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    date: date("date").notNull(),
    unitOccupancy: numeric("unit_occupancy"),
    financialOccupancy: numeric("financial_occupancy"),
    squareFootageOccupancy: numeric("square_footage_occupancy"),
    occupiedUnits: numeric("occupied_units"),
    vacantUnits: numeric("vacant_units"),
    complimentaryUnits: numeric("complimentary_units"),
    unrentableUnits: numeric("unrentable_units"),
    totalUnits: numeric("total_units"),
    occupiedSquareFootage: numeric("occupied_square_footage"),
    vacantSquareFootage: numeric("vacant_square_footage"),
    complimentarySquareFootage: numeric("complimentary_square_footage"),
    unrentableSquareFootage: numeric("unrentable_square_footage"),
    totalSquareFootage: numeric("total_square_footage"),
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
