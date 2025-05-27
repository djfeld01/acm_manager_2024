import { db } from "@/db";
import {
  dailyManagementActivity,
  dailyManagementOccupancy,
  dailyManagementPaymentReceipt,
  dailyManagementReceivable,
  dailyManagementSundries,
} from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { interval } from "drizzle-orm/pg-core";
import { NextRequest, NextResponse } from "next/server";

export type SitelinkManagementDailyOccupancy = {
  facilityId: string;
  date: string;
  unitOccupancy: number;
  occupiedVariance: number;
  financialOccupancy: number;
  rentPotential: number;
  rentActual: number;
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
export type SitelinkManagementDailyReceivable = {
  facilityId: string;
  date: string;
  period: string;
  delinquentTotal: number;
  delinquentUnits: number;
}[];
export type SitelinkManagementDailyActivity = {
  facilityId: string;
  date: string;
  sortId: number;
  activityType: string;
  dailyTotal: number;
  monthlyTotal: number;
  yearlyTotal: number;
}[];
export type SitelinkManagementPaymentReceipt = {
  facilityId: string;
  date: string;
  sortId: number;
  description: string;
  dailyAmount: number;
  monthlyAmount: number;
  yearlyAmount: number;
}[];

export type SitelinkManagementDailySundries = {
  facilityId: string;
  date: string;
  sortId: number;
  sundryType: string;
  dailyTotal: number;
  monthlyTotal: number;
  yearlyTotal: number;
}[];

export type BodyType = {
  occupancy: SitelinkManagementDailyOccupancy;
  receivable: SitelinkManagementDailyReceivable;
  activity: SitelinkManagementDailyActivity;
  paymentReceipt: SitelinkManagementPaymentReceipt;
  sundries: SitelinkManagementDailySundries;
};

function getDayRange(period: string) {
  switch (period) {
    case "0-10":
      return { lowerDayRange: 0, upperDayRange: 10 };
    case "11-30":
      return { lowerDayRange: 11, upperDayRange: 30 };
    case "31-60":
      return { lowerDayRange: 31, upperDayRange: 60 };
    case "61-90":
      return { lowerDayRange: 61, upperDayRange: 90 };
    case "91-120":
      return { lowerDayRange: 91, upperDayRange: 120 };
    case "121-180":
      return { lowerDayRange: 121, upperDayRange: 180 };
    case "181-360":
      return { lowerDayRange: 181, upperDayRange: 360 };
    case ">360":
      return { lowerDayRange: 361, upperDayRange: 1000 };
    default:
      return { lowerDayRange: 10000, upperDayRange: 10000 };
  }
}

export async function POST(req: NextRequest) {
  const body: BodyType = await req.json();
  const { occupancy, receivable, activity, paymentReceipt, sundries } = body;

  const occupancyToInsert = occupancy.map((facilityOccupancy) => {
    return {
      facilityId: facilityOccupancy.facilityId,
      date: facilityOccupancy.date,
      unitOccupancy: facilityOccupancy.unitOccupancy / 100,
      squareFootageOccupancy: facilityOccupancy.squareFootageOccupancy / 100,
      financialOccupancy: facilityOccupancy.financialOccupancy / 100,
      occupiedVariance: facilityOccupancy.occupiedVariance,
      rentPotential: facilityOccupancy.rentPotential,
      rentActual: facilityOccupancy.rentActual,
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

  const receivableToInsert = receivable.map((facilityReceivable) => {
    const { lowerDayRange, upperDayRange } = getDayRange(
      facilityReceivable.period
    );

    return {
      facilityId: facilityReceivable.facilityId,
      date: facilityReceivable.date,
      lowerDayRange,
      upperDayRange,
      delinquentTotal: facilityReceivable.delinquentTotal,
      delinquentUnits: facilityReceivable.delinquentUnits,
      dateCreated: new Date(),
      dateUpdated: new Date(),
    };
  });

  const activityToInsert = activity.map((facilityActivity) => {
    return {
      facilityId: facilityActivity.facilityId,
      date: facilityActivity.date,
      activityType: facilityActivity.activityType,
      dailyTotal: facilityActivity.dailyTotal,
      monthlyTotal: facilityActivity.monthlyTotal,
      yearlyTotal: facilityActivity.yearlyTotal,
      sortId: facilityActivity.sortId,
      dateCreated: new Date(),
      dateUpdated: new Date(),
    };
  });

  const sundriesToInsert = sundries.map((facilitySundries) => {
    return {
      facilityId: facilitySundries.facilityId,
      date: facilitySundries.date,
      sundryType: facilitySundries.sundryType,
      dailyTotal: facilitySundries.dailyTotal,
      monthlyTotal: facilitySundries.monthlyTotal,
      yearlyTotal: facilitySundries.yearlyTotal,
      sortId: facilitySundries.sortId,
      dateCreated: new Date(),
      dateUpdated: new Date(),
    };
  });

  const paymentReceiptToInsert = paymentReceipt.map((paymentReceipt) => {
    return {
      facilityId: paymentReceipt.facilityId,
      date: paymentReceipt.date,
      description: paymentReceipt.description,
      dailyAmount: paymentReceipt.dailyAmount,
      monthlyAmount: paymentReceipt.monthlyAmount,
      yearlyAmount: paymentReceipt.yearlyAmount,
      sortId: paymentReceipt.sortId,
      dateCreated: new Date(),
      dateUpdated: new Date(),
    };
  });

  await db
    .insert(dailyManagementPaymentReceipt)
    .values(paymentReceiptToInsert)
    .onConflictDoUpdate({
      target: [
        dailyManagementPaymentReceipt.facilityId,
        dailyManagementPaymentReceipt.date,
        dailyManagementPaymentReceipt.description,
      ],
      set: {
        dailyAmount: sql.raw(`excluded.daily_amount`),
        monthlyAmount: sql.raw(`excluded.monthly_amount`),
        yearlyAmount: sql.raw(`excluded.yearly_amount`),
        sortId: sql.raw(`excluded.sort_id`),
        dateUpdated: new Date(),
      },
    });
  await db
    .insert(dailyManagementActivity)
    .values(activityToInsert)
    .onConflictDoUpdate({
      target: [
        dailyManagementActivity.facilityId,
        dailyManagementActivity.date,
        dailyManagementActivity.activityType,
      ],
      set: {
        dailyTotal: sql.raw(`excluded.daily_total`),
        monthlyTotal: sql.raw(`excluded.monthly_total`),
        yearlyTotal: sql.raw(`excluded.yearly_total`),
        sortId: sql.raw(`excluded.sort_id`),
        dateUpdated: new Date(),
      },
    });

  await db
    .insert(dailyManagementSundries)
    .values(sundriesToInsert)
    .onConflictDoUpdate({
      target: [
        dailyManagementSundries.facilityId,
        dailyManagementSundries.date,
        dailyManagementSundries.sundryType,
      ],
      set: {
        dailyTotal: sql.raw(`excluded.daily_total`),
        monthlyTotal: sql.raw(`excluded.monthly_total`),
        yearlyTotal: sql.raw(`excluded.yearly_total`),
        sortId: sql.raw(`excluded.sort_id`),
        dateUpdated: new Date(),
      },
    });
  await db
    .insert(dailyManagementReceivable)
    .values(receivableToInsert)
    .onConflictDoUpdate({
      target: [
        dailyManagementReceivable.facilityId,
        dailyManagementReceivable.date,
        dailyManagementReceivable.lowerDayRange,
        dailyManagementReceivable.upperDayRange,
      ],
      set: {
        delinquentTotal: sql.raw(`excluded.delinquent_total`),
        delinquentUnits: sql.raw(`excluded.delinquent_units`),
        dateUpdated: new Date(),
      },
    });
  //   const data = {
  //     ...body,
  //     date: body.date.toISOString(), // Convert Date to string
  //   };
  await db
    .insert(dailyManagementOccupancy)
    .values(occupancyToInsert)
    .onConflictDoUpdate({
      target: [
        dailyManagementOccupancy.facilityId,
        dailyManagementOccupancy.date,
      ], // composite target
      set: {
        // Update all the numeric fields using excluded
        unitOccupancy: sql.raw(`excluded.unit_occupancy`),
        financialOccupancy: sql.raw(`excluded.financial_occupancy`),
        occupiedVariance: sql.raw(`excluded.occupied_variance`),
        rentPotential: sql.raw(`excluded.rent_potential`),
        rentActual: sql.raw(`excluded.rent_actual`),
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
    financial_occupancy,
    square_footage_occupancy,
    unit_occupancy,
    date_updated
FROM daily_management_occupancy
ORDER BY facility_id, date_trunc('month', date), date DESC;`);
  return NextResponse.json({ response });
}
