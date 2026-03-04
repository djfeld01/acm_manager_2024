import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  real,
  numeric,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";

const facilityUnitRates = pgTable(
  "facility_unit_rate",
  {
    id: serial("id").primaryKey(),
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId, { onDelete: "cascade" }),
    // From SiteLink report: "Climate Control", "Self Storage", "Parking - RV,Boat, Trailer"
    unitType: varchar("unit_type", { length: 100 }).notNull(),
    unitSize: varchar("unit_size", { length: 20 }).notNull(), // e.g. "10x10"
    width: real("width"),
    length: real("length"),
    area: real("area"),
    standardRate: numeric("standard_rate", { precision: 8, scale: 2 }),
    // Push rate is a promotional rate; null/0 when not active
    pushRate: numeric("push_rate", { precision: 8, scale: 2 }),
    pushRateUsed: boolean("push_rate_used").default(false),
    webRate: numeric("web_rate", { precision: 8, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 6, scale: 4 }),
    monthlyTax: numeric("monthly_tax", { precision: 8, scale: 2 }),
    totalUnits: integer("total_units"),
    totalOccupied: integer("total_occupied"),
    totalVacant: integer("total_vacant"),
    // When this rate card was last imported
    importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // One row per facility + type + size combination
    uniqFacilityTypeSize: uniqueIndex("facility_unit_rate_unique").on(
      table.facilityId,
      table.unitType,
      table.unitSize
    ),
  })
);

export const facilityUnitRatesRelations = relations(
  facilityUnitRates,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [facilityUnitRates.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export type FacilityUnitRate = typeof facilityUnitRates.$inferSelect;
export default facilityUnitRates;
