import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  text,
  primaryKey,
} from "drizzle-orm/pg-core";
import { usersToFacilities } from "./user";

const sitelinkLogons = pgTable(
  "sitelink_logon",
  {
    sitelinkEmployeeId: varchar("sitelink_employee_id")
      .notNull()
      .references(() => usersToFacilities.sitelinkEmployeeId),
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

export default sitelinkLogons;
