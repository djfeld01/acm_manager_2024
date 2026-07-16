import { relations, eq } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { usersToFacilities } from "@/db/schema";

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
    // The primary key leads with date_time, so it can't efficiently answer
    // "latest logons for a given employee" (needed by the location-detail
    // header, which now queries the base tables directly instead of the old
    // logon_with_facility_user_view materialized view). This index makes the
    // per-employee, date-ordered lookup an index seek. See migration 0049.
    employeeDateIndex: index("sitelink_logon_employee_id_date_time_index").on(
      t.sitelinkEmployeeId,
      t.dateTime
    ),
  })
);

export const sitelinkLogonsRelations = relations(sitelinkLogons, ({ one }) => ({
  userToFacility: one(usersToFacilities, {
    fields: [sitelinkLogons.sitelinkEmployeeId],
    references: [usersToFacilities.sitelinkEmployeeId],
  }),
}));

export default sitelinkLogons;
