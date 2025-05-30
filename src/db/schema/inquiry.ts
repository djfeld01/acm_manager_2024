// /src/db/schema/inquiry.ts
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  date,
  numeric,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import storageFacilities from "./storageFacilities";

// Tenant Table
export const tenants = pgTable("tenants", {
  tenantId: integer("tenant_id").notNull().primaryKey(),
  sitelinkId: varchar("sitelink_id").references(
    () => storageFacilities.sitelinkId
  ),
  firstName: varchar("first_name", { length: 64 }),
  middleInitial: varchar("middle_initial", { length: 8 }),
  lastName: varchar("last_name", { length: 64 }),
  company: varchar("company", { length: 128 }),
  isCommercial: boolean("is_commercial"),
  email: varchar("email", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  postalCode: varchar("postal_code", { length: 16 }),
});

// Unit Table
export const units = pgTable("units", {
  unitId: integer("unit_id").notNull().primaryKey(),
  sitelinkId: varchar("sitelink_id").references(
    () => storageFacilities.sitelinkId
  ),
  unitName: varchar("unit_name", { length: 32 }),
  size: varchar("size", { length: 32 }),
  width: numeric("width"),
  length: numeric("length"),
  area: numeric("area"),
  isMobile: boolean("is_mobile"),
  isClimate: boolean("is_climate"),
  isAlarm: boolean("is_alarm"),
  isPower: boolean("is_power"),
  isInside: boolean("is_inside"),
  floor: integer("floor"),
  pushRate: numeric("push_rate"),
  stdRate: numeric("std_rate"),
  unitTypeId: integer("unit_type_id"),
  unitTypeName: varchar("unit_type_name", { length: 64 }),
  chargeTax1: boolean("charge_tax1"),
  chargeTax2: boolean("charge_tax2"),
  siteId: integer("site_id"),
});

// Inquiry Table
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  sitelinkId: varchar("sitelink_id").references(
    () => storageFacilities.sitelinkId
  ),
  waitingId: integer("waiting_id"),
  tenantId: integer("tenant_id").references(() => tenants.tenantId),
  ledgerId: integer("ledger_id"),
  unitId: integer("unit_id").references(() => units.unitId),
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
  quotedRate: numeric("quoted_rate"),
  employeeName: varchar("employee_name", { length: 128 }),
  employeeFollowUp: varchar("employee_follow_up", { length: 128 }),
  employeeConvertedToRes: varchar("employee_converted_to_res", { length: 128 }),
  employeeConvertedToMoveIn: varchar("employee_converted_to_move_in", {
    length: 128,
  }),
});

// Relations
export const inquiryRelations = relations(inquiries, ({ one }) => ({
  tenant: one(tenants, {
    fields: [inquiries.tenantId],
    references: [tenants.tenantId],
  }),
  unit: one(units, {
    fields: [inquiries.unitId],
    references: [units.unitId],
  }),
}));

export const tenantRelations = relations(tenants, ({ many }) => ({
  inquiries: many(inquiries),
}));

export const unitRelations = relations(units, ({ many }) => ({
  inquiries: many(inquiries),
}));
