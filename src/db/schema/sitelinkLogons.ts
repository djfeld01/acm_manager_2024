import { relations, eq } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  text,
  primaryKey,
  pgView,
  pgMaterializedView,
} from "drizzle-orm/pg-core";
import users, { userDetails, usersToFacilities } from "./user";
import storageFacilities from "./storageFacilities";

const sitelinkLogons = pgTable(
  "sitelink_logon",
  {
    sitelinkEmployeeId: varchar("sitelink_employee_id")
      .notNull()
      .references(() => usersToFacilities.sitelinkEmployeeId, {
        onDelete: "cascade",
      }),
    dateTime: timestamp("date_time").notNull(),
    computerName: varchar("computer_name").notNull(),
    computerIP: varchar("computer_ip").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.dateTime, t.sitelinkEmployeeId] }),
  })
);

export const sitelinkLogonsRelations = relations(sitelinkLogons, ({ one }) => ({
  userToFacility: one(usersToFacilities, {
    fields: [sitelinkLogons.sitelinkEmployeeId],
    references: [usersToFacilities.sitelinkEmployeeId],
  }),
}));

export const logonWithFacilityUserView = pgMaterializedView(
  "logon_with_facility_user_view"
).as((qb) =>
  qb
    .select({
      employeeId: sitelinkLogons.sitelinkEmployeeId,
      logonDate: sitelinkLogons.dateTime,
      computerName: sitelinkLogons.computerName,
      computerIP: sitelinkLogons.computerIP,
      storageFacilityId: usersToFacilities.storageFacilityId,
      userId: usersToFacilities.userId,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
    })
    .from(sitelinkLogons)
    .innerJoin(
      usersToFacilities,
      eq(
        sitelinkLogons.sitelinkEmployeeId,
        usersToFacilities.sitelinkEmployeeId
      )
    )
    .innerJoin(userDetails, eq(usersToFacilities.userId, userDetails.id))
    .innerJoin(
      storageFacilities,
      eq(usersToFacilities.storageFacilityId, storageFacilities.sitelinkId)
    )
);

export default sitelinkLogons;
