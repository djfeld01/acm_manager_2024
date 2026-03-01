"use server";
import { db } from "@/db";
import { storageFacilities, dailyManagementPaymentReceipt } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type AvailableMonth = {
  lastDay: string;
};

export type FacilityFeeRow = {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  total: number;
  salesTax: number;
};

export async function getAvailableMonths(): Promise<AvailableMonth[]> {
  const rows = await db
    .select({
      lastDay: sql<string>`MAX(${dailyManagementPaymentReceipt.date})`,
    })
    .from(dailyManagementPaymentReceipt)
    .groupBy(
      sql`DATE_TRUNC('month', ${dailyManagementPaymentReceipt.date}::date)`
    )
    .orderBy(sql`MAX(${dailyManagementPaymentReceipt.date}) DESC`);

  return rows;
}

export async function getManagementFeesData(
  lastDayOfMonth: string
): Promise<FacilityFeeRow[]> {
  const rows = await db
    .select({
      sitelinkId: storageFacilities.sitelinkId,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      total: sql<number>`COALESCE(SUM(${dailyManagementPaymentReceipt.monthlyAmount}), 0)`,
      salesTax: sql<number>`COALESCE(SUM(CASE WHEN ${dailyManagementPaymentReceipt.description} IN ('Tax 1', 'Tax 2') THEN ${dailyManagementPaymentReceipt.monthlyAmount} ELSE 0 END), 0)`,
    })
    .from(storageFacilities)
    .leftJoin(
      dailyManagementPaymentReceipt,
      and(
        eq(dailyManagementPaymentReceipt.facilityId, storageFacilities.sitelinkId),
        eq(dailyManagementPaymentReceipt.date, lastDayOfMonth)
      )
    )
    .where(
      and(
        eq(storageFacilities.currentClient, true),
        eq(storageFacilities.isCorporate, false)
      )
    )
    .groupBy(
      storageFacilities.sitelinkId,
      storageFacilities.facilityName,
      storageFacilities.facilityAbbreviation
    )
    .orderBy(storageFacilities.facilityName);

  return rows;
}
