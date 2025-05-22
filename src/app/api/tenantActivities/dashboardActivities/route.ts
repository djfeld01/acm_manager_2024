import { db } from "@/db";
import { dailyManagementActivity, dailyManagementOccupancy } from "@/db/schema";
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
  });

  const response = result.map((facility) => {
    const dailyRentals = facility.dailyManagementActivity[0]?.dailyTotal;
    const monthlyRentals = facility.dailyManagementActivity[0]?.monthlyTotal;
    const weeklyRentals =
      facility.dailyManagementActivity[0]?.yearlyTotal -
      facility.dailyManagementActivity[1]?.yearlyTotal;
    const monthlyMoveouts = facility.dailyManagementActivity[2]?.monthlyTotal;
    const financialOccupancy =
      facility.dailyManagementOccupancy[0]?.financialOccupancy;
    const unitOccupancy = facility.dailyManagementOccupancy[0]?.unitOccupancy;
    const squareFootageOccupancy =
      facility.dailyManagementOccupancy[0]?.squareFootageOccupancy;

    return {
      abbreviatedName: facility.facilityAbbreviation,
      dailyRentals,
      monthlyRentals,
      weeklyRentals,
      monthlyMoveouts,
      financialOccupancy,
      unitOccupancy,
      squareFootageOccupancy,
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
  ]);
  const data = {
    message: "GET route is working!",
    response,
    arrayResponse,
    timestamp: new Date().toISOString(),
    today: today.toDateString(),
    monday: sundayDate.toDateString(),
  };

  return NextResponse.json(data);
}
