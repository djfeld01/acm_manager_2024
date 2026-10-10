import { db } from "@/db";
import { inquiry, tenantActivities, unit } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { dayNum, isoFromDayNum, type StayAnalysis } from "../analytics";
import {
  computeDemandHealth,
  seasonalIndexFromLeases,
  type DemandHealth,
} from "../demand";
import { UNIT_TYPE_GROUPS, compareSizes, normalizeSize, normalizeUnitType } from "../unitTypes";

export interface UnitCounts {
  unitType: string;
  size: string | null;
  isRentable: boolean;
  isRented: boolean;
}

export async function buildDemandHealth(
  sitelinkId: string,
  asOf: string,
  units: UnitCounts[],
  stay: StayAnalysis
): Promise<DemandHealth> {
  const since = isoFromDayNum(dayNum(asOf) - 800);

  const moveInRows = await db
    .select({
      date: tenantActivities.date,
      type: tenantActivities.unitType,
      size: tenantActivities.unitSize,
    })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        sql`${tenantActivities.activityType} = 'MoveIn'`,
        gte(tenantActivities.date, new Date(since))
      )
    );

  const inquiryRows = await db
    .select({
      placed: inquiry.datePlaced,
      leased: inquiry.leaseDate,
      type: unit.unitTypeName,
      size: unit.size,
    })
    .from(inquiry)
    .leftJoin(unit, eq(unit.unitId, inquiry.unitId))
    .where(and(eq(inquiry.sitelinkId, sitelinkId), gte(inquiry.datePlaced, new Date(since))));

  const seasonRows = await db
    .select({
      year: sql<number>`extract(year from ${inquiry.leaseDate})::int`,
      month: sql<number>`extract(month from ${inquiry.leaseDate})::int`,
      n: sql<number>`count(*)::int`,
    })
    .from(inquiry)
    .where(
      and(
        eq(inquiry.sitelinkId, sitelinkId),
        sql`${inquiry.leaseDate} is not null`,
        sql`${inquiry.leaseDate} >= '2019-01-01'`
      )
    )
    .groupBy(sql`1`, sql`2`);

  const rentable = units.filter((u) => u.isRentable);
  const vacantUnits: Record<string, number> = { All: rentable.filter((u) => !u.isRented).length };
  for (const t of UNIT_TYPE_GROUPS) {
    vacantUnits[t] = rentable.filter((u) => u.unitType === t && !u.isRented).length;
  }

  // Sizes and types never collide as keys ("Parking" vs "10x10"), so one map serves both.
  const sizes = Array.from(new Set(units.map((u) => normalizeSize(u.size)))).sort(compareSizes);
  for (const z of sizes) {
    vacantUnits[z] = rentable.filter((u) => normalizeSize(u.size) === z && !u.isRented).length;
  }

  const expectedMoveOutsPerMonth: Record<string, number> = { All: stay.overall.expectedMoveOuts.d90 / 3 };
  for (const s of [...stay.byType, ...stay.bySize]) expectedMoveOutsPerMonth[s.label] = s.expectedMoveOuts.d90 / 3;

  return computeDemandHealth({
    asOf,
    moveIns: moveInRows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      unitType: normalizeUnitType(r.type),
      size: normalizeSize(r.size),
    })),
    inquiries: inquiryRows.map((r) => ({
      placed: r.placed!.toISOString().slice(0, 10),
      leased: r.leased ? r.leased.toISOString().slice(0, 10) : null,
      unitType: normalizeUnitType(r.type),
      size: normalizeSize(r.size),
    })),
    seasonalIndex: seasonalIndexFromLeases(seasonRows, Number(asOf.slice(0, 4))),
    expectedMoveOutsPerMonth,
    vacantUnits,
    unitTypes: [...UNIT_TYPE_GROUPS],
    sizes,
  });
}
