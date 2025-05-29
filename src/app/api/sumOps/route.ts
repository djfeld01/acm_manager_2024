import { db } from "@/db";
import {
  dailyManagementActivity,
  dailyManagementOccupancy,
  dailyManagementReceivable,
  dailyManagementSundries,
  storageFacilities,
} from "@/db/schema";
import { fail } from "assert";
import { isSunday } from "date-fns";
import { and, asc, between, desc, eq, or } from "drizzle-orm";
import { BetweenHorizonalStart } from "lucide-react";
import { NextRequest, NextResponse } from "next/server";

type FacilityData = {
  abbreviatedName: string;
  yearlyCalls: number | null;
  yearlyRentals: number | null;
  yearlyMoveouts: number | null;
  rangeCalls: number | null;
  rangeRentals: number | null;
  rangeMoveouts: number | null;
  receivablesZeroToThirty: number | null;
  receivableThirtyToSixty: number | null;
  receivableSixtyToNinety: number | null;
  receivableNinetyToOneTwenty: number | null;
  receivableOneTwentyPlus: number | null;
  rentPotential: number | null;
  rentActual: number | null;
  occupiedVariance: number | null;
  totalUnits: number | null;
  occupiedUnits: number | null;
  unitOccupancy: number | null;
  squareFootPotential: number | null;
  squareFootActual: number | null;
  squareFootageOccupancy: number | null;
};

