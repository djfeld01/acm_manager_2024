import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import facilityCompetitors from "./facilityCompetitors";
import competitorPrices from "./competitorPrices";

const competitors = pgTable("competitor", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  // REIT chain name (e.g. "Public Storage", "CubeSmart", "Extra Space", "UHaul")
  // null for independent operators
  chain: varchar("chain", { length: 100 }),
  streetAddress: varchar("street_address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  // Main website URL
  website: varchar("website", { length: 500 }),
  // Specific facility pricing page URL to scrape
  scrapeUrl: varchar("scrape_url", { length: 500 }),
  scrapeEnabled: boolean("scrape_enabled").default(true).notNull(),
  lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const competitorsRelations = relations(competitors, ({ many }) => ({
  facilityCompetitors: many(facilityCompetitors),
  prices: many(competitorPrices),
}));

export type Competitor = typeof competitors.$inferSelect;
export type NewCompetitor = typeof competitors.$inferInsert;
export default competitors;
