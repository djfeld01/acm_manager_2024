import { db } from "@/db";
import {
  dailyManagementActivity,
  dailyManagementOccupancy,
  storageFacilities,
} from "@/db/schema";
import { isSunday } from "date-fns";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const todayParam: string | null = req.nextUrl.searchParams.get("today");
  let today = new Date();

  if (todayParam) {
    const [year, month, day] = todayParam.split("-").map(Number);
    // month is 0-based in JS Date
    today = new Date(year, month - 1, day);
  }
  // Example: Fetch data or perform logic here
  const findSundayDate = new Date(today);
  const dayOfWeek = findSundayDate.getDay();
  const sunday = findSundayDate.getDate() - dayOfWeek;
  const sundayDate = new Date(findSundayDate.setDate(sunday));

  const result = await db.query.storageFacilities.findMany({
    where: eq(storageFacilities.currentClient, true),
    with: {
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
    const dailyRentals = facility.dailyManagementActivity[0]?.dailyTotal;
    const monthlyRentals = facility.dailyManagementActivity[1]?.monthlyTotal;
    const weeklyRentals =
      facility.dailyManagementActivity[0]?.yearlyTotal -
      facility.dailyManagementActivity[1]?.yearlyTotal;
    const monthlyMoveouts = facility.dailyManagementActivity[2]?.monthlyTotal;
    const financialOccupancy =
      facility.dailyManagementOccupancy[0]?.financialOccupancy;
    const unitOccupancy = facility.dailyManagementOccupancy[0]?.unitOccupancy;
    const squareFootageOccupancy =
      facility.dailyManagementOccupancy[0]?.squareFootageOccupancy;
    const monthlyNetRentals = monthlyRentals - monthlyMoveouts;

    return {
      abbreviatedName: facility.facilityAbbreviation,
      dailyRentals,
      monthlyRentals,
      weeklyRentals,
      monthlyMoveouts,
      financialOccupancy,
      unitOccupancy,
      squareFootageOccupancy,
      monthlyNetRentals,
    };
  });
  const arrayResponse = response.map((location) => [
    location.abbreviatedName,
    location.dailyRentals,
    location.monthlyRentals,
    location.weeklyRentals,
    location.monthlyMoveouts,
    location.financialOccupancy,
    location.unitOccupancy,
    location.squareFootageOccupancy,
    location.monthlyNetRentals,
  ]);
  arrayResponse.unshift([
    "Facility",
    "Daily Rentals",
    "Monthly Rentals",
    "Weekly Rentals",
    "Monthly Moveouts",
    "Financial Occupancy",
    "Unit Occupancy",
    "Square Footage Occupancy",
    "Monthly Net Rentals",
  ]);
  const data = {
    response,
    arrayResponse,
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

  return NextResponse.json(data);
}
