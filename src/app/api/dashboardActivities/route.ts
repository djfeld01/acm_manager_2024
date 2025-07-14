import { db } from "@/db";
import {
  dailyManagementActivity,
  dailyManagementOccupancy,
  storageFacilities,
} from "@/db/schema";
import { getDashboardData } from "@/lib/controllers/manSumController";
import { isSunday } from "date-fns";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { get } from "http";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const todayParam: string | null = req.nextUrl.searchParams.get("today");

  const { response, lastUpdated, monday, timestamp, today } =
    await getDashboardData(todayParam ?? undefined);
  const arrayResponse = response.map((location) => [
    location.abbreviatedName,
    location.dailyRentals,
    location.monthlyRentals,
    location.weeklyRentals,
    location.monthlyMoveouts,
    location.financialOccupancy,
    location.unitOccupancy,
    location.squareFootageOccupancy,
    location.occupiedUnits,
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
    "Occupied Units",
    "Monthly Net Rentals",
  ]);
  const data = {
    response,
    arrayResponse,
    lastUpdated,
    monday,
    timestamp,
    today,
  };

  return NextResponse.json(data);
}
