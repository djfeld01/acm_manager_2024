import { db } from "@/db";
import { monthlyOccupancySnapshot } from "@/db/schema/monthlyOccupancySnapshot";
import { storageFacilities } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface MonthlyOccupancyData {
  facilityId: string;
  facilityName: string;
  facilityAbbreviation: string;
  year: number;
  month: number;
  yearMonth: string;
  lastDayOfMonth: string;
  unitOccupancy: number | null;
  financialOccupancy: number | null;
  squareFootageOccupancy: number | null;
}

/**
 * Refresh the monthly_occupancy_snapshot materialized view.
 * Call this after any batch of new daily occupancy rows are inserted
 * (e.g. at the end of /api/sitelinkManagementDaily/occupancy).
 * CONCURRENTLY means readers are never blocked during the refresh.
 */
export async function refreshMonthlyOccupancySnapshot(): Promise<void> {
  await db.refreshMaterializedView(monthlyOccupancySnapshot).concurrently();
}

/**
 * Get occupancy numbers for the last day of each month per facility.
 * Queries the monthly_occupancy_snapshot materialized view instead of
 * running a correlated subquery against the raw daily table.
 */
export async function getMonthlyOccupancy(
  facilityIds?: string[],
  startDate?: string,
  endDate?: string
): Promise<MonthlyOccupancyData[]> {
  const results = await db
    .select({
      facilityId: monthlyOccupancySnapshot.facilityId,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      year: sql<number>`EXTRACT(YEAR FROM ${monthlyOccupancySnapshot.date})`.as("year"),
      month: sql<number>`EXTRACT(MONTH FROM ${monthlyOccupancySnapshot.date})`.as("month"),
      yearMonth: sql<string>`TO_CHAR(${monthlyOccupancySnapshot.date}, 'YYYY-MM')`.as("yearMonth"),
      lastDayOfMonth: sql<string>`${monthlyOccupancySnapshot.date}::text`.as("lastDayOfMonth"),
      unitOccupancy: monthlyOccupancySnapshot.unitOccupancy,
      financialOccupancy: monthlyOccupancySnapshot.financialOccupancy,
      squareFootageOccupancy: monthlyOccupancySnapshot.squareFootageOccupancy,
    })
    .from(monthlyOccupancySnapshot)
    .innerJoin(
      storageFacilities,
      eq(monthlyOccupancySnapshot.facilityId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        facilityIds && facilityIds.length > 0
          ? sql`${monthlyOccupancySnapshot.facilityId} = ANY(${facilityIds})`
          : undefined,
        startDate
          ? sql`${monthlyOccupancySnapshot.date} >= ${startDate}`
          : undefined,
        endDate
          ? sql`${monthlyOccupancySnapshot.date} <= ${endDate}`
          : undefined
      )
    )
    .orderBy(
      monthlyOccupancySnapshot.facilityId,
      desc(sql`EXTRACT(YEAR FROM ${monthlyOccupancySnapshot.date})`),
      desc(sql`EXTRACT(MONTH FROM ${monthlyOccupancySnapshot.date})`)
    );

  return results.map((row) => ({
    facilityId: row.facilityId,
    facilityName: row.facilityName,
    facilityAbbreviation: row.facilityAbbreviation,
    year: row.year,
    month: row.month,
    yearMonth: row.yearMonth,
    lastDayOfMonth: row.lastDayOfMonth,
    unitOccupancy: row.unitOccupancy,
    financialOccupancy: row.financialOccupancy,
    squareFootageOccupancy: row.squareFootageOccupancy,
  }));
}

export async function getMonthlyOccupancyByFacility(
  facilityId: string,
  startDate?: string,
  endDate?: string
): Promise<MonthlyOccupancyData[]> {
  return getMonthlyOccupancy([facilityId], startDate, endDate);
}

export async function getLatestMonthlyOccupancy(
  facilityIds?: string[]
): Promise<MonthlyOccupancyData[]> {
  // The view already stores only one row per facility per month (the last day),
  // so "latest" is just the most recent date per facility.
  const results = await db
    .select({
      facilityId: monthlyOccupancySnapshot.facilityId,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      year: sql<number>`EXTRACT(YEAR FROM ${monthlyOccupancySnapshot.date})`.as("year"),
      month: sql<number>`EXTRACT(MONTH FROM ${monthlyOccupancySnapshot.date})`.as("month"),
      yearMonth: sql<string>`TO_CHAR(${monthlyOccupancySnapshot.date}, 'YYYY-MM')`.as("yearMonth"),
      lastDayOfMonth: sql<string>`${monthlyOccupancySnapshot.date}::text`.as("lastDayOfMonth"),
      unitOccupancy: monthlyOccupancySnapshot.unitOccupancy,
      financialOccupancy: monthlyOccupancySnapshot.financialOccupancy,
      squareFootageOccupancy: monthlyOccupancySnapshot.squareFootageOccupancy,
    })
    .from(monthlyOccupancySnapshot)
    .innerJoin(
      storageFacilities,
      eq(monthlyOccupancySnapshot.facilityId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        facilityIds && facilityIds.length > 0
          ? sql`${monthlyOccupancySnapshot.facilityId} = ANY(${facilityIds})`
          : undefined,
        // Subquery: only rows where date = the latest date for that facility
        sql`${monthlyOccupancySnapshot.date} = (
          SELECT MAX(s2.date)
          FROM monthly_occupancy_snapshot s2
          WHERE s2.facility_id = ${monthlyOccupancySnapshot.facilityId}
        )`
      )
    )
    .orderBy(monthlyOccupancySnapshot.facilityId);

  return results.map((row) => ({
    facilityId: row.facilityId,
    facilityName: row.facilityName,
    facilityAbbreviation: row.facilityAbbreviation,
    year: row.year,
    month: row.month,
    yearMonth: row.yearMonth,
    lastDayOfMonth: row.lastDayOfMonth,
    unitOccupancy: row.unitOccupancy,
    financialOccupancy: row.financialOccupancy,
    squareFootageOccupancy: row.squareFootageOccupancy,
  }));
}

export async function getMonthlyOccupancyTrends(
  facilityId: string,
  monthsBack: number = 12
): Promise<MonthlyOccupancyData[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);

  return getMonthlyOccupancyByFacility(
    facilityId,
    startDate.toISOString().split("T")[0],
    endDate.toISOString().split("T")[0]
  );
}