function pivotFacilitiesData(
  facilitiesData: FacilityData[]
): (string | number)[][] {
  if (facilitiesData.length === 0) return [];

  const metrics = Object.keys(facilitiesData[0]).filter(
    (key): key is keyof Omit<FacilityData, "abbreviatedName"> =>
      key !== "abbreviatedName"
  );

  const headerRow: (string | number)[] = [
    "Metric",
    ...facilitiesData.map((f) => f.abbreviatedName),
  ];

  const rows: (string | number)[][] = metrics.map((metric) => {
    return [metric, ...facilitiesData.map((f) => f[metric] ?? "")];
  });

  return [headerRow, ...rows];
}
export async function GET(req: NextRequest) {
  const startDateParam: string | null =
    req.nextUrl.searchParams.get("startDate");
  const endDateParam: string | null = req.nextUrl.searchParams.get("endDate");

  let startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // Default to 7 days ago
  if (startDateParam) {
    const [year, month, day] = startDateParam.split("-").map(Number);
    startDate = new Date(year, month - 1, day - 1);
  }

  let endDate = new Date();

  if (endDateParam) {
    const [year, month, day] = endDateParam.split("-").map(Number);
    // month is 0-based in JS Date
    endDate = new Date(year, month - 1, day);
  }

  const result = await db.query.storageFacilities.findMany({
    where: eq(storageFacilities.currentClient, true),
    with: {
      dailyManagementActivity: {
        where: and(
          or(
            eq(dailyManagementActivity.date, startDate.toDateString()),
            eq(dailyManagementActivity.date, endDate.toDateString())
          ),
          or(
            eq(dailyManagementActivity.activityType, "Move-Outs"),
            eq(dailyManagementActivity.activityType, "Move-Ins"),
            eq(dailyManagementActivity.activityType, "Phone Leads")
          )
        ),
        orderBy: [
          asc(dailyManagementActivity.activityType),
          desc(dailyManagementActivity.date),
        ],
      },
      dailyManagementOccupancy: {
        where: eq(dailyManagementOccupancy.date, endDate.toDateString()),
      },
      dailyManagementReceivable: {
        where: eq(dailyManagementReceivable.date, endDate.toDateString()),
      },
      dailyManagementSundries: {
        where: and(
          eq(dailyManagementSundries.date, endDate.toDateString()),
          eq(dailyManagementSundries.sundryType, "Merchandise")
        ),
      },
    },
  });

  const response = result.map((facility) => {
    const yearlyRentals = facility.dailyManagementActivity[0]?.yearlyTotal;
    const yearlyCalls = facility.dailyManagementActivity[4]?.yearlyTotal;
    const yearlyMoveouts = facility.dailyManagementActivity[2]?.yearlyTotal;
    const rangeRentals =
      facility.dailyManagementActivity[0]?.yearlyTotal -
      facility.dailyManagementActivity[1]?.yearlyTotal;
    const rangeMoveouts =
      facility.dailyManagementActivity[2]?.yearlyTotal -
      facility.dailyManagementActivity[3]?.yearlyTotal;
    const rangeCalls =
      facility.dailyManagementActivity[4]?.yearlyTotal -
      facility.dailyManagementActivity[5]?.yearlyTotal;
    const receivablesZeroToThirty =
      facility.dailyManagementReceivable[0]?.delinquentTotal +
      facility.dailyManagementReceivable[1]?.delinquentTotal;
    const receivableThirtyToSixty =
      facility.dailyManagementReceivable[2]?.delinquentTotal;
    const receivableSixtyToNinety =
      facility.dailyManagementReceivable[3]?.delinquentTotal;
    const receivableNinetyToOneTwenty =
      facility.dailyManagementReceivable[4]?.delinquentTotal;
    const receivableOneTwentyPlus =
      facility.dailyManagementReceivable[5]?.delinquentTotal +
      facility.dailyManagementReceivable[6]?.delinquentTotal +
      facility.dailyManagementReceivable[7]?.delinquentTotal;

    const rentPotential = facility.dailyManagementOccupancy[0]?.rentPotential;
    const rentActual = facility.dailyManagementOccupancy[0]?.rentActual;
    const occupiedVariance =
      facility.dailyManagementOccupancy[0]?.occupiedVariance;
    const totalUnits = facility.dailyManagementOccupancy[0]?.totalUnits;
    const occupiedUnits = facility.dailyManagementOccupancy[0]?.occupiedUnits;
    const squareFootPotential =
      facility.dailyManagementOccupancy[0]?.totalSquareFootage;
    const squareFootActual =
      facility.dailyManagementOccupancy[0]?.occupiedSquareFootage;
    const unitOccupancy = facility.dailyManagementOccupancy[0]?.unitOccupancy;
    const squareFootageOccupancy =
      facility.dailyManagementOccupancy[0]?.squareFootageOccupancy;

    return {
      abbreviatedName: facility.facilityAbbreviation,
      yearlyCalls,
      yearlyRentals,
      yearlyMoveouts,
      rangeCalls,
      rangeRentals,
      rangeMoveouts,
      receivablesZeroToThirty,
      receivableThirtyToSixty,
      receivableSixtyToNinety,
      receivableNinetyToOneTwenty,
      receivableOneTwentyPlus,
      rentPotential,
      rentActual,
      occupiedVariance,
      totalUnits,
      occupiedUnits,
      unitOccupancy,
      squareFootPotential,
      squareFootActual,
      squareFootageOccupancy,
    };
  });
  // const arrayResponse = response.map((location) => [
  //   location.abbreviatedName,
  //   location.yearlyRentals,
  //   location.monthlyRentals,
  //   location.rangeRentals,
  //   location.monthlyMoveouts,
  //   location.financialOccupancy,
  //   location.unitOccupancy,
  //   location.squareFootageOccupancy,
  // ]);
  // arrayResponse.unshift([
  //   "Facility",
  //   "Yearly Rentals",
  //   "Monthly Rentals",
  //   "Range Rentals",
  //   "Monthly Moveouts",
  //   "Financial Occupancy",
  //   "Unit Occupancy",
  //   "Square Footage Occupancy",
  // ]);
  const arrayResponse = pivotFacilitiesData(response);
  const data = {
    message: "GET route is working!",
    result,
    response,
    arrayResponse,
    timestamp: new Date().toISOString(),
    startDate: startDate.toDateString(),
    endDate: endDate.toDateString(),
  };

  return NextResponse.json(data);
}
