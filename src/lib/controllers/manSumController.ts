import { db } from "@/db";
import {
  dailyManagementActivity,
  dailyManagementOccupancy,
  monthlyGoals,
  storageFacilities,
} from "@/db/schema";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";

export async function getDashboardData(todayParam?: string) {
  let today = new Date();
  if (todayParam) {
    const [year, month, day] = todayParam.split("-").map(Number);
    today = new Date(year, month - 1, day);
  }
  const findSundayDate = new Date(today);
  const dayOfWeek = findSundayDate.getDay();
  const sunday = findSundayDate.getDate() - dayOfWeek;
  const sundayDate = new Date(findSundayDate.setDate(sunday));
  const firstOfTheMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  console.log("firstOfTheMonth", firstOfTheMonth);

  const result = await db.query.storageFacilities.findMany({
    where: eq(storageFacilities.currentClient, true),
    with: {
      monthlyGoals: {
        where: eq(monthlyGoals.month, firstOfTheMonth),
      },
      dailyManagementActivity: {
        where: and(
          or(
            eq(dailyManagementActivity.date, today.toDateString()),
            eq(dailyManagementActivity.date, sundayDate.toDateString())
          ),
          or(
            eq(dailyManagementActivity.activityType, "Move-Outs"),
            eq(dailyManagementActivity.activityType, "Move-Ins")
          )
        ),
        orderBy: [
          asc(dailyManagementActivity.activityType),
          desc(dailyManagementActivity.date),
        ],
      },
      dailyManagementOccupancy: {
        where: eq(dailyManagementOccupancy.date, today.toDateString()),
      },
    },
    orderBy: asc(storageFacilities.sitelinkSiteCode),
  });

  const response = result.map((facility) => {
    const rentalGoal = facility.monthlyGoals[0]?.rentalGoal || 0;
    const dailyRentals = facility.dailyManagementActivity[0]?.dailyTotal;
    const monthlyRentals = facility.dailyManagementActivity[0]?.monthlyTotal;
    const weeklyRentals =
      facility.dailyManagementActivity.length === 2
        ? facility.dailyManagementActivity[0].dailyTotal
        : facility.dailyManagementActivity[0]?.yearlyTotal -
          facility.dailyManagementActivity[1]?.yearlyTotal;
    const monthlyMoveouts =
      facility.dailyManagementActivity.length === 2
        ? facility.dailyManagementActivity[1]?.monthlyTotal
        : facility.dailyManagementActivity[2]?.monthlyTotal;
    const financialOccupancy =
      facility.dailyManagementOccupancy[0]?.financialOccupancy;
    const unitOccupancy = facility.dailyManagementOccupancy[0]?.unitOccupancy;
    const squareFootageOccupancy =
      facility.dailyManagementOccupancy[0]?.squareFootageOccupancy;
    const monthlyNetRentals = monthlyRentals - monthlyMoveouts;
    const occupiedUnits =
      facility.dailyManagementOccupancy[0]?.occupiedUnits || 0;

    return {
      sitelinkId: facility.sitelinkId,
      facilityName: facility.facilityName,
      abbreviatedName: facility.facilityAbbreviation,
      rentalGoal,
      dailyRentals,
      monthlyRentals,
      weeklyRentals,
      monthlyMoveouts,
      financialOccupancy,
      unitOccupancy,
      squareFootageOccupancy,
      monthlyNetRentals,
      occupiedUnits,
    };
  });
  return {
    response,
    lastUpdated:
      `${result[0].dailyManagementActivity[0]?.dateUpdated?.toLocaleDateString(
        "en-US",
        { timeZone: "America/New_York" }
      )} ${result[0].dailyManagementActivity[0]?.dateUpdated?.toLocaleTimeString(
        "en-US",
        { timeZone: "America/New_York" }
      )}` || "No data available",
    timestamp: new Date().toISOString(),
    today: today.toDateString(),
    monday: sundayDate.toDateString(),
  };
}
