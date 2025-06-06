import { getInquiryTotalsByInquiryTypeAndMonth } from "@/lib/controllers/inquiryController/getInquiryTotalsByInquiryTypeAndMonth";
import { NextRequest, NextResponse } from "next/server";
import { array } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const startDateStr = searchParams.get("start");
    const endDateStr = searchParams.get("end");
    const source = searchParams.get("source") || undefined;

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const result = await getInquiryTotalsByInquiryTypeAndMonth({
      startDate,
      endDate,
      inquiryTypeFilter: source,
    });

    const arrayResult = result.map((row) => [
      row.facilityAbbreviation,
      row.sitelinkId,
      row.monthKey,
      row.inquiryType,
      row.inquiriesPlaced ? row.inquiriesPlaced : 0,
      row.leasesSigned ? row.leasesSigned : 0,
      row.cancellations ? row.cancellations : 0,
    ]);
    arrayResult.unshift([
      "Facility",
      "SitelinkId",
      "Month",
      "Inquiry Type",
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
