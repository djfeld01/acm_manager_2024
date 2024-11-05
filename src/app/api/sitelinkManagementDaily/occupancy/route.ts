import { db } from "@/db";
import {
  dailyManagementOccupancy,
  sitelinkLogons,
  tenantActivities,
  userDetails,
  usersToFacilities,
} from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { interval } from "drizzle-orm/pg-core";
import { NextRequest, NextResponse } from "next/server";

export type SitelinkManagementDailyOccupancy = {
  facilityId: string;
  date: string;
  unitOccupancy: number;
  financialOccupancy: number;
  squareFootageOccupancy: number;
  occupiedUnits: number;
  vacantUnits: number;
  complimentaryUnits: number;
  unrentableUnits: number;
  totalUnits: number;
  occupiedSquareFootage: number;
  vacantSquareFootage: number;
  complimentarySquareFootage: number;
  unrentableSquareFootage: number;
  totalSquareFootage: number;
}[];
export async function POST(req: NextRequest) {
  const body: SitelinkManagementDailyOccupancy = await req.json();

  const toInsert = body.map((facilityOccupancy) => {
    return {
      facilityId: facilityOccupancy.facilityId,
      date: facilityOccupancy.date,
      unitOccupancy: String((facilityOccupancy.unitOccupancy / 100).toFixed(4)),
      squareFootageOccupancy: String(
        (facilityOccupancy.squareFootageOccupancy / 100).toFixed(4)
      ),
      financialOccupancy: String(
        (facilityOccupancy.financialOccupancy / 100).toFixed(4)
      ),
      occupiedUnits: String(facilityOccupancy.occupiedUnits),
      vacantUnits: String(facilityOccupancy.vacantUnits),
      complimentaryUnits: String(facilityOccupancy.complimentaryUnits),
      unrentableUnits: String(facilityOccupancy.unrentableUnits),
      totalUnits: String(facilityOccupancy.totalUnits),
      occupiedSquareFootage: String(facilityOccupancy.occupiedSquareFootage),
      vacantSquareFootage: String(facilityOccupancy.vacantSquareFootage),
      complimentarySquareFootage: String(
        facilityOccupancy.complimentarySquareFootage
      ),
      unrentableSquareFootage: String(
        facilityOccupancy.unrentableSquareFootage
      ),
      totalSquareFootage: String(facilityOccupancy.totalSquareFootage),
      dateCreated: new Date(),
      dateUpdated: new Date(),
    };
  });

  //   const data = {
  //     ...body,
  //     date: body.date.toISOString(), // Convert Date to string
  //   };
  await db
    .insert(dailyManagementOccupancy)
    .values(toInsert)
    .onConflictDoUpdate({
      target: [
        dailyManagementOccupancy.facilityId,
        dailyManagementOccupancy.date,
      ], // composite target
      set: {
        // Update all the numeric fields using excluded
        unitOccupancy: sql.raw(`excluded.unit_occupancy`),
        financialOccupancy: sql.raw(`excluded.financial_occupancy`),
        squareFootageOccupancy: sql.raw(`excluded.square_footage_occupancy`),
        occupiedUnits: sql.raw(`excluded.occupied_units`),
        vacantUnits: sql.raw(`excluded.vacant_units`),
        complimentaryUnits: sql.raw(`excluded.complimentary_units`),
        unrentableUnits: sql.raw(`excluded.unrentable_units`),
        totalUnits: sql.raw(`excluded.total_units`),
        occupiedSquareFootage: sql.raw(`excluded.occupied_square_footage`),
        vacantSquareFootage: sql.raw(`excluded.vacant_square_footage`),
        complimentarySquareFootage: sql.raw(
          `excluded.complimentary_square_footage`
        ),
        unrentableSquareFootage: sql.raw(`excluded.unrentable_square_footage`),
        totalSquareFootage: sql.raw(`excluded.total_square_footage`),
        dateUpdated: new Date(),

        // ... other fields
      },
    });
  return NextResponse.json({ body });
}

export async function GET(req: NextRequest) {
  // const response = await db.query.dailyManagementOccupancy.findMany({
  //   orderBy: [desc(dailyManagementOccupancy.date)],
  //   limit: 5,
  // });

  const response =
    await db.execute(sql`SELECT DISTINCT ON (facility_id, date_trunc('month', date)) 
    facility_id,
    date,
    unit_occupancy,
    date_updated
FROM daily_management_occupancy
ORDER BY facility_id, date_trunc('month', date), date DESC;`);
  return NextResponse.json({ response });
}
