import {
  boolean,
  pgTable,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { userDetails, storageFacilities } from "@/db/schema";

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
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storageFacilityId, t.userId] }),
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
