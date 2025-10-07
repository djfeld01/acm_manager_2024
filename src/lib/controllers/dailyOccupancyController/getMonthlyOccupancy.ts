import { db } from "@/db";
import dailyManagementOccupancy from "@/db/schema/dailyManagementOccupancy";
import { storageFacilities } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// Type for monthly occupancy data
export interface MonthlyOccupancyData {
  facilityId: string;
  facilityName: string;
  facilityAbbreviation: string;
  year: number;
  month: number;
  yearMonth: string; // Format: "YYYY-MM"
  lastDayOfMonth: string;
  unitOccupancy: number | null;
  financialOccupancy: number | null;
  squareFootageOccupancy: number | null;
}

// Type for the raw query result
interface RawMonthlyOccupancyResult {
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
 * Get occupancy numbers for the last day of each month for each location
 *
 * @param facilityIds - Optional array of facility IDs to filter by
 * @param startDate - Optional start date (YYYY-MM-DD format)
 * @param endDate - Optional end date (YYYY-MM-DD format)
 * @returns Array of monthly occupancy data for each facility
 */
export async function getMonthlyOccupancy(
  facilityIds?: string[],
  startDate?: string,
  endDate?: string
): Promise<MonthlyOccupancyData[]> {
  try {
    // Build the base query to get the last day of each month for each facility
    let query = db
      .select({
        facilityId: dailyManagementOccupancy.facilityId,
        facilityName: storageFacilities.facilityName,
        facilityAbbreviation: storageFacilities.facilityAbbreviation,
        year: sql<number>`EXTRACT(YEAR FROM ${dailyManagementOccupancy.date})`.as(
          "year"
        ),
        month:
          sql<number>`EXTRACT(MONTH FROM ${dailyManagementOccupancy.date})`.as(
            "month"
          ),
        yearMonth:
          sql<string>`TO_CHAR(${dailyManagementOccupancy.date}, 'YYYY-MM')`.as(
            "yearMonth"
          ),
        lastDayOfMonth: sql<string>`${dailyManagementOccupancy.date}::text`.as(
          "lastDayOfMonth"
        ),
        unitOccupancy: dailyManagementOccupancy.unitOccupancy,
        financialOccupancy: dailyManagementOccupancy.financialOccupancy,
        squareFootageOccupancy: dailyManagementOccupancy.squareFootageOccupancy,
      })
      .from(dailyManagementOccupancy)
      .innerJoin(
        storageFacilities,
        eq(dailyManagementOccupancy.facilityId, storageFacilities.sitelinkId)
      )
      .where(
        and(
          // Only get records where the date is the last day of the month
          sql`${dailyManagementOccupancy.date} = (
            SELECT MAX(date) 
            FROM daily_management_occupancy dmo2 
            WHERE dmo2.facility_id = ${dailyManagementOccupancy.facilityId}
            AND EXTRACT(YEAR FROM dmo2.date) = EXTRACT(YEAR FROM ${dailyManagementOccupancy.date})
            AND EXTRACT(MONTH FROM dmo2.date) = EXTRACT(MONTH FROM ${dailyManagementOccupancy.date})
          )`,
          // Apply facility filter if provided
          facilityIds && facilityIds.length > 0
            ? sql`${dailyManagementOccupancy.facilityId} = ANY(${facilityIds})`
            : undefined,
          // Apply date range filters if provided
          startDate
            ? sql`${dailyManagementOccupancy.date} >= ${startDate}`
            : undefined,
          endDate
            ? sql`${dailyManagementOccupancy.date} <= ${endDate}`
            : undefined
        )
      )
      .orderBy(
        dailyManagementOccupancy.facilityId,
        desc(sql`EXTRACT(YEAR FROM ${dailyManagementOccupancy.date})`),
        desc(sql`EXTRACT(MONTH FROM ${dailyManagementOccupancy.date})`)
      );

    const results = await query;

    return results.map(
      (row: RawMonthlyOccupancyResult): MonthlyOccupancyData => ({
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
      })
    );
  } catch (error) {
    console.error("Error fetching monthly occupancy data:", error);
    throw new Error("Failed to fetch monthly occupancy data");
  }
}

/**
 * Get monthly occupancy data for a specific facility
 *
 * @param facilityId - The facility ID to get data for
 * @param startDate - Optional start date (YYYY-MM-DD format)
 * @param endDate - Optional end date (YYYY-MM-DD format)
 * @returns Array of monthly occupancy data for the specified facility
 */
export async function getMonthlyOccupancyByFacility(
  facilityId: string,
  startDate?: string,
  endDate?: string
): Promise<MonthlyOccupancyData[]> {
  return getMonthlyOccupancy([facilityId], startDate, endDate);
}

/**
 * Get the most recent monthly occupancy data for all facilities
 *
 * @param facilityIds - Optional array of facility IDs to filter by
 * @returns Array of the most recent monthly occupancy data for each facility
 */
export async function getLatestMonthlyOccupancy(
  facilityIds?: string[]
): Promise<MonthlyOccupancyData[]> {
  try {
    // Get the most recent month-end data for each facility
    let query = db
      .select({
        facilityId: dailyManagementOccupancy.facilityId,
        facilityName: storageFacilities.facilityName,
        facilityAbbreviation: storageFacilities.facilityAbbreviation,
        year: sql<number>`EXTRACT(YEAR FROM ${dailyManagementOccupancy.date})`.as(
          "year"
        ),
        month:
          sql<number>`EXTRACT(MONTH FROM ${dailyManagementOccupancy.date})`.as(
            "month"
          ),
        yearMonth:
          sql<string>`TO_CHAR(${dailyManagementOccupancy.date}, 'YYYY-MM')`.as(
            "yearMonth"
          ),
        lastDayOfMonth: sql<string>`${dailyManagementOccupancy.date}::text`.as(
          "lastDayOfMonth"
        ),
        unitOccupancy: dailyManagementOccupancy.unitOccupancy,
        financialOccupancy: dailyManagementOccupancy.financialOccupancy,
        squareFootageOccupancy: dailyManagementOccupancy.squareFootageOccupancy,
      })
      .from(dailyManagementOccupancy)
      .innerJoin(
        storageFacilities,
        eq(dailyManagementOccupancy.facilityId, storageFacilities.sitelinkId)
      )
      .where(
        and(
          // Get the most recent month-end date for each facility
          sql`${dailyManagementOccupancy.date} = (
            SELECT MAX(dmo2.date) 
            FROM daily_management_occupancy dmo2 
            WHERE dmo2.facility_id = ${dailyManagementOccupancy.facilityId}
            AND dmo2.date = (
              SELECT MAX(date) 
              FROM daily_management_occupancy dmo3 
              WHERE dmo3.facility_id = dmo2.facility_id
              AND EXTRACT(YEAR FROM dmo3.date) = EXTRACT(YEAR FROM dmo2.date)
              AND EXTRACT(MONTH FROM dmo3.date) = EXTRACT(MONTH FROM dmo2.date)
            )
          )`,
          // Apply facility filter if provided
          facilityIds && facilityIds.length > 0
            ? sql`${dailyManagementOccupancy.facilityId} = ANY(${facilityIds})`
            : undefined
        )
      )
      .orderBy(dailyManagementOccupancy.facilityId);

    const results = await query;

    return results.map(
      (row: RawMonthlyOccupancyResult): MonthlyOccupancyData => ({
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
      })
    );
  } catch (error) {
    console.error("Error fetching latest monthly occupancy data:", error);
    throw new Error("Failed to fetch latest monthly occupancy data");
  }
}

/**
 * Get monthly occupancy trends for a specific facility over time
 *
 * @param facilityId - The facility ID to get trends for
 * @param monthsBack - Number of months back to include (default: 12)
 * @returns Array of monthly occupancy data showing trends over time
 */
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
