import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Inquiry, inquiry, InquiryInsert } from "@/db/schema/inquiry";
import { eq } from "drizzle-orm";
import { userDetails } from "@/db/schema";
import { getEmployeeIdByFullName } from "@/lib/controllers/userController";
import { emptyStringToNull, isValidDate } from "@/lib/utils";

type InquiryApiData = {
  sitelinkId: string;
  iCurrencyDecimals: number;
  iTaxDecimals: number;
  dcTax1Rate_Rent: number;
  dcTax2Rate_Rent: number;
  waitingId: string;
  tenantId: string;
  ledgerId: string;
  unitId: string;
  unitName: string;
  size: string;
  width: number;
  length: number;
  area: number;
  isMobile: boolean;
  isClimate: boolean;
  isAlarm: boolean;
  isPower: boolean;
  isInside: boolean;
  floor: number;
  pushRate: number;
  stdRate: number;
  unitTypeId: number;
  unitTypeName: string;
  bChargeTax1: boolean;
  bChargeTax2: boolean;
  iDefLeaseNum: number;
  ConcessionID: number;
  discountPlanName: string;
  iPromoGlobalNum: string;
  sPromoDescription: string;
  QTCancellationTypeID: number | null;
  datePlaced: string; // or Date if parsed
  firstFollowUpDate: string;
  lastFollowUpDate: string;
  cancelDate: string;
  expirationDate: string;
  leaseDate: string;
  iDaysWorked: number;
  dcPaidReserveFee: number;
  iCallType: number;
  callType: string;
  cancellationReason: string;
  firstName: string;
  middleName: string;
  lastName: string;
  sTenantName: string;
  company: string;
  isCommercial: boolean;
  insurancePremium: number;
  iLeaseNum: number;
  iAutoBillType: number;
  sAutoBillType: string;
  bInvoice: boolean;
  dcSchedRent: number;
  dSchedRentStrt: string;
  employeeName: string;
  employeeFollowUp: string;
  employeeConvertedToRes: string;
  employeeConvertedToMoveIn: string;
  sEmployeeNameInitials: string;
  sEmployeeFollowUpInitials: string;
  sEmployeeConvertedToResInitials: string;
  sEmployeeConvertedToMoveInInitials: string;
  iInquiryType: number;
  inquiryType: string;
  marketingId: number;
  marketingDesc: string;
  rentalTypeId: number;
  rentalType: string;
  convertedToResDate: string;
  neededDate: string;
  sCancellationReason1: string;
  email: string;
  comment: string;
  phone: string;
  iGlobalWaitingNum: number;
  source: string;
  postalCode: number;
  sCallerID: string;
  sTrackingNum: string | null;
  iInquiryConvertedToLease: number;
  iReservationConvertedToLease: number;
  quotedRate: number;
};

async function parseInquiryData(item: InquiryApiData): Promise<InquiryInsert> {
  {
    const employeeId = await getEmployeeIdByFullName(item.employeeName);

    const employeeConvertedToMoveInId = await getEmployeeIdByFullName(
      item.employeeConvertedToMoveIn
    );
    const employeeConvertedToResId = await getEmployeeIdByFullName(
      item.employeeConvertedToRes
    );
    const employeeFollowUpId = await getEmployeeIdByFullName(
      item.employeeFollowUp
    );

    return {
      sitelinkId: item.sitelinkId,
      pushRate: item.pushRate,
      stdRate: item.stdRate,
      waitingId: item.waitingId,
      tenantId: item.tenantId,
      ledgerId: item.ledgerId,
      unitId: item.unitId,
      datePlaced:
        item.datePlaced && item.datePlaced !== ""
          ? new Date(item.datePlaced)
          : null,
      firstFollowUpDate:
        item.firstFollowUpDate && item.firstFollowUpDate !== ""
          ? new Date(item.firstFollowUpDate)
          : null,
      lastFollowUpDate:
        item.lastFollowUpDate && item.lastFollowUpDate !== ""
          ? new Date(item.lastFollowUpDate)
          : null,
      cancelDate:
        item.cancelDate && item.cancelDate !== ""
          ? new Date(item.cancelDate)
          : null,
      expirationDate:
        item.expirationDate && item.expirationDate !== ""
          ? new Date(item.expirationDate)
          : null,
      leaseDate:
        item.leaseDate && item.leaseDate !== ""
          ? new Date(item.leaseDate)
          : null,
      callType: item.callType,
      inquiryType: item.inquiryType,
      marketingId: item.marketingId,
      marketingDesc: item.marketingDesc,
      rentalTypeId: item.rentalTypeId,
      rentalType: item.rentalType,
      convertedToResDate: item.convertedToResDate,
      neededDate: item.neededDate,
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
      employeeConvertedToResId: employeeConvertedToResId,
      employeeFollowUpId: employeeFollowUpId,
      comment: item.comment,
    };
  }
}
async function saveInquiry(data: any) {
  try {
    const result = await db.insert(inquiry).values(data);
    console.log("Inquiry saved successfully:", result);
  } catch (error) {
    console.error("Error saving inquiry:", error);
    throw new Error("Database operation failed");
  }
  return { success: true };
}

export async function POST(req: NextRequest) {
  try {
    const body: InquiryApiData[] = await req.json();
    const inquiryData: InquiryInsert[] = await Promise.all(
      body.map(async (item) => await parseInquiryData(item))
    );
    const result = await saveInquiry(inquiryData);

    return NextResponse.json(inquiryData, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process inquiry" },
      { status: 500 }
    );
  }
}
