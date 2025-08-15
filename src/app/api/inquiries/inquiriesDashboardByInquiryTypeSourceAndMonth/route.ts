import { getInquiryTotalsByInquiryTypeSourceAndMonth } from "@/lib/controllers/inquiryController/getInquiryTotalsByInquiryTypeSourceAndMonth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const startDateStr = searchParams.get("start");
    const endDateStr = searchParams.get("end");
    const inquiryTypeFilter = searchParams.get("inquiryType") || undefined;
    const sourceFilter = searchParams.get("source") || undefined;

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const result = await getInquiryTotalsByInquiryTypeSourceAndMonth({
      startDate,
      endDate,
      inquiryTypeFilter: inquiryTypeFilter,
      sourceFilter: sourceFilter,
    });

    const monthlyTotals = result.monthlyTotals;
    const inquirySourceBreakdown = result.inquirySourceBreakdown;

    const arrayResult = monthlyTotals.map((row) => [
      `=TEXT(DATE(${row.monthKey.split("-")[0]},${
        row.monthKey.split("-")[1]
      },1),"YYYY-MM")`,
      row.facilityAbbreviation,
      row.sitelinkId,
      row.inquiryType,
      row.source,
      row.inquiriesPlaced ? row.inquiriesPlaced : 0,
      row.leasesSigned ? row.leasesSigned : 0,
      row.cancellations ? row.cancellations : 0,
    ]);
    arrayResult.unshift([
      "Month",
      "Facility",
      "SitelinkId",
      "Inquiry Type",
      "Source",
      "Inquiries",
      "Rentals",
      "Cancellations",
    ]);

    const inquirySourceArray = inquirySourceBreakdown.map((row) => [
      `=TEXT(DATE(${row.leasedMonth.split("-")[0]},${
        row.leasedMonth.split("-")[1]
      },1),"YYYY-MM")`,
      row.facilityAbbreviation,
      row.sitelinkId,
      row.inquiryType,
      row.source,
      `=TEXT(DATE(${row.inquiryPlacedMonth.split("-")[0]},${
        row.inquiryPlacedMonth.split("-")[1]
      },1),"YYYY-MM")`,
      row.leaseCountFromThisInquiryMonth,
    ]);

    inquirySourceArray.unshift([
      "Leased Month",
      "Facility",
      "SitelinkId",
      "Inquiry Type",
      "Source",
      "Inquiry Placed Month",
      "Lease Count",
    ]);

    return NextResponse.json({
      arrayResult,
      inquirySourceArray,
      result: monthlyTotals,
      inquirySourceBreakdown,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
