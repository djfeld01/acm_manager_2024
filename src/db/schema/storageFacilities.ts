import { relations } from "drizzle-orm";
import {
  pgTable,
  integer,
  varchar,
  text,
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
  dailyManagementActivity,
  dailyManagementReceivable,
  bankAccount,
  dailyManagementSundries,
  userDetails,
  ownershipGroup,
} from "@/db/schema";
import dailyManagementPaymentReceipt from "./dailyManagementPaymentReceipt";

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
    isCorporate: boolean("is_corporate").notNull().default(false),
    storageCommissionRate: real("storage_commission_rate").default(5).notNull(),
    insuranceCommissionRate: real("insurance_commission_rate")
      .default(1.5)
      .notNull(),
    areaManagerId: text("area_manager_id").references(() => userDetails.id),
    ownershipGroupId: text("ownership_group_id").references(
      () => ownershipGroup.id
    ),
  },
  (table) => ({
    nameIndex: index().on(table.facilityName),
  })
);

export const storageFacilitiesRelations = relations(
  storageFacilities,
  ({ many, one }) => ({
    areaManager: one(userDetails, {
      fields: [storageFacilities.areaManagerId],
      references: [userDetails.id],
    }),
    ownershipGroup: one(ownershipGroup, {
      fields: [storageFacilities.ownershipGroupId],
      references: [ownershipGroup.id],
    }),
    usersToFacilities: many(usersToFacilities),
    dailyPayments: many(dailyPayments),
    tenantActivities: many(tenantActivities),
    quickbooksBalance: many(quickbooksBalance),
    monthlyGoals: many(monthlyGoals),
    dailyManagementOccupancy: many(dailyManagementOccupancy),
    dailyManagementActivity: many(dailyManagementActivity),
    dailyManagementReceivable: many(dailyManagementReceivable),
    dailyManagementPaymentReceipt: many(dailyManagementPaymentReceipt),
    dailyManagementSundries: many(dailyManagementSundries),
    bankAccount: many(bankAccount),
  })
);

export default storageFacilities;
