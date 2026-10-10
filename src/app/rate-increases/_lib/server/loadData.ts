import { db } from "@/db";
import { rentRollSnapshot, tenantActivities } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { dayNum, isoFromDayNum, type StayInput } from "../analytics";
import { normalizeSize, normalizeUnitType } from "../unitTypes";
import type { RentRollSnapshotRow } from "@/db/schema/rentRollSnapshot";

export interface LatestSnapshot {
  date: string | null;
  rows: RentRollSnapshotRow[];
}

export async function loadLatestSnapshot(sitelinkId: string): Promise<LatestSnapshot> {
  const [latest] = await db
    .select({ d: rentRollSnapshot.snapshotDate })
    .from(rentRollSnapshot)
    .where(eq(rentRollSnapshot.sitelinkId, sitelinkId))
    .orderBy(desc(rentRollSnapshot.snapshotDate))
    .limit(1);
  if (!latest) return { date: null, rows: [] };
  const rows = await db
    .select()
    .from(rentRollSnapshot)
    .where(
      and(
        eq(rentRollSnapshot.sitelinkId, sitelinkId),
        eq(rentRollSnapshot.snapshotDate, latest.d)
      )
    );
  return { date: latest.d, rows };
}

/**
 * Every stay we can see for a facility: move-outs recorded since tracking
 * began (move-in = move-out date minus days rented), plus everyone currently
 * in the latest rent roll snapshot (still here, move-in = lease date).
 */
export async function loadStayInputs(
  sitelinkId: string,
  snapshotRows: RentRollSnapshotRow[]
): Promise<StayInput[]> {
  const exits = await db
    .select({
      date: tenantActivities.date,
      days: tenantActivities.moveOutDaysRented,
      type: tenantActivities.unitType,
      size: tenantActivities.unitSize,
    })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        sql`${tenantActivities.activityType} = 'MoveOut'`,
        sql`${tenantActivities.moveOutDaysRented} > 0`
      )
    );

  const stays: StayInput[] = [];
  for (const e of exits) {
    const exitIso = e.date.toISOString().slice(0, 10);
    stays.push({
      moveIn: isoFromDayNum(dayNum(exitIso) - (e.days ?? 0)),
      exit: exitIso,
      unitType: normalizeUnitType(e.type),
      size: normalizeSize(e.size),
    });
  }
  for (const r of snapshotRows) {
    if (r.isRented && r.leaseDate) {
      stays.push({
        moveIn: r.leaseDate,
        exit: null,
        unitType: r.unitType,
        size: normalizeSize(r.size),
      });
    }
  }
  return stays;
}
