import {
  pgTable,
  serial,
  varchar,
  integer,
  real,
  date,
  jsonb,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";

/**
 * A group of tenants getting a rent increase on one effective date.
 * Drafts can be edited; a finalized batch is the record of what was decided
 * (later phases add notice dates and track what happened afterward).
 * Holds no tenant names — ledger/tenant IDs and rents only.
 */
export const rateIncreaseBatch = pgTable(
  "rate_increase_batch",
  {
    id: serial("id").primaryKey(),
    sitelinkId: varchar("sitelink_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    // 'draft' | 'final'
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    effectiveDate: date("effective_date").notNull(),
    // Rent roll the batch was built from.
    snapshotDate: date("snapshot_date").notNull(),
    // The rules used to suggest the batch, as entered.
    rules: jsonb("rules").notNull(),
    notes: text("notes"),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  },
  (table) => ({
    siteIdx: index("rate_increase_batch_site_idx").on(table.sitelinkId, table.effectiveDate),
  })
);

export const rateIncreaseBatchItem = pgTable(
  "rate_increase_batch_item",
  {
    id: serial("id").primaryKey(),
    batchId: integer("batch_id")
      .notNull()
      .references(() => rateIncreaseBatch.id, { onDelete: "cascade" }),
    ledgerId: varchar("ledger_id").notNull(),
    tenantId: varchar("tenant_id"),
    unitId: varchar("unit_id").notNull(),
    unitName: varchar("unit_name", { length: 32 }),
    unitType: varchar("unit_type", { length: 32 }).notNull(),
    size: varchar("size", { length: 32 }),
    oldRent: real("old_rent").notNull(),
    newRent: real("new_rent").notNull(),
    standardRate: real("standard_rate"),
    specialMonths: integer("special_months"),
    rentLastChanged: date("rent_last_changed"),
    leaseDate: date("lease_date"),
    // Chance of leaving within 90 days with no increase, at build time.
    baselineExit90: real("baseline_exit_90"),
  },
  (table) => ({
    uniqLedger: uniqueIndex("rate_increase_batch_item_unique").on(table.batchId, table.ledgerId),
  })
);

export type RateIncreaseBatchRow = typeof rateIncreaseBatch.$inferSelect;
export type RateIncreaseBatchItemRow = typeof rateIncreaseBatchItem.$inferSelect;
