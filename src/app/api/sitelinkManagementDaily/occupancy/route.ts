import { db } from "@/db";
import { dailyManagementOccupancy } from "@/db/schema";
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
      unitOccupancy: facilityOccupancy.unitOccupancy / 100,
      squareFootageOccupancy: facilityOccupancy.squareFootageOccupancy / 100,
      financialOccupancy: facilityOccupancy.financialOccupancy / 100,
      occupiedUnits: facilityOccupancy.occupiedUnits,
      vacantUnits: facilityOccupancy.vacantUnits,
      complimentaryUnits: facilityOccupancy.complimentaryUnits,
      unrentableUnits: facilityOccupancy.unrentableUnits,
      totalUnits: facilityOccupancy.totalUnits,
      occupiedSquareFootage: facilityOccupancy.occupiedSquareFootage,
      vacantSquareFootage: facilityOccupancy.vacantSquareFootage,
      complimentarySquareFootage: facilityOccupancy.complimentarySquareFootage,
      unrentableSquareFootage: facilityOccupancy.unrentableSquareFootage,
      totalSquareFootage: facilityOccupancy.totalSquareFootage,
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
