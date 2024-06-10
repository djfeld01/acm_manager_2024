import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  bigint,
  varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";
import { relations } from "drizzle-orm";
import storageFacilities from "./storageFacilities";

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role"),
});

export const userRelations = relations(users, ({ many }) => ({
  usersToFacilities: many(usersToFacilities),
}));

export const usersToFacilities = pgTable(
  "user_to_facilities",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    storageFacilityId: bigint("storage_facility_id", { mode: "number" })
      .notNull()
      .references(() => storageFacilities.sitelinkId),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.storageFacilityId] }),
  })
);

export const usersToFacilitiesRelations = relations(
  usersToFacilities,
  ({ one }) => ({
    storageFacility: one(storageFacilities, {
      fields: [usersToFacilities.storageFacilityId],
      references: [storageFacilities.sitelinkId],
    }),
    user: one(users, {
      fields: [usersToFacilities.userId],
      references: [users.id],
    }),
  })
);

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount>().notNull(),
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
