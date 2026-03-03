import { db } from "@/db";
import { competitors, competitorPrices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scrapeExtraSpace } from "./extraSpace";
import { scrapePublicStorage } from "./publicStorage";
import type { ParsedUnit, ScrapeResult } from "./types";

// Chains that redirect to or share a platform with a known scraper
const EXTRA_SPACE_CHAINS = new Set([
  "extra space",
  "extra space storage",
  "life storage",
  "storage express", // some properties under ES umbrella
]);

const PUBLIC_STORAGE_CHAINS = new Set([
  "public storage",
  "simply self storage",
  "simply storage",
]);

function pickScraper(
  chain: string | null
): ((url: string) => Promise<ParsedUnit[]>) | null {
  if (!chain) return null;
  const normalized = chain.toLowerCase().trim();
  if (EXTRA_SPACE_CHAINS.has(normalized)) return scrapeExtraSpace;
  if (PUBLIC_STORAGE_CHAINS.has(normalized)) return scrapePublicStorage;
  return null;
}

export async function scrapeCompetitor(
  competitorId: number
): Promise<ScrapeResult> {
  const [competitor] = await db
    .select()
    .from(competitors)
    .where(eq(competitors.id, competitorId))
    .limit(1);

  if (!competitor) {
    return {
      competitorId,
      competitorName: "unknown",
      success: false,
      unitsFound: 0,
      error: "Competitor not found",
    };
  }

  if (!competitor.scrapeUrl) {
    return {
      competitorId,
      competitorName: competitor.name,
      success: false,
      unitsFound: 0,
      error: "No scrape URL configured",
    };
  }

  const scraper = pickScraper(competitor.chain);
  if (!scraper) {
    return {
      competitorId,
      competitorName: competitor.name,
      success: false,
      unitsFound: 0,
      error: `No scraper available for chain "${competitor.chain ?? "unknown"}"`,
    };
  }

  try {
    const units = await scraper(competitor.scrapeUrl);

    // Replace all existing prices for this competitor with fresh data
    await db
      .delete(competitorPrices)
      .where(eq(competitorPrices.competitorId, competitorId));

    if (units.length > 0) {
      await db.insert(competitorPrices).values(
        units.map((u) => ({
          competitorId,
          unitSize: u.unitSize,
          unitType: u.unitType,
          width: u.width?.toString() ?? null,
          depth: u.depth?.toString() ?? null,
          streetRate: u.streetRate?.toString() ?? null,
          webRate: u.webRate?.toString() ?? null,
          promotion: u.promotion,
          availability: u.availability,
        }))
      );
    }

    // Update last scraped timestamp
    await db
      .update(competitors)
      .set({ lastScrapedAt: new Date() })
      .where(eq(competitors.id, competitorId));

    return {
      competitorId,
      competitorName: competitor.name,
      success: true,
      unitsFound: units.length,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      competitorId,
      competitorName: competitor.name,
      success: false,
      unitsFound: 0,
      error,
    };
  }
}

export async function scrapeAllEnabled(): Promise<ScrapeResult[]> {
  const enabled = await db
    .select({ id: competitors.id })
    .from(competitors)
    .where(eq(competitors.scrapeEnabled, true));

  // Run sequentially to avoid hammering sites
  const results: ScrapeResult[] = [];
  for (const { id } of enabled) {
    results.push(await scrapeCompetitor(id));
  }
  return results;
}
