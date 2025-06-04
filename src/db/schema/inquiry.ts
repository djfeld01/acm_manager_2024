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
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import storageFacilities from "./storageFacilities";
import unit from "./unit";
import tenant from "./tenant";
import userDetails from "./userDetails";

export const inquiry = pgTable("inquiry", {
  id: serial("id").primaryKey(),
  sitelinkId: varchar("sitelink_id").references(
    () => storageFacilities.sitelinkId
  ),
  waitingId: varchar("waiting_id"),
  tenantId: varchar("tenant_id").references(() => tenant.tenantId),
  ledgerId: varchar("ledger_id"),
  unitId: varchar("unit_id").references(() => unit.unitId),
  datePlaced: timestamp("date_placed"),
  firstFollowUpDate: timestamp("first_follow_up_date"),
  lastFollowUpDate: timestamp("last_follow_up_date"),
  cancelDate: timestamp("cancel_date"),
  expirationDate: timestamp("expiration_date"),
  leaseDate: timestamp("lease_date"),
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
  pushRate: real("push_rate"),
  stdRate: real("std_rate"),
  discountPlanName: varchar("discount_plan_name", { length: 128 }),
  employeeConvertedToMoveInId: varchar("employee_converted_to_move_in_id"),
  employeeId: varchar("employee_id"),
  employeeConvertedToResId: varchar("employee_converted_to_res_id"),
  employeeFollowUpId: varchar("employee_follow_up_id"),
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
  storageFacility: one(storageFacilities, {
    fields: [inquiry.sitelinkId],
    references: [storageFacilities.sitelinkId],
  }),
  employeeConvertedToMoveIn: one(userDetails, {
    fields: [inquiry.employeeConvertedToMoveInId],
    references: [userDetails.id],
  }),
  employeeConvertedToRes: one(userDetails, {
    fields: [inquiry.employeeConvertedToResId],
    references: [userDetails.id],
  }),
  employeeFollowUp: one(userDetails, {
    fields: [inquiry.employeeFollowUpId],
    references: [userDetails.id],
  }),
  employee: one(userDetails, {
    fields: [inquiry.employeeId],
    references: [userDetails.id],
  }),
}));

export type Inquiry = typeof inquiry.$inferSelect;

export type InquiryInsert = typeof inquiry.$inferInsert;

export default inquiry;
