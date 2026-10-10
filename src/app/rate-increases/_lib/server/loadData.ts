import { db } from "@/db";
import { rentRollSnapshot, tenantActivities } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { dayNum, isoFromDayNum, type StayInput } from "../analytics";
import { normalizeSize, normalizeUnitType } from "../unitTypes";
import { parseSpecialMonths } from "../specials";
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
        ledgerId: r.ledgerId ?? undefined,
      });
    }
  }
  return stays;
}

/**
 * Months of move-in discount for each current tenancy, found by matching the
 * snapshot row (tenant + unit + lease date) to its MoveIn activity record.
 * Tenants who moved in before our activity records begin (2024-01-02), or
 * whose special text isn't recognized, come back as null.
 */
export async function loadSpecialMonths(
  sitelinkId: string,
  snapshotRows: RentRollSnapshotRow[]
): Promise<Map<string, number | null>> {
  const moveIns = await db
    .select({
      tenant: tenantActivities.tenantSitelinkId,
      unit: tenantActivities.unitName,
      date: tenantActivities.date,
      plan: tenantActivities.moveInDiscountPlan,
    })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        sql`${tenantActivities.activityType} = 'MoveIn'`
      )
    );

  const byTenant = new Map<string, { unit: string | null; day: number; plan: string | null }[]>();
  for (const m of moveIns) {
    const key = String(m.tenant);
    const list = byTenant.get(key) ?? [];
    list.push({ unit: m.unit, day: dayNum(m.date.toISOString().slice(0, 10)), plan: m.plan });
    byTenant.set(key, list);
  }

  const out = new Map<string, number | null>();
  for (const r of snapshotRows) {
    if (!r.isRented || !r.ledgerId) continue;
    let months: number | null = null;
    if (r.tenantId && r.leaseDate) {
      const lease = dayNum(r.leaseDate);
      const near = (byTenant.get(r.tenantId) ?? [])
        .filter((m) => m.unit === r.unitName && Math.abs(m.day - lease) <= 7)
        .sort((a, b) => Math.abs(a.day - lease) - Math.abs(b.day - lease))[0];
      if (near) months = parseSpecialMonths(near.plan);
    }
    out.set(r.ledgerId, months);
  }
  return out;
}
