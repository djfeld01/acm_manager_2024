"use server";

import { db } from "@/db";
import {
  facilityUnitRates,
  storageFacilities,
  competitors,
  facilityCompetitors,
  competitorPrices,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Upload / import
// ---------------------------------------------------------------------------

export type RateCardRow = {
  siteId: string; // raw SiteID from the report
  unitType: string;
  unitSize: string;
  width: number;
  length: number;
  area: number;
  standardRate: number;
  pushRate: number;
  pushRateUsed: boolean;
  webRate: number;
  taxRate: number;
  monthlyTax: number;
  totalUnits: number;
  totalOccupied: number;
  totalVacant: number;
};

export type UploadResult = {
  matched: number;
  upserted: number;
  unmatched: string[]; // siteIds that had no matching facility
};

/**
 * Parses a tab-separated SiteLink rate card export and upserts into
 * facility_unit_rate. Matches SiteID to storage_facility by sitelink_site_code
 * (tries exact match, then zero-padded to 4 chars).
 */
export async function importRateCard(tsvText: string): Promise<UploadResult> {
  const lines = tsvText.trim().split("\n");
  if (lines.length < 2) throw new Error("File appears empty");

  const headers = lines[0].split("\t").map((h) => h.trim());

  const idx = (name: string) => {
    const i = headers.indexOf(name);
    if (i === -1) throw new Error(`Missing column: ${name}`);
    return i;
  };

  // Map column names to indices
  const col = {
    siteId: idx("SiteID"),
    type: idx("Type"),
    unitSize: idx("UnitSize"),
    width: idx("dcWidth"),
    length: idx("dcLength"),
    area: idx("Area"),
    standardRate: idx("StandardRate"),
    pushRate: idx("PushRate"),
    pushRateUsed: idx("PushRateUsed"),
    webRate: idx("WebRate"),
    taxRate: idx("TaxRate"),
    monthlyTax: idx("MonthlyTax"),
    totalUnits: idx("TotalUnits"),
    totalOccupied: idx("TotalOccupied"),
    totalVacant: idx("TotalVacant"),
  };

  // Parse data rows
  const rows: RateCardRow[] = lines.slice(1).map((line) => {
    const cells = line.split("\t");
    return {
      siteId: cells[col.siteId]?.trim() ?? "",
      unitType: cells[col.type]?.trim() ?? "",
      unitSize: cells[col.unitSize]?.trim() ?? "",
      width: parseFloat(cells[col.width]) || 0,
      length: parseFloat(cells[col.length]) || 0,
      area: parseFloat(cells[col.area]) || 0,
      standardRate: parseFloat(cells[col.standardRate]) || 0,
      pushRate: parseFloat(cells[col.pushRate]) || 0,
      pushRateUsed: cells[col.pushRateUsed]?.trim().toUpperCase() === "TRUE",
      webRate: parseFloat(cells[col.webRate]) || 0,
      taxRate: parseFloat(cells[col.taxRate]) || 0,
      monthlyTax: parseFloat(cells[col.monthlyTax]) || 0,
      totalUnits: parseInt(cells[col.totalUnits]) || 0,
      totalOccupied: parseInt(cells[col.totalOccupied]) || 0,
      totalVacant: parseInt(cells[col.totalVacant]) || 0,
    };
  });

  // Load all facilities to build SiteID → facilityId map
  const facilities = await db
    .select({
      sitelinkId: storageFacilities.sitelinkId,
      sitelinkSiteCode: storageFacilities.sitelinkSiteCode,
    })
    .from(storageFacilities);

  const siteIdToFacilityId = new Map<string, string>();
  for (const f of facilities) {
    const code = f.sitelinkSiteCode.trim();
    // Try exact match and numeric-padded match
    siteIdToFacilityId.set(code, f.sitelinkId);
    siteIdToFacilityId.set(code.replace(/^0+/, ""), f.sitelinkId); // "0035" → "35"
    siteIdToFacilityId.set(code.padStart(4, "0"), f.sitelinkId); // "35" → "0035"
  }

  const unmatched = new Set<string>();
  const toUpsert: (typeof facilityUnitRates.$inferInsert)[] = [];

  for (const row of rows) {
    if (!row.siteId || !row.unitSize) continue;
    const facilityId = siteIdToFacilityId.get(row.siteId);
    if (!facilityId) {
      unmatched.add(row.siteId);
      continue;
    }
    toUpsert.push({
      facilityId,
      unitType: row.unitType,
      unitSize: row.unitSize,
      width: row.width,
      length: row.length,
      area: row.area,
      standardRate: row.standardRate.toString(),
      pushRate: row.pushRate > 0 ? row.pushRate.toString() : null,
      pushRateUsed: row.pushRateUsed,
      webRate: row.webRate.toString(),
      taxRate: row.taxRate.toString(),
      monthlyTax: row.monthlyTax.toString(),
      totalUnits: row.totalUnits,
      totalOccupied: row.totalOccupied,
      totalVacant: row.totalVacant,
      importedAt: new Date(),
    });
  }

  if (toUpsert.length > 0) {
    await db
      .insert(facilityUnitRates)
      .values(toUpsert)
      .onConflictDoUpdate({
        target: [
          facilityUnitRates.facilityId,
          facilityUnitRates.unitType,
          facilityUnitRates.unitSize,
        ],
        set: {
          width: facilityUnitRates.width,
          length: facilityUnitRates.length,
          area: facilityUnitRates.area,
          standardRate: facilityUnitRates.standardRate,
          pushRate: facilityUnitRates.pushRate,
          pushRateUsed: facilityUnitRates.pushRateUsed,
          webRate: facilityUnitRates.webRate,
          taxRate: facilityUnitRates.taxRate,
          monthlyTax: facilityUnitRates.monthlyTax,
          totalUnits: facilityUnitRates.totalUnits,
          totalOccupied: facilityUnitRates.totalOccupied,
          totalVacant: facilityUnitRates.totalVacant,
          importedAt: new Date(),
        },
      });
  }

  return {
    matched: facilities.length - unmatched.size,
    upserted: toUpsert.length,
    unmatched: Array.from(unmatched),
  };
}

// ---------------------------------------------------------------------------
// Comparison data
// ---------------------------------------------------------------------------

export type ComparisonRow = {
  unitSize: string;
  unitType: string;
  ourStandardRate: number | null;
  ourWebRate: number | null;
  ourPushRate: number | null;
  pushRateUsed: boolean;
  totalUnits: number | null;
  totalVacant: number | null;
  competitors: {
    competitorId: number;
    name: string;
    chain: string | null;
    streetRate: number | null;
    webRate: number | null;
    availability: string | null;
  }[];
};

export async function getComparisonData(
  facilityId: string
): Promise<ComparisonRow[]> {
  // Our rates for this facility
  const ourRates = await db
    .select()
    .from(facilityUnitRates)
    .where(eq(facilityUnitRates.facilityId, facilityId))
    .orderBy(facilityUnitRates.area, facilityUnitRates.unitType);

  // Competitors linked to this facility
  const linkedCompetitors = await db
    .select({
      competitorId: competitors.id,
      name: competitors.name,
      chain: competitors.chain,
    })
    .from(facilityCompetitors)
    .innerJoin(
      competitors,
      eq(facilityCompetitors.competitorId, competitors.id)
    )
    .where(eq(facilityCompetitors.facilityId, facilityId));

  if (linkedCompetitors.length === 0) {
    // No competitors yet — return our rates with empty competitor columns
    return ourRates.map((r) => ({
      unitSize: r.unitSize,
      unitType: r.unitType,
      ourStandardRate: r.standardRate ? parseFloat(r.standardRate) : null,
      ourWebRate: r.webRate ? parseFloat(r.webRate) : null,
      ourPushRate: r.pushRate ? parseFloat(r.pushRate) : null,
      pushRateUsed: r.pushRateUsed ?? false,
      totalUnits: r.totalUnits,
      totalVacant: r.totalVacant,
      competitors: [],
    }));
  }

  // All scraped prices for linked competitors
  const competitorIds = linkedCompetitors.map((c) => c.competitorId);
  const prices = await db
    .select()
    .from(competitorPrices)
    .where(inArray(competitorPrices.competitorId, competitorIds));

  // Build lookup: competitorId → prices[]
  const pricesByCompetitor = new Map<number, typeof prices>();
  for (const p of prices) {
    if (!pricesByCompetitor.has(p.competitorId)) {
      pricesByCompetitor.set(p.competitorId, []);
    }
    pricesByCompetitor.get(p.competitorId)!.push(p);
  }

  return ourRates.map((r) => {
    const competitorData = linkedCompetitors.map((c) => {
      // Match competitor unit to our unit by size; prefer climate match if our type is climate
      const competitorUnits = pricesByCompetitor.get(c.competitorId) ?? [];
      const isClimate = r.unitType.toLowerCase().includes("climate");

      const match = competitorUnits
        .filter((p) => p.unitSize === r.unitSize)
        .find((p) => {
          const pType = (p.unitType ?? "").toLowerCase();
          return isClimate ? pType.includes("climate") : !pType.includes("climate");
        }) ?? competitorUnits.find((p) => p.unitSize === r.unitSize); // fallback: any size match

      return {
        competitorId: c.competitorId,
        name: c.name,
        chain: c.chain,
        streetRate: match?.streetRate ? parseFloat(match.streetRate) : null,
        webRate: match?.webRate ? parseFloat(match.webRate) : null,
        availability: match?.availability ?? null,
      };
    });

    return {
      unitSize: r.unitSize,
      unitType: r.unitType,
      ourStandardRate: r.standardRate ? parseFloat(r.standardRate) : null,
      ourWebRate: r.webRate ? parseFloat(r.webRate) : null,
      ourPushRate: r.pushRate ? parseFloat(r.pushRate) : null,
      pushRateUsed: r.pushRateUsed ?? false,
      totalUnits: r.totalUnits,
      totalVacant: r.totalVacant,
      competitors: competitorData,
    };
  });
}

export async function getFacilitiesWithRates() {
  return db
    .select({
      sitelinkId: storageFacilities.sitelinkId,
      facilityName: storageFacilities.facilityName,
    })
    .from(storageFacilities)
    .where(eq(storageFacilities.isCorporate, false))
    .orderBy(storageFacilities.facilityName);
}
