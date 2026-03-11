import { relations } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { ownershipGroupToOwners, storageFacilities } from "@/db/schema";

const ownershipGroup = pgTable("ownership_group", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  ein: varchar("ein", { length: 20 }),
});

export const ownershipGroupRelations = relations(ownershipGroup, ({ many }) => ({
  ownershipGroupToOwners: many(ownershipGroupToOwners),
  facilities: many(storageFacilities),
}));

export default ownershipGroup;
