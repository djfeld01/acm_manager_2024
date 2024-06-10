import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
  bigint,
  PgInteger,
  date,
  numeric,
  pgEnum,
  real,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";
import users from "./user";

export const activityTypeEnum = pgEnum("activity_type", [
  "MoveIn",
  "MoveOut",
  "Transfer",
]);
const tenantActivities = pgTable(
  "tenant_activity",
  {
    Id: serial("tenant_activity_id").notNull().primaryKey(),
    facilityId: bigint("facility_id", { mode: "number" }).notNull(),
    date: date("date").notNull(),
    activityType: activityTypeEnum("activity_type").notNull(),
    tenantName: varchar("tenant_name").notNull(),
    unitName: varchar("unit_name").notNull(),
    unitWidth: numeric("unit_width").notNull(),
    unitLength: numeric("unit_length").notNull(),
    unitSize: varchar("unit_size").notNull(),
    unitType: varchar("unit_type").notNull(),
    unitArea: varchar("unit_area").notNull(),
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
    employeeId: varchar("employee_id"),
    employeeInitials: varchar("employee_initials").notNull(),
    hasInsurance: boolean("has_insurance").notNull(),
    insuranceAmount: numeric("insurance_amount"),
    leadSource: varchar("lead_source"),
  },
  (table) => ({
    dateIndex: index().on(table.date),
  })
);

export const tenantActivitiesRelations = relations(
  tenantActivities,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [tenantActivities.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
    user: one(users, {
      fields: [tenantActivities.employeeId],
      references: [users.id],
    }),
  })
);

export default tenantActivities;
