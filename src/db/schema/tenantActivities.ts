import { relations, SQL, sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  index,
  bigint,
  date,
  numeric,
  pgEnum,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";
import { userDetails } from "@/db/schema";
import { z } from "zod";

export const activityTypeEnum = pgEnum("activity_type", [
  "MoveIn",
  "MoveOut",
  "Transfer",
]);
export const ActivityType = z.enum(activityTypeEnum.enumValues).enum;

const tenantActivities = pgTable(
  "tenant_activity",
  {
    Id: serial("tenant_activity_id").notNull().primaryKey(),
    facilityId: varchar("facility_id").notNull(),
    date: timestamp("date").notNull(),
    activityType: activityTypeEnum("activity_type").notNull(),
    tenantName: varchar("tenant_name").notNull(),
    unitName: varchar("unit_name").notNull(),
    unitWidth: numeric("unit_width").notNull(),
    unitLength: numeric("unit_length").notNull(),
    unitSize: varchar("unit_size").notNull(),
    unitType: varchar("unit_type").notNull(),
    unitArea: numeric("unit_area").notNull(),
    moveInRentalRate: numeric("move_in_rental_rate"),
    moveInVariance: numeric("move_in_variance"),
    tenantSitelinkId: bigint("tenant_sitelink_id", {
      mode: "number",
    }).notNull(),
    tenantAddress: varchar("tenant_address"),
    tenantCity: varchar("tenant_city"),
    tenantState: varchar("tenant_state"),
    tenantZipCode: varchar("tenant_zip_code"),
    tenantEmail: varchar("tenant_email"),
    moveInDiscountPlan: varchar("move_in_discount_plan"),
    moveOutDaysRented: integer("move_out_days_rented"),
    employeeId: varchar("employee_id").references(() => userDetails.id),
    employeeInitials: varchar("employee_initials").notNull(),
    hasInsurance: boolean("has_insurance").notNull(),
    insuranceAmount: numeric("insurance_amount"),
    leadSource: varchar("lead_source"),
  },
  (table) => ({
    dateIndex: index().on(table.date),
    uniqueActivity: unique().on(table.date, table.tenantName),
  })
);

export const tenantActivitiesRelations = relations(
  tenantActivities,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [tenantActivities.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
    user: one(userDetails, {
      fields: [tenantActivities.employeeId],
      references: [userDetails.id],
    }),
  })
);

export default tenantActivities;
