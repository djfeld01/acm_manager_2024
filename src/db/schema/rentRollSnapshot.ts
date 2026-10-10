import {
  pgTable,
  serial,
  varchar,
  integer,
  real,
  date,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";

/**
 * One row per unit per rent roll upload. Built so a SiteLink rent roll can be
 * loaded repeatedly (manual upload today, emailed-report ingestion later)
 * and rent-change history can be reconstructed by comparing snapshots —
 * the rent roll itself only exposes each unit's *last* rent change.
 *
 * Deliberately holds NO tenant name / email / company: IDs and rents only.
 */
const rentRollSnapshot = pgTable(
  "rent_roll_snapshot",
  {
    id: serial("id").primaryKey(),
    sitelinkId: varchar("sitelink_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),

    unitId: varchar("unit_id").notNull(),
    unitName: varchar("unit_name", { length: 32 }),
    // Null for vacant units.
    ledgerId: varchar("ledger_id"),
    tenantId: varchar("tenant_id"),

    // Normalized group (Drive-Up, Inside Non-Climate, Climate Controlled,
    // Parking, Other) and the raw SiteLink type name it came from.
    unitType: varchar("unit_type", { length: 32 }).notNull(),
    rawUnitType: varchar("raw_unit_type", { length: 64 }),
    size: varchar("size", { length: 32 }),
    area: real("area"),
    isRentable: boolean("is_rentable").notNull().default(true),
    isRented: boolean("is_rented").notNull().default(false),

    rent: real("rent"),
    standardRate: real("standard_rate"),
    webRate: real("web_rate"),
    pushRate: real("push_rate"),
    pushRateAtMoveIn: real("push_rate_at_move_in"),

    rentLastChanged: date("rent_last_changed"),
    leaseDate: date("lease_date"),
    paidThru: date("paid_thru"),
    schedRentStart: date("sched_rent_start"),
    schedRent: real("sched_rent"),
    schedOut: date("sched_out"),
    chargeBalance: real("charge_balance"),
    daysVacant: integer("days_vacant"),
  },
  (table) => ({
    uniqSnapshotUnit: uniqueIndex("rent_roll_snapshot_unit_unique").on(
      table.sitelinkId,
      table.snapshotDate,
      table.unitId
    ),
    siteDateIdx: index("rent_roll_snapshot_site_date_idx").on(
      table.sitelinkId,
      table.snapshotDate
    ),
    tenantIdx: index("rent_roll_snapshot_tenant_idx").on(table.tenantId),
  })
);

export type RentRollSnapshotRow = typeof rentRollSnapshot.$inferSelect;
export type RentRollSnapshotInsert = typeof rentRollSnapshot.$inferInsert;

export default rentRollSnapshot;
