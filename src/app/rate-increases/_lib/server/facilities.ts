import { db } from "@/db";
import { storageFacilities } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface RateIncreaseFacility {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * The stores the rate-increase tools are switched on for: every current
 * client store (not the corporate office, not former clients), in zip-code
 * order so stores near each other sit together.
 */
export async function loadRateIncreaseFacilities(): Promise<RateIncreaseFacility[]> {
  const rows = await db
    .select({
      id: storageFacilities.sitelinkId,
      code: storageFacilities.sitelinkSiteCode,
      name: storageFacilities.facilityName,
      city: storageFacilities.city,
      state: storageFacilities.state,
      zip: storageFacilities.zipCode,
    })
    .from(storageFacilities)
    .where(and(eq(storageFacilities.currentClient, true), eq(storageFacilities.isCorporate, false)));
  return rows.sort((a, b) => a.zip.localeCompare(b.zip) || a.name.localeCompare(b.name));
}

export async function isRateIncreaseFacility(sitelinkId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: storageFacilities.sitelinkId })
    .from(storageFacilities)
    .where(
      and(
        eq(storageFacilities.sitelinkId, sitelinkId),
        eq(storageFacilities.currentClient, true),
        eq(storageFacilities.isCorporate, false)
      )
    )
    .limit(1);
  return !!row;
}
