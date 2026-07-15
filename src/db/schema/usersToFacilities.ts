import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { userDetails, storageFacilities } from "@/db/schema";

export const positionEnum = pgEnum("position", [
  "ACM_OFFICE",
  "AREA_MANAGER",
  "MANAGER",
  "ASSISTANT",
  "STORE_OWNER",
  "TERMINATED",
]);
const usersToFacilities = pgTable(
  "user_to_facilities",
  {
    userId: text("user_id")
      .notNull()
      .references(() => userDetails.id, { onDelete: "cascade" }),
    storageFacilityId: varchar("storage_facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    sitelinkEmployeeId: varchar("sitelink_employee_id").unique(),
    primarySite: boolean("primary_site"),
    rentsUnits: boolean("rents_units"),
    position: positionEnum("position"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storageFacilityId, t.userId] }),
    // The composite PK leads with storage_facility_id, so a lookup filtered
    // only by user_id (as done on every page load, for the nav facility
    // list, and in payroll) can't use it efficiently. This table is queried
    // by user_id far more often than by facility_id alone.
    userIdIndex: index("user_to_facilities_user_id_index").on(t.userId),
  })
);
export const insertUsersToFacilitiesSchema = createInsertSchema(
  usersToFacilities,
  {}
);
export type CreateUserToFacilities = z.infer<
  typeof insertUsersToFacilitiesSchema
>;
export type CreateUserToFacilityForm = CreateUserToFacilities[];

export const usersToFacilitiesRelations = relations(
  usersToFacilities,
  ({ one }) => ({
    storageFacility: one(storageFacilities, {
      fields: [usersToFacilities.storageFacilityId],
      references: [storageFacilities.sitelinkId],
    }),
    user: one(userDetails, {
      fields: [usersToFacilities.userId],
      references: [userDetails.id],
    }),
  })
);

export default usersToFacilities;
