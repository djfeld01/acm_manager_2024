"use server";
import { db } from "@/db";
import { rentRollSnapshot, storageFacilities } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { assertAccess } from "../_lib/server/guard";

export interface SnapshotStatus {
  facilityName: string;
  latestDate: string | null;
  /** Whole days between the latest snapshot and today. */
  ageDays: number | null;
  snapshots: { date: string; units: number; rented: number }[];
}

export async function getSnapshotStatus(sitelinkId: string): Promise<SnapshotStatus> {
  await assertAccess(sitelinkId);

  const [facility] = await db
    .select({ name: storageFacilities.facilityName })
    .from(storageFacilities)
    .where(eq(storageFacilities.sitelinkId, sitelinkId))
    .limit(1);

  const snapshots = await db
    .select({
      date: rentRollSnapshot.snapshotDate,
      units: sql<number>`count(*)::int`,
      rented: sql<number>`count(*) filter (where ${rentRollSnapshot.isRented})::int`,
    })
    .from(rentRollSnapshot)
    .where(eq(rentRollSnapshot.sitelinkId, sitelinkId))
    .groupBy(rentRollSnapshot.snapshotDate)
    .orderBy(desc(rentRollSnapshot.snapshotDate))
    .limit(30);

  const latestDate = snapshots[0]?.date ?? null;
  const ageDays = latestDate
    ? Math.floor((Date.now() - new Date(latestDate + "T00:00:00Z").getTime()) / 86400000)
    : null;

  return { facilityName: facility?.name ?? sitelinkId, latestDate, ageDays, snapshots };
}
