"use server";

import { db } from "@/db";
import { inquiry, storageFacilities } from "@/db/schema";
import { count, eq, and, gte, lte, isNotNull, sql } from "drizzle-orm";

export async function getInquiryTotalsByInquiryTypeSourceAndMonth({
  startDate,
  endDate,
  inquiryTypeFilter,
  sourceFilter,
}: {
  startDate?: Date;
  endDate?: Date;
  inquiryTypeFilter?: string;
  sourceFilter?: string;
}) {
  const inquiriesByMonth = db
    .select({
      sitelinkId: inquiry.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      inquiryType: inquiry.inquiryType,
      source: inquiry.source,
      placedMonth: sql<string>`TO_CHAR(${inquiry.datePlaced}, 'YYYY-MM')`.as(
        "placedMonth"
      ),
      inquiriesPlaced: count().as("inquiriesPlaced"),
    })
    .from(inquiry)
    .innerJoin(
      storageFacilities,
      eq(inquiry.sitelinkId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        isNotNull(inquiry.datePlaced),
        startDate ? gte(inquiry.datePlaced, startDate) : undefined,
        endDate ? lte(inquiry.datePlaced, endDate) : undefined,
        inquiryTypeFilter
          ? eq(inquiry.inquiryType, inquiryTypeFilter)
          : undefined,
        sourceFilter ? eq(inquiry.source, sourceFilter) : undefined
      )
    )
    .groupBy(
      inquiry.sitelinkId,
      storageFacilities.facilityAbbreviation,
      inquiry.inquiryType,
      inquiry.source,
      sql`TO_CHAR(${inquiry.datePlaced}, 'YYYY-MM')`
    )
    .as("inquiriesByMonth");

  const leasesByMonth = db
    .select({
      sitelinkId: inquiry.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      inquiryType: inquiry.inquiryType,
      source: inquiry.source,
      leasedMonth: sql<string>`TO_CHAR(${inquiry.leaseDate}, 'YYYY-MM')`.as(
        "leasedMonth"
      ),
      leasesSigned: count().as("leasesSigned"),
    })
    .from(inquiry)
    .innerJoin(
      storageFacilities,
      eq(inquiry.sitelinkId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        isNotNull(inquiry.leaseDate),
        startDate ? gte(inquiry.leaseDate, startDate) : undefined,
        endDate ? lte(inquiry.leaseDate, endDate) : undefined,
        inquiryTypeFilter
          ? eq(inquiry.inquiryType, inquiryTypeFilter)
          : undefined,
        sourceFilter ? eq(inquiry.source, sourceFilter) : undefined
      )
    )
    .groupBy(
      inquiry.sitelinkId,
      storageFacilities.facilityAbbreviation,
      inquiry.inquiryType,
      inquiry.source,
      sql`TO_CHAR(${inquiry.leaseDate}, 'YYYY-MM')`
    )
    .as("leasesByMonth");

  // NEW: Track when inquiries were placed for leases signed in each month
  const inquirySourceByLeaseMonth = db
    .select({
      sitelinkId: inquiry.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      inquiryType: inquiry.inquiryType,
      source: inquiry.source,
      leasedMonth: sql<string>`TO_CHAR(${inquiry.leaseDate}, 'YYYY-MM')`.as(
        "leasedMonth"
      ),
      inquiryPlacedMonth:
        sql<string>`TO_CHAR(${inquiry.datePlaced}, 'YYYY-MM')`.as(
          "inquiryPlacedMonth"
        ),
      leaseCountFromThisInquiryMonth: count().as(
        "leaseCountFromThisInquiryMonth"
      ),
    })
    .from(inquiry)
    .innerJoin(
      storageFacilities,
      eq(inquiry.sitelinkId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        isNotNull(inquiry.leaseDate),
        isNotNull(inquiry.datePlaced),
        startDate ? gte(inquiry.leaseDate, startDate) : undefined,
        endDate ? lte(inquiry.leaseDate, endDate) : undefined,
        inquiryTypeFilter
          ? eq(inquiry.inquiryType, inquiryTypeFilter)
          : undefined,
        sourceFilter ? eq(inquiry.source, sourceFilter) : undefined
      )
    )
    .groupBy(
      inquiry.sitelinkId,
      storageFacilities.facilityAbbreviation,
      inquiry.inquiryType,
      inquiry.source,
      sql`TO_CHAR(${inquiry.leaseDate}, 'YYYY-MM')`,
      sql`TO_CHAR(${inquiry.datePlaced}, 'YYYY-MM')`
    )
    .as("inquirySourceByLeaseMonth");

  const cancellationsByMonth = db
    .select({
      sitelinkId: inquiry.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      inquiryType: inquiry.inquiryType,
      source: inquiry.source,
      cancelledMonth: sql<string>`TO_CHAR(${inquiry.cancelDate}, 'YYYY-MM')`.as(
        "cancelledMonth"
      ),
      cancellations: count().as("cancellations"),
    })
    .from(inquiry)
    .innerJoin(
      storageFacilities,
      eq(inquiry.sitelinkId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        isNotNull(inquiry.cancelDate),
        startDate ? gte(inquiry.cancelDate, startDate) : undefined,
        endDate ? lte(inquiry.cancelDate, endDate) : undefined,
        inquiryTypeFilter
          ? eq(inquiry.inquiryType, inquiryTypeFilter)
          : undefined,
        sourceFilter ? eq(inquiry.source, sourceFilter) : undefined
      )
    )
    .groupBy(
      inquiry.sitelinkId,
      storageFacilities.facilityAbbreviation,
      inquiry.inquiryType,
      inquiry.source,
      sql`TO_CHAR(${inquiry.cancelDate}, 'YYYY-MM')`
    )
    .as("cancellationsByMonth");

  const result = await db
    .select({
      sitelinkId: sql<string>`COALESCE(${inquiriesByMonth.sitelinkId}, ${leasesByMonth.sitelinkId}, ${cancellationsByMonth.sitelinkId})`,
      inquiryType: sql<string>`COALESCE(${inquiriesByMonth.inquiryType}, ${leasesByMonth.inquiryType}, ${cancellationsByMonth.inquiryType})`,
      source: sql<string>`COALESCE(${inquiriesByMonth.source}, ${leasesByMonth.source}, ${cancellationsByMonth.source})`,
      facilityAbbreviation: sql<string>`COALESCE(${inquiriesByMonth.facilityAbbreviation}, ${leasesByMonth.facilityAbbreviation}, ${cancellationsByMonth.facilityAbbreviation})`,
      monthKey:
        sql<string>`COALESCE(${inquiriesByMonth.placedMonth}, ${leasesByMonth.leasedMonth}, ${cancellationsByMonth.cancelledMonth})`.as(
          "monthKey"
        ),
      inquiriesPlaced: inquiriesByMonth.inquiriesPlaced,
      leasesSigned: leasesByMonth.leasesSigned,
      cancellations: cancellationsByMonth.cancellations,
    })
    .from(inquiriesByMonth)
    .fullJoin(
      leasesByMonth,
      and(
        eq(inquiriesByMonth.sitelinkId, leasesByMonth.sitelinkId),
        eq(inquiriesByMonth.inquiryType, leasesByMonth.inquiryType),
        eq(inquiriesByMonth.source, leasesByMonth.source),
        eq(inquiriesByMonth.placedMonth, leasesByMonth.leasedMonth)
      )
    )
    .fullJoin(
      cancellationsByMonth,
      and(
        eq(inquiriesByMonth.sitelinkId, cancellationsByMonth.sitelinkId),
        eq(inquiriesByMonth.inquiryType, cancellationsByMonth.inquiryType),
        eq(inquiriesByMonth.source, cancellationsByMonth.source),
        eq(inquiriesByMonth.placedMonth, cancellationsByMonth.cancelledMonth)
      )
    )
    .orderBy(
      sql`COALESCE(${inquiriesByMonth.placedMonth}, ${leasesByMonth.leasedMonth}, ${cancellationsByMonth.cancelledMonth})`,
      sql`COALESCE(${inquiriesByMonth.sitelinkId}, ${leasesByMonth.sitelinkId}, ${cancellationsByMonth.sitelinkId})`,
      sql`COALESCE(${inquiriesByMonth.inquiryType}, ${leasesByMonth.inquiryType}, ${cancellationsByMonth.inquiryType})`,
      sql`COALESCE(${inquiriesByMonth.source}, ${leasesByMonth.source}, ${cancellationsByMonth.source})`
    );

  // NEW: Get the inquiry source breakdown separately
  const inquirySourceBreakdown = await db
    .select({
      sitelinkId: inquirySourceByLeaseMonth.sitelinkId,
      facilityAbbreviation: inquirySourceByLeaseMonth.facilityAbbreviation,
      inquiryType: inquirySourceByLeaseMonth.inquiryType,
      source: inquirySourceByLeaseMonth.source,
      leasedMonth: inquirySourceByLeaseMonth.leasedMonth,
      inquiryPlacedMonth: inquirySourceByLeaseMonth.inquiryPlacedMonth,
      leaseCountFromThisInquiryMonth:
        inquirySourceByLeaseMonth.leaseCountFromThisInquiryMonth,
    })
    .from(inquirySourceByLeaseMonth)
    .orderBy(
      inquirySourceByLeaseMonth.leasedMonth,
      inquirySourceByLeaseMonth.sitelinkId,
      inquirySourceByLeaseMonth.inquiryType,
      inquirySourceByLeaseMonth.source,
      inquirySourceByLeaseMonth.inquiryPlacedMonth
    );

  console.log("Main Results:");
  console.log(result);
  console.log("\nInquiry Source Breakdown:");
  console.log(inquirySourceBreakdown);

  return {
    monthlyTotals: result,
    inquirySourceBreakdown: inquirySourceBreakdown,
  };
}
