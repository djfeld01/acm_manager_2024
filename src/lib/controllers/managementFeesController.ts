"use server";
import { db } from "@/db";
import { storageFacilities, dailyManagementPaymentReceipt } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export type AvailableMonth = {
  lastDay: string;
};

export type FacilityFeeRow = {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  total: number | null;
  salesTax: number | null;
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
  const totalReceipt = alias(dailyManagementPaymentReceipt, "total_receipt");
  const taxReceipt = alias(dailyManagementPaymentReceipt, "tax_receipt");

  const rows = await db
    .select({
      sitelinkId: storageFacilities.sitelinkId,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      total: totalReceipt.monthlyAmount,
      salesTax: taxReceipt.monthlyAmount,
    })
    .from(storageFacilities)
    .leftJoin(
      totalReceipt,
      and(
        eq(totalReceipt.facilityId, storageFacilities.sitelinkId),
        eq(totalReceipt.date, lastDayOfMonth),
        eq(totalReceipt.description, "Total")
      )
    )
    .leftJoin(
      taxReceipt,
      and(
        eq(taxReceipt.facilityId, storageFacilities.sitelinkId),
        eq(taxReceipt.date, lastDayOfMonth),
        eq(taxReceipt.description, "Sales Tax")
      )
    )
    .where(
      and(
        eq(storageFacilities.currentClient, true),
        eq(storageFacilities.isCorporate, false)
      )
    )
    .orderBy(storageFacilities.facilityName);

  return rows;
}
