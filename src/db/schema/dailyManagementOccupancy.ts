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
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";

const dailyManagementOccupancy = pgTable(
  "daily_management_occupancy",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    date: date("date").notNull(),
    unitOccupancy: real("unit_occupancy"),
    financialOccupancy: real("financial_occupancy"),
    squareFootageOccupancy: real("square_footage_occupancy"),
    occupiedUnits: real("occupied_units"),
    vacantUnits: real("vacant_units"),
    complimentaryUnits: real("complimentary_units"),
    unrentableUnits: real("unrentable_units"),
    totalUnits: real("total_units"),
    occupiedSquareFootage: real("occupied_square_footage"),
    vacantSquareFootage: real("vacant_square_footage"),
    complimentarySquareFootage: real("complimentary_square_footage"),
    unrentableSquareFootage: real("unrentable_square_footage"),
    totalSquareFootage: real("total_square_footage"),
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
