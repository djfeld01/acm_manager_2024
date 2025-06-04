// /src/db/schema/inquiry.ts
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  date,
  real,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import storageFacilities from "./storageFacilities";
import unit from "./unit";
import tenant from "./tenant";

export const inquiry = pgTable("inquiry", {
  id: serial("id").primaryKey(),
  sitelinkId: varchar("sitelink_id").references(
    () => storageFacilities.sitelinkId
  ),
  waitingId: varchar("waiting_id"),
  tenantId: varchar("tenant_id").references(() => tenant.tenantId),
  ledgerId: varchar("ledger_id"),
  unitId: varchar("unit_id").references(() => unit.unitId),
  datePlaced: date("date_placed"),
  firstFollowUpDate: date("first_follow_up_date"),
  lastFollowUpDate: date("last_follow_up_date"),
  cancelDate: date("cancel_date"),
  expirationDate: date("expiration_date"),
  leaseDate: date("lease_date"),
  callType: varchar("call_type", { length: 32 }),
  inquiryType: varchar("inquiry_type", { length: 32 }),
  marketingId: integer("marketing_id"),
  marketingDesc: varchar("marketing_desc", { length: 128 }),
  rentalTypeId: integer("rental_type_id"),
  rentalType: varchar("rental_type", { length: 64 }),
  convertedToResDate: date("converted_to_res_date"),
  neededDate: date("needed_date"),
  cancellationReason: text("cancellation_reason"),
  comment: text("comment"),
  source: varchar("source", { length: 128 }),
  quotedRate: real("quoted_rate"),
  employeeName: varchar("employee_name", { length: 128 }),
  employeeFollowUp: varchar("employee_follow_up", { length: 128 }),
  employeeConvertedToRes: varchar("employee_converted_to_res", { length: 128 }),
  employeeConvertedToMoveIn: varchar("employee_converted_to_move_in", {
    length: 128,
  }),
});

// Relations
export const inquiryRelations = relations(inquiry, ({ one }) => ({
  tenant: one(tenant, {
    fields: [inquiry.tenantId],
    references: [tenant.tenantId],
  }),
  unit: one(unit, {
    fields: [inquiry.unitId],
    references: [unit.unitId],
  }),
}));

export type Inquiry = typeof inquiry.$inferSelect;
export type InquiryInsert = typeof inquiry.$inferInsert;

export default inquiry;
