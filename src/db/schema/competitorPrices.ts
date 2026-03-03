import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import competitors from "./competitors";

export const unitAvailabilityEnum = pgEnum("unit_availability", [
  "AVAILABLE",
  "LIMITED",
  "WAITLIST",
  "UNAVAILABLE",
]);

const competitorPrices = pgTable("competitor_price", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id")
    .notNull()
    .references(() => competitors.id, { onDelete: "cascade" }),
  // Human-readable size label, e.g. "10x10", "5x5"
  unitSize: varchar("unit_size", { length: 20 }).notNull(),
  // Feature string, e.g. "climate", "drive-up", "interior"
  unitType: varchar("unit_type", { length: 100 }),
  // Raw dimensions for sorting/comparison
  width: numeric("width", { precision: 5, scale: 1 }),
  depth: numeric("depth", { precision: 5, scale: 1 }),
  // Walk-in / rack rate
  streetRate: numeric("street_rate", { precision: 8, scale: 2 }),
  // Online / web rate (often lower than street)
  webRate: numeric("web_rate", { precision: 8, scale: 2 }),
  // Active promotion text, e.g. "First month free"
  promotion: varchar("promotion", { length: 255 }),
  availability: unitAvailabilityEnum("availability"),
  scrapedAt: timestamp("scraped_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const competitorPricesRelations = relations(
  competitorPrices,
  ({ one }) => ({
    competitor: one(competitors, {
      fields: [competitorPrices.competitorId],
      references: [competitors.id],
    }),
  })
);

export type CompetitorPrice = typeof competitorPrices.$inferSelect;
export type NewCompetitorPrice = typeof competitorPrices.$inferInsert;
export default competitorPrices;
