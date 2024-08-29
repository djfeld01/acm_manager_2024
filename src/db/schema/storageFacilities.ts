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
} from "drizzle-orm/pg-core";
import { usersToFacilities } from "./user";
import dailyPayments from "./dailyPayments";
import tenantActivities from "./tenantActivities";
import quickbooksBalance from "./quickbooksBalance";
import monthlyGoals from "./monthlyGoals";

const storageFacilities = pgTable(
  "storage_facility",
  {
    sitelinkId: varchar("sitelink_id").primaryKey().notNull(),
    sitelinkSiteCode: varchar("sitelink_site_code", { length: 4 }).notNull(),
    paycorNumber: integer("paycor_number").notNull(),
    facilityName: varchar("facility_name", { length: 255 }).notNull(),
    streetAddress: varchar("street_address", { length: 255 }).notNull(),
    zipCode: varchar("zip_code", { length: 16 }).notNull(),
    city: varchar("city").notNull(),
    state: varchar("state").notNull(),
    email: varchar("email").notNull(),
    facilityAbbreviation: varchar("facility_abbreviation").notNull(),
    phoneNumber: varchar("phone_number").notNull(),
    twilioNumber: varchar("twilio_number").notNull(),
  },
  (table) => ({
    nameIndex: index().on(table.facilityName),
  })
);

export const storageFacilitiesRelations = relations(
  storageFacilities,
  ({ many }) => ({
    usersToFacilities: many(usersToFacilities),
    dailyPayments: many(dailyPayments),
    tenantActivities: many(tenantActivities),
    quickbooksBalance: many(quickbooksBalance),
    monthlyGoals: many(monthlyGoals),
  })
);

export default storageFacilities;
