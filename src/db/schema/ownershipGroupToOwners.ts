import { relations } from "drizzle-orm";
import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { owner, ownershipGroup } from "@/db/schema";

const ownershipGroupToOwners = pgTable(
  "ownership_group_to_owners",
  {
    ownershipGroupId: text("ownership_group_id")
      .notNull()
      .references(() => ownershipGroup.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owner.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ownershipGroupId, t.ownerId] }),
  })
);

export const ownershipGroupToOwnersRelations = relations(
  ownershipGroupToOwners,
  ({ one }) => ({
    ownershipGroup: one(ownershipGroup, {
      fields: [ownershipGroupToOwners.ownershipGroupId],
      references: [ownershipGroup.id],
    }),
    owner: one(owner, {
      fields: [ownershipGroupToOwners.ownerId],
      references: [owner.id],
    }),
  })
);

export default ownershipGroupToOwners;
