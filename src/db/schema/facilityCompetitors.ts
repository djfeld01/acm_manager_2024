import { relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";
import competitors from "./competitors";

const facilityCompetitors = pgTable(
  "facility_competitor",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId, { onDelete: "cascade" }),
    competitorId: integer("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    // Notes specific to this competitor at this facility
    notes: text("notes"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.facilityId, table.competitorId] }),
  })
);

export const facilityCompetitorsRelations = relations(
  facilityCompetitors,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [facilityCompetitors.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
    competitor: one(competitors, {
      fields: [facilityCompetitors.competitorId],
      references: [competitors.id],
    }),
  })
);

export type FacilityCompetitor = typeof facilityCompetitors.$inferSelect;
export default facilityCompetitors;
