"use server";

import { db } from "@/db";
import { competitors, facilityCompetitors, storageFacilities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scrapeCompetitor } from "@/lib/scrapers";

export async function getFacilitiesWithCompetitors() {
  const facilities = await db
    .select()
    .from(storageFacilities)
    .where(eq(storageFacilities.isCorporate, false))
    .orderBy(storageFacilities.facilityName);

  const links = await db
    .select({
      facilityId: facilityCompetitors.facilityId,
      competitorId: competitors.id,
      name: competitors.name,
      chain: competitors.chain,
      streetAddress: competitors.streetAddress,
      city: competitors.city,
      state: competitors.state,
      zipCode: competitors.zipCode,
      phone: competitors.phone,
      email: competitors.email,
      website: competitors.website,
      scrapeUrl: competitors.scrapeUrl,
      scrapeEnabled: competitors.scrapeEnabled,
      lastScrapedAt: competitors.lastScrapedAt,
      notes: competitors.notes,
      facilityNotes: facilityCompetitors.notes,
      sortOrder: facilityCompetitors.sortOrder,
    })
    .from(facilityCompetitors)
    .innerJoin(competitors, eq(facilityCompetitors.competitorId, competitors.id))
    .orderBy(facilityCompetitors.sortOrder, competitors.name);

  return facilities.map((facility) => ({
    ...facility,
    competitors: links.filter((l) => l.facilityId === facility.sitelinkId),
  }));
}

export type FacilityWithCompetitors = Awaited<
  ReturnType<typeof getFacilitiesWithCompetitors>
>[number];
export type CompetitorRow = FacilityWithCompetitors["competitors"][number];

export type CompetitorFormData = {
  name: string;
  chain?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  scrapeUrl?: string;
  scrapeEnabled: boolean;
  notes?: string;
};

export async function addCompetitorToFacility(
  facilityId: string,
  data: CompetitorFormData
) {
  const [competitor] = await db
    .insert(competitors)
    .values({
      name: data.name,
      chain: data.chain || null,
      streetAddress: data.streetAddress || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      scrapeUrl: data.scrapeUrl || null,
      scrapeEnabled: data.scrapeEnabled,
      notes: data.notes || null,
    })
    .returning({ id: competitors.id });

  await db.insert(facilityCompetitors).values({
    facilityId,
    competitorId: competitor.id,
  });

  return competitor;
}

export async function updateCompetitor(
  competitorId: number,
  data: CompetitorFormData
) {
  return db
    .update(competitors)
    .set({
      name: data.name,
      chain: data.chain || null,
      streetAddress: data.streetAddress || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      scrapeUrl: data.scrapeUrl || null,
      scrapeEnabled: data.scrapeEnabled,
      notes: data.notes || null,
    })
    .where(eq(competitors.id, competitorId));
}

export async function deleteCompetitor(competitorId: number) {
  // Cascade handles facilityCompetitors + competitorPrices
  return db.delete(competitors).where(eq(competitors.id, competitorId));
}

export async function scrapeCompetitorNow(competitorId: number) {
  return scrapeCompetitor(competitorId);
}
