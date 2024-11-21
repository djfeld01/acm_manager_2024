import { relations } from "drizzle-orm";
import {
  pgTable,
  integer,
  varchar,
  index,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import {
  dailyPayments,
  tenantActivities,
  quickbooksBalance,
  monthlyGoals,
  dailyManagementOccupancy,
  usersToFacilities,
} from "@/db/schema";

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
    twilioNumber: varchar("twilio_number"),
    website: varchar("website"),
    domainRegistrar: varchar("domain_registrar"),
    currentClient: boolean("current_client").default(true),
    storageCommissionRate: real("storage_commission_rate").default(5).notNull(),
    insuranceCommissionRate: real("insurance_commission_rate")
      .default(1.5)
      .notNull(),
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
    dailyManagementOccupancy: many(dailyManagementOccupancy),
  })
);

export default storageFacilities;
