import {
  pgTable,
  serial,
  varchar,
  integer,
  real,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";

/**
 * What SiteLink's "Tenant Increase Tracking" report says about each month's
 * rent increases at a facility, by unit type and size. One row per facility,
 * month, unit type group and size; "ALL" / "ALL" is the facility total.
 * Aggregate numbers only — no tenant information. A newer report for the same
 * month replaces an older one (move-out windows fill in as time passes).
 */
export const increaseWaveMonth = pgTable(
  "increase_wave_month",
  {
    id: serial("id").primaryKey(),
    sitelinkId: varchar("sitelink_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId, { onDelete: "cascade" }),
    // First day of the month the increases took effect.
    month: date("month").notNull(),
    unitType: varchar("unit_type", { length: 32 }).notNull(),
    size: varchar("size", { length: 32 }).notNull(),
    unitsRaised: integer("units_raised").notNull().default(0),
    dollarsAdded: real("dollars_added").notNull().default(0),
    // Average increase, weighted by units raised.
    avgPct: real("avg_pct").notNull().default(0),
    atStandard: integer("at_standard").notNull().default(0),
    belowStandard: integer("below_standard").notNull().default(0),
    aboveStandard: integer("above_standard").notNull().default(0),
    // SiteLink's own count of raised units that moved out in each window.
    moveouts0to30: integer("moveouts_0_30").notNull().default(0),
    moveouts31to60: integer("moveouts_31_60").notNull().default(0),
    moveouts61to90: integer("moveouts_61_90").notNull().default(0),
    moveouts0to30Rent: real("moveouts_0_30_rent").notNull().default(0),
    moveouts31to60Rent: real("moveouts_31_60_rent").notNull().default(0),
    moveouts61to90Rent: real("moveouts_61_90_rent").notNull().default(0),
    // Date the report was run; newer reports win.
    reportDate: date("report_date").notNull(),
  },
  (table) => ({
    uniq: uniqueIndex("increase_wave_month_unique").on(
      table.sitelinkId,
      table.month,
      table.unitType,
      table.size
    ),
    siteMonthIdx: index("increase_wave_month_site_idx").on(table.sitelinkId, table.month),
  })
);

/**
 * What SiteLink's "Rate Management History" report says about occupancy and
 * rent at a facility, by month, unit type and size. Aggregate only.
 */
export const occupancyMonth = pgTable(
  "occupancy_month",
  {
    id: serial("id").primaryKey(),
    sitelinkId: varchar("sitelink_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId, { onDelete: "cascade" }),
    month: date("month").notNull(),
    unitType: varchar("unit_type", { length: 32 }).notNull(),
    size: varchar("size", { length: 32 }).notNull(),
    unitsOccupied: integer("units_occupied").notNull().default(0),
    totalUnits: integer("total_units").notNull().default(0),
    // Street (standard-rate) value of the occupied units.
    grossOccupied: real("gross_occupied").notNull().default(0),
    // Rent actually being charged on the occupied units.
    actualOccupied: real("actual_occupied").notNull().default(0),
    reportDate: date("report_date").notNull(),
  },
  (table) => ({
    uniq: uniqueIndex("occupancy_month_unique").on(
      table.sitelinkId,
      table.month,
      table.unitType,
      table.size
    ),
    siteMonthIdx: index("occupancy_month_site_idx").on(table.sitelinkId, table.month),
  })
);

export type IncreaseWaveMonthRow = typeof increaseWaveMonth.$inferSelect;
export type OccupancyMonthRow = typeof occupancyMonth.$inferSelect;
