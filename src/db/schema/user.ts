import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  bigint,
  varchar,
  pgEnum,
  AnyPgColumn,
  boolean,
} from "drizzle-orm/pg-core";
import type { AdapterAccount, AdapterAccountType } from "next-auth/adapters";
import { relations, sql, SQL } from "drizzle-orm";
import storageFacilities from "./storageFacilities";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", [
  "USER",
  "MANAGER",
  "ASSISTANT",
  "OWNER",
  "ADMIN",
  "SUPERVISOR",
]);
export enum Role {
  USER = "USER",
  MANAGER = "MANAGER",
  ASSISTANT = "ASSISTANT",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  SUPERVISOR = "SUPERVISOR",
}
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("USER"),
  userDetailId: text("user_detail_id").references(() => userDetails.id),
});

export const userRelations = relations(users, ({ one }) => ({
  userDetails: one(userDetails, {
    fields: [users.userDetailId],
    references: [userDetails.id],
  }),
}));

export const userDetails = pgTable("user_detail", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fullName: text("full_name").generatedAlwaysAs(
    (): SQL => sql`${userDetails.firstName} || ' ' || ${userDetails.lastName}`
  ),
  initials: text("initials").generatedAlwaysAs(
    (): SQL =>
      sql`LEFT(${userDetails.firstName},1) || LEFT(${userDetails.lastName},1)`
  ),
  //connect to the user table from auth.js
  paycorEmployeeId: integer("paycor_employee_id").unique(),
  supervisorId: text("supervisor_id").references(
    (): AnyPgColumn => userDetails.id
  ),
});

export const insertUserDetailsSchema = createInsertSchema(userDetails, {
  email: (schema) => schema.email.email(),
  paycorEmployeeId: z.string().transform((val) => parseFloat(val)),
  //sitelinkEmployeeId: z.string().transform((val) => parseFloat(val)),
});

export type CreateUserDetails = z.infer<typeof insertUserDetailsSchema>;

export const userDetailsRelations = relations(userDetails, ({ one, many }) => ({
  usersToFacilities: many(usersToFacilities),
  user: one(users),
  supervisor: one(userDetails, {
    fields: [userDetails.supervisorId],
    references: [userDetails.id],
  }),
}));

export const usersToFacilities = pgTable(
  "user_to_facilities",
  {
    userId: text("user_id")
      .notNull()
      .references(() => userDetails.id),
    storageFacilityId: varchar("storage_facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    // sitelinkEmployeeId: integer("sitelink_employee_id").unique(),
    // primarySite: boolean("primary_site"),
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

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export default users;
