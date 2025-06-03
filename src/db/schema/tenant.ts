import { integer, boolean, pgTable, varchar } from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";
import inquiry from "./inquiry";
import { relations } from "drizzle-orm";

const tenant = pgTable("tenant", {
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

export const tenantRelations = relations(tenant, ({ many }) => ({
  inquiries: many(inquiry),
}));

const letsdeletethisinaminute = "Let's delete this in a minute";

export default tenant;
