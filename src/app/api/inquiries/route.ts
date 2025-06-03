import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Inquiry, inquiry } from "@/db/schema/inquiry";
import { eq } from "drizzle-orm";
import { userDetails } from "@/db/schema";
async function saveInquiry(data: any) {
  return { success: true };
}

export async function POST(req: NextRequest) {
  try {
    const body: Inquiry[] = await req.json();
    const inquiryData: any = body.map(async (item) => {
      let employeeLookup = null;
      if (item.employeeName) {
        employeeLookup = await db.query.userDetails.findFirst({
          where: eq(userDetails.fullName, item.employeeName),
        });
      }
      const employeeId = employeeLookup ? employeeLookup.id : null;

      let employeeConvertedToMoveInIdLookup = null;
      if (item.employeeConvertedToMoveIn) {
        employeeConvertedToMoveInIdLookup =
          await db.query.userDetails.findFirst({
            where: eq(userDetails.fullName, item.employeeConvertedToMoveIn),
          });
      }
      const employeeConvertedToMoveInId = employeeConvertedToMoveInIdLookup
        ? employeeConvertedToMoveInIdLookup.id
        : null;

      let employeeConvertedToResIdLookup = null;
      if (item.employeeConvertedToRes) {
        employeeConvertedToResIdLookup = await db.query.userDetails.findFirst({
          where: eq(userDetails.fullName, item.employeeConvertedToRes),
        });
      }
      const employeeConvertedToResId = employeeConvertedToResIdLookup
        ? employeeConvertedToResIdLookup.id
        : null;

      if (item.employeeFollowUp) {
        const employeeFollowUpId = await db.query.userDetails.findFirst({
          where: eq(userDetails.fullName, item.employeeFollowUp),
        });
      }

      return {
        sitelinkId: item.sitelinkId,
        pushRate: item.pushRate,
        stdRate: item.stdRate,
        waitingId: item.waitingId,
        tenantId: item.tenantId,
        ledgerId: item.ledgerId,
        unitId: item.unitId,
        datePlaced: item.datePlaced ? new Date(item.datePlaced) : null,
        firstFollowUpDate: item.firstFollowUpDate
          ? new Date(item.firstFollowUpDate)
          : null,
        lastFollowUpDate: item.lastFollowUpDate
          ? new Date(item.lastFollowUpDate)
          : null,
        cancelDate: item.cancelDate ? new Date(item.cancelDate) : null,
        expirationDate: item.expirationDate
          ? new Date(item.expirationDate)
          : null,
        leaseDate: item.leaseDate ? new Date(item.leaseDate) : null,
        callType: item.callType,
        inquiryType: item.inquiryType,
        marketingId: item.marketingId,
        marketingDesc: item.marketingDesc,
        rentalTypeId: item.rentalTypeId,
        rentalType: item.rentalType,
        convertedToResDate: item.convertedToResDate
          ? new Date(item.convertedToResDate)
          : null,
        neededDate: item.neededDate ? new Date(item.neededDate) : null,
        cancellationReason: item.cancellationReason,
        source: item.source,
        quotedRate: item.quotedRate,
        discountPlanName: item.discountPlanName,
        employeeName: item.employeeName,
        employeeFollowUp: item.employeeFollowUp,
        employeeConvertedToRes: item.employeeConvertedToRes,
        employeeConvertedToMoveIn: item.employeeConvertedToMoveIn,
        employeeConvertedToMoveInId: employeeConvertedToMoveInId,
        employeeId: employeeId,
      };
    });
    const result = await saveInquiry(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process inquiry" },
      { status: 500 }
    );
  }
}
