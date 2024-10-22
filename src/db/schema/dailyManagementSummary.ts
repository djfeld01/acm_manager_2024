import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  index,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";

const dailyManagementSummary = pgTable(
  "daily_management_summary",
  {
    Id: serial("daily_management_summary_id").notNull().primaryKey(),
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    date: date("date").notNull().unique(),
    unitOccupancy: numeric("unit_occupancy"),
    financialOccupancy: numeric("financial_occupancy"),
    squareFootOccupancy: numeric("square_footage_occupancy"),
    occupiedUnits: numeric("occupiedUnits"),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const dailyManagementSummaryRelations = relations(
  dailyManagementSummary,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [dailyManagementSummary.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export default dailyManagementSummary;
