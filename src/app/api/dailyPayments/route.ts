import { db } from "@/db";
import { dailyPayments } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { interval } from "drizzle-orm/pg-core";
import { NextRequest, NextResponse } from "next/server";

export type DailyPaymentType = {
  facilityId: string;
  date: string;
  cash: number;
  check: number;
  visa: number;
  mastercard: number;
  americanExpress: number;
  discover: number;
  ach: number;
  dinersClub: number;
}[];
export async function POST(req: NextRequest) {
  const body: DailyPaymentType = await req.json();

  const toInsert = body.map((dailyPayments) => {
    return {
      facilityId: dailyPayments.facilityId,
      date: dailyPayments.date,
      cash: dailyPayments.cash,
      check: dailyPayments.check,
      visa: dailyPayments.visa,
      mastercard: dailyPayments.mastercard,
      americanExpress: dailyPayments.americanExpress,
      discover: dailyPayments.discover,
      ach: dailyPayments.ach,
      dinersClub: dailyPayments.dinersClub,
    };
  });
  console.log("🚀 ~ toInsert ~ toInsert:", toInsert);

  //   const data = {
  //     ...body,
  //     date: body.date.toISOString(), // Convert Date to string
  //   };
  await db.insert(dailyPayments).values(toInsert).onConflictDoNothing();
  // .onConflictDoUpdate({
  //   target: [dailyPayments.facilityId, dailyPayments.date], // composite target
  //   set: {
  //     // Update all the numeric fields using excluded
  //     cash: sql.raw(`excluded.cash`),
  //     check: sql.raw(`excluded.check`),
  //     visa: sql.raw(`excluded.visa`),
  //     mastercard: sql.raw(`excluded.mastercard`),
  //     discover: sql.raw(`excluded.discover`),
  //     ach: sql.raw(`excluded.ach`),
  //     dinersClub: sql.raw(`excluded.diners_club`),
  //     americanExpress: sql.raw(`excluded.american_express`),

  //     // ... other fields
  //   },
  // });
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
