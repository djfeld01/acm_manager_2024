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

const GROUPS: Record<string, { label: string; keys: (keyof FacilityData)[] }> =
  {
    ytd: {
      label: "YTD Activities",
      keys: ["yearlyCalls", "yearlyRentals", "yearlyMoveouts"],
    },
    range: {
      label: "Range Activities",
      keys: ["rangeCalls", "rangeRentals", "rangeMoveouts"],
    },
    receivables: {
      label: "Receivables",
      keys: [
        "receivablesZeroToThirty",
        "receivableThirtyToSixty",
        "receivableSixtyToNinety",
        "receivableNinetyToOneTwenty",
        "receivableOneTwentyPlus",
      ],
    },
    rent: {
      label: "Rent",
      keys: ["rentPotential", "rentActual"],
    },
    variance: {
      label: "Variance",
      keys: ["occupiedVariance"],
    },
    units: {
      label: "Unit Occupancy",
      keys: ["totalUnits", "occupiedUnits", "unitOccupancy"],
    },
    sqft: {
      label: "Square Foot Occupancy",
      keys: [
        "squareFootPotential",
        "squareFootActual",
        "squareFootageOccupancy",
      ],
    },
  };

// Custom labels for display
const LABELS: Partial<Record<keyof FacilityData, string>> = {
  yearlyCalls: "Calls - YTD",
  yearlyRentals: "Rentals - YTD",
  yearlyMoveouts: "Moveouts - YTD",
  rangeCalls: "Calls - Range",
  rangeRentals: "Rentals - Range",
  rangeMoveouts: "Moveouts - Range",
  receivablesZeroToThirty: "0–30 Days",
  receivableThirtyToSixty: "31–60 Days",
  receivableSixtyToNinety: "61–90 Days",
  receivableNinetyToOneTwenty: "91–120 Days",
  receivableOneTwentyPlus: "120+ Days",
  rentPotential: "Rent - Potential",
  rentActual: "Rent - Actual",
  occupiedVariance: "Occupied Variance",
  totalUnits: "Total Units",
  occupiedUnits: "Occupied Units",
  unitOccupancy: "Unit Occupancy %",
  squareFootPotential: "SqFt - Potential",
  squareFootActual: "SqFt - Actual",
  squareFootageOccupancy: "SqFt Occupancy %",
};

function pivotFacilitiesData(
  facilitiesData: FacilityData[]
): (string | number)[][] {
  if (facilitiesData.length === 0) return [];

  const headerRow: (string | number)[] = [
    "Metric",
    ...facilitiesData.map((f) => f.abbreviatedName),
  ];

  const rows: (string | number)[][] = [];

  for (const group of Object.values(GROUPS)) {
    rows.push([group.label, ...new Array(facilitiesData.length).fill("")]);

    for (const key of group.keys) {
      const label = LABELS[key] ?? key;
      const row: (string | number)[] = [
        label,
        ...facilitiesData.map((f) => f[key] ?? ""),
      ];
      rows.push(row);
    }
  }

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
    orderBy: asc(storageFacilities.sitelinkSiteCode),
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
