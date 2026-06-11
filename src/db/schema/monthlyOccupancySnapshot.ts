import { pgMaterializedView } from "drizzle-orm/pg-core";
import { date, real, timestamp, varchar } from "drizzle-orm/pg-core";

// Read-only reference to the monthly_occupancy_snapshot materialized view.
// The view is created/managed by migration 0045; .existing() tells Drizzle
// not to generate DDL for it.
export const monthlyOccupancySnapshot = pgMaterializedView(
  "monthly_occupancy_snapshot",
  {
    facilityId: varchar("facility_id").notNull(),
    date: date("date").notNull(),
    unitOccupancy: real("unit_occupancy"),
    financialOccupancy: real("financial_occupancy"),
    occupiedVariance: real("occupied_variance"),
    rentPotential: real("rent_potential"),
    rentActual: real("rent_actual"),
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
    dateCreated: timestamp("date_created", { precision: 6, withTimezone: true }),
    dateUpdated: timestamp("date_updated", { precision: 6, withTimezone: true }),
  }
).existing();

export default monthlyOccupancySnapshot;
