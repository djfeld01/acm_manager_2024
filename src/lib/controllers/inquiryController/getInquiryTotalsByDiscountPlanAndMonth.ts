"use server";

import { db } from "@/db";
import { inquiry, storageFacilities } from "@/db/schema";
import { count, eq, and, gte, lte, isNotNull, sql } from "drizzle-orm";

export async function getInquiryTotalsByDiscountPlanAndMonth({
  startDate,
  endDate,
  discountPlanNameFilter,
}: {
  startDate?: Date;
  endDate?: Date;
  discountPlanNameFilter?: string;
}) {
  const inquiriesByMonth = db
    .select({
      sitelinkId: inquiry.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      discountPlanName: inquiry.discountPlanName,
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
        discountPlanNameFilter
          ? eq(inquiry.discountPlanName, discountPlanNameFilter)
          : undefined
      )
    )
    .groupBy(
      inquiry.sitelinkId,
      storageFacilities.facilityAbbreviation,
      inquiry.discountPlanName,
      sql`TO_CHAR(${inquiry.datePlaced}, 'YYYY-MM')`
    )
    .as("inquiriesByMonth");

  const leasesByMonth = db
    .select({
      sitelinkId: inquiry.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      discountPlanName: inquiry.discountPlanName,
      leasedMonth: sql<string>`TO_CHAR(${inquiry.leaseDate}, 'YYYY-MM')`.as(
        "leasedMonth"
      ),
      leasesSigned: count().as("leasesSigned"),
      // FIXED: Extract days from interval then round
      avgDaysToLease:
        sql<number>`ROUND(AVG(EXTRACT(DAY FROM (${inquiry.leaseDate} - ${inquiry.datePlaced}))), 1)`.as(
          "avgDaysToLease"
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
        discountPlanNameFilter
          ? eq(inquiry.discountPlanName, discountPlanNameFilter)
          : undefined
      )
    )
    .groupBy(
      storageFacilities.facilityAbbreviation,
      inquiry.sitelinkId,
      inquiry.discountPlanName,
      sql`TO_CHAR(${inquiry.leaseDate}, 'YYYY-MM')`
    )
    .as("leasesByMonth");

  const cancellationsByMonth = db
    .select({
      sitelinkId: inquiry.sitelinkId,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      discountPlanName: inquiry.discountPlanName,
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
        discountPlanNameFilter
          ? eq(inquiry.discountPlanName, discountPlanNameFilter)
          : undefined
      )
    )
    .groupBy(
      inquiry.sitelinkId,
      storageFacilities.facilityAbbreviation,
      inquiry.discountPlanName,
      sql`TO_CHAR(${inquiry.cancelDate}, 'YYYY-MM')`
    )
    .as("cancellationsByMonth");

  const result = await db
    .select({
      sitelinkId: sql<string>`COALESCE(${inquiriesByMonth.sitelinkId}, ${leasesByMonth.sitelinkId}, ${cancellationsByMonth.sitelinkId})`,
      discountPlanName: sql<string>`COALESCE(${inquiriesByMonth.discountPlanName}, ${leasesByMonth.discountPlanName}, ${cancellationsByMonth.discountPlanName})`,
      facilityAbbreviation: sql<string>`COALESCE(${inquiriesByMonth.facilityAbbreviation}, ${leasesByMonth.facilityAbbreviation}, ${cancellationsByMonth.facilityAbbreviation})`,
      monthKey:
        sql<string>`COALESCE(${inquiriesByMonth.placedMonth}, ${leasesByMonth.leasedMonth}, ${cancellationsByMonth.cancelledMonth})`.as(
          "monthKey"
        ),
      inquiriesPlaced: inquiriesByMonth.inquiriesPlaced,
      leasesSigned: leasesByMonth.leasesSigned,
      cancellations: cancellationsByMonth.cancellations,
      avgDaysToLease: leasesByMonth.avgDaysToLease, // NEW: Average days to conversion
      // NEW: Conversion rate percentage calculation
      conversionRate: sql<number>`
        CASE 
          WHEN ${inquiriesByMonth.inquiriesPlaced} > 0 
          THEN ROUND((${leasesByMonth.leasesSigned}::decimal / ${inquiriesByMonth.inquiriesPlaced}::decimal) * 100, 1)
          ELSE NULL 
        END
      `.as("conversionRate"),
    })
    .from(inquiriesByMonth)
    .fullJoin(
      leasesByMonth,
      and(
        eq(inquiriesByMonth.sitelinkId, leasesByMonth.sitelinkId),
        eq(inquiriesByMonth.discountPlanName, leasesByMonth.discountPlanName),
        eq(inquiriesByMonth.placedMonth, leasesByMonth.leasedMonth)
      )
    )
    .fullJoin(
      cancellationsByMonth,
      and(
        eq(inquiriesByMonth.sitelinkId, cancellationsByMonth.sitelinkId),
        eq(
          inquiriesByMonth.discountPlanName,
          cancellationsByMonth.discountPlanName
        ),
        eq(inquiriesByMonth.placedMonth, cancellationsByMonth.cancelledMonth)
      )
    )
    .orderBy(
      sql`COALESCE(${inquiriesByMonth.placedMonth}, ${leasesByMonth.leasedMonth})`,
      sql`COALESCE(${inquiriesByMonth.sitelinkId}, ${leasesByMonth.sitelinkId})`
    );

  // NEW: Console log to see the enhanced data
  console.log("Enhanced Inquiry Data with Conversion Metrics:");
  console.log("=".repeat(60));

  // Show summary stats
  const totalInquiries = result.reduce(
    (sum, row) => sum + (row.inquiriesPlaced || 0),
    0
  );
  const totalLeases = result.reduce(
    (sum, row) => sum + (row.leasesSigned || 0),
    0
  );
  const overallConversionRate =
    totalInquiries > 0 ? ((totalLeases / totalInquiries) * 100).toFixed(1) : 0;

  console.log(
    `Overall Stats: ${totalInquiries} inquiries → ${totalLeases} leases (${overallConversionRate}% conversion)`
  );
  console.log("");

  // Show sample records with new fields
  const sampleRecords = result
    .filter(
      (row) => row.leasesSigned && row.avgDaysToLease && row.conversionRate
    )
    .slice(0, 5);

  console.log("Sample records with new metrics:");
  sampleRecords.forEach((row) => {
    console.log(
      `${row.facilityAbbreviation} ${row.monthKey} (${row.discountPlanName}):`
    );
    console.log(
      `  📊 ${row.inquiriesPlaced} inquiries → ${row.leasesSigned} leases (${row.conversionRate}% conversion)`
    );
    console.log(`  ⏱️  Average ${row.avgDaysToLease} days to lease`);
    console.log("");
  });

  // Show conversion rate distribution
  const conversionRates = result
    .filter((row) => row.conversionRate !== null)
    .map((row) => row.conversionRate!)
    .sort((a, b) => b - a);

  if (conversionRates.length > 0) {
    console.log("Conversion Rate Distribution:");
    console.log(`  Best: ${conversionRates[0]}%`);
    console.log(`  Worst: ${conversionRates[conversionRates.length - 1]}%`);
    console.log(
      `  Average: ${(
        conversionRates.reduce((a, b) => a + b, 0) / conversionRates.length
      ).toFixed(1)}%`
    );
  }

  console.log("=".repeat(60));

  // NEW: Show exact shape of output data
  console.log("EXACT OUTPUT SHAPE:");
  console.log("=".repeat(40));

  if (result.length > 0) {
    // Show the structure of the first record
    const firstRecord = result[0];
    console.log("Sample Record Structure:");
    console.log(JSON.stringify(firstRecord, null, 2));
    console.log("");

    // Show all field names and their types
    console.log("All Fields and Types:");
    Object.entries(firstRecord).forEach(([key, value]) => {
      const type = value === null ? "null" : typeof value;
      const sample =
        value === null
          ? "null"
          : typeof value === "string"
          ? `"${value}"`
          : typeof value === "number"
          ? value
          : JSON.stringify(value);
      console.log(`  ${key}: ${type} (example: ${sample})`);
    });
    console.log("");

    // Show array structure for API response
    console.log("Array Structure (for API response):");
    console.log("Headers:");
    console.log([
      "Facility",
      "SitelinkId",
      "Month",
      "Discount Plan",
      "Inquiries",
      "Rentals",
      "Cancellations",
      "Avg Days to Lease",
      "Conversion Rate %",
    ]);
    console.log("");
    console.log("Sample Data Row:");
    const sampleRow = [
      firstRecord.facilityAbbreviation,
      firstRecord.sitelinkId,
      firstRecord.monthKey,
      firstRecord.discountPlanName,
      firstRecord.inquiriesPlaced || 0,
      firstRecord.leasesSigned || 0,
      firstRecord.cancellations || 0,
      firstRecord.avgDaysToLease || null,
      firstRecord.conversionRate || null,
    ];
    console.log(sampleRow);
    console.log("");

    // Show total record count and field completion
    console.log(`Total Records: ${result.length}`);
    console.log("Field Completion Stats:");
    console.log(
      `  inquiriesPlaced: ${result.filter((r) => r.inquiriesPlaced).length}/${
        result.length
      }`
    );
    console.log(
      `  leasesSigned: ${result.filter((r) => r.leasesSigned).length}/${
        result.length
      }`
    );
    console.log(
      `  cancellations: ${result.filter((r) => r.cancellations).length}/${
        result.length
      }`
    );
    console.log(
      `  avgDaysToLease: ${result.filter((r) => r.avgDaysToLease).length}/${
        result.length
      }`
    );
    console.log(
      `  conversionRate: ${result.filter((r) => r.conversionRate).length}/${
        result.length
      }`
    );
  } else {
    console.log("No records found in result set");
  }

  console.log("=".repeat(40));

  return result;
}
