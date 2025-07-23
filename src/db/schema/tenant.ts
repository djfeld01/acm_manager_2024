import {
  integer,
  boolean,
  pgTable,
  varchar,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";
import inquiry from "./inquiry";
import { relations } from "drizzle-orm";

const tenant = pgTable("tenant", {
  tenantId: varchar("tenant_id").notNull().primaryKey(),
  sitelinkId: varchar("sitelink_id").references(
    () => storageFacilities.sitelinkId
  ),
  firstName: varchar("first_name", { length: 64 }),
  middleName: varchar("middle_name", { length: 64 }),
  middleInitial: varchar("middle_initial", { length: 8 }),
  lastName: varchar("last_name", { length: 64 }),
  company: varchar("company", { length: 128 }),
  isCommercial: boolean("is_commercial"),
  insurancePremium: numeric("insurance_premium"),
  email: varchar("email", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  postalCode: varchar("postal_code", { length: 16 }),
  reportDate: timestamp("report_date"),
});

export const tenantRelations = relations(tenant, ({ many }) => ({
  inquiries: many(inquiry),
}));

export type Tenant = typeof tenant.$inferSelect;
export type TenantInsert = typeof tenant.$inferInsert;
export default tenant;
