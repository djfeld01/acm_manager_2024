import {
  getMonthlyOccupancy,
  getMonthlyOccupancyByFacility,
} from "@/lib/controllers/dailyOccupancyController/getMonthlyOccupancy";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const startDateStr = searchParams.get("start");
    const endDateStr = searchParams.get("end");
    const source = searchParams.get("source") || undefined;

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const result = await getMonthlyOccupancy(
      undefined, // facilityIds - get all facilities
      startDate?.toISOString().split("T")[0], // startDate in YYYY-MM-DD format
      endDate?.toISOString().split("T")[0] // endDate in YYYY-MM-DD format
    );

    const arrayResult = result.map((row) => [
      `=TEXT(DATE(${row.yearMonth.split("-")[0]},${
        row.yearMonth.split("-")[1]
      },1),"YYYY-MM")`,
      row.facilityAbbreviation,
      row.facilityId,
      row.yearMonth,
      row.unitOccupancy ? (row.unitOccupancy * 100).toFixed(2) + "%" : "N/A",
      row.financialOccupancy
        ? (row.financialOccupancy * 100).toFixed(2) + "%"
        : "N/A",
      row.squareFootageOccupancy
        ? (row.squareFootageOccupancy * 100).toFixed(2) + "%"
        : "N/A",
    ]);
    arrayResult.unshift([
      "Formatted Date Formula",
      "Facility",
      "FacilityId",
      "Month",
      "Unit Occupancy",
      "Financial Occupancy",
      "Square Footage Occupancy",
    ]);
    return NextResponse.json({ arrayResult, result });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
