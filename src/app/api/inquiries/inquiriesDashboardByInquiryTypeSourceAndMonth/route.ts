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
      inquiryTypeFilter,
      sourceFilter,
    });

    const arrayResult = result.map((row) => [
      `=TEXT(DATE(${row.monthKey.split("-")[0]},${
        row.monthKey.split("-")[1]
      },1),"YYYY-MM")`,
      row.facilityAbbreviation,
      row.sitelinkId,
      row.monthKey,
      row.inquiryType,
      row.source,
      row.inquiriesPlaced ? row.inquiriesPlaced : 0,
      row.leasesSigned ? row.leasesSigned : 0,
      row.cancellations ? row.cancellations : 0,
    ]);
    arrayResult.unshift([
      "FormattedDateFormula",
      "Facility",
      "SitelinkId",
      "Month",
      "Inquiry Type",
      "Source",
      "Inquiries",
      "Rentals",
      "Cancellations",
    ]);
    return NextResponse.json({ arrayResult, result });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
