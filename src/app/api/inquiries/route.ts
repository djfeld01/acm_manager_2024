import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { Inquiry, inquiry, InquiryInsert } from "@/db/schema/inquiry";
import { eq } from "drizzle-orm";
import { userDetails } from "@/db/schema";
import { getEmployeeIdByFullName } from "@/lib/controllers/userController";

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

async function saveInquiry(data: any) {
  return { success: true };
}

export async function POST(req: NextRequest) {
  try {
    const body: InquiryApiData[] = await req.json();
    const inquiryData: InquiryInsert[] = await Promise.all(
      body.map(async (item) => {
        const employeeId = await getEmployeeIdByFullName(item.employeeName);
        console.log("Employee ID:", employeeId);
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
          datePlaced: item.datePlaced,
          firstFollowUpDate: item.firstFollowUpDate,
          lastFollowUpDate: item.lastFollowUpDate,
          cancelDate: item.cancelDate,
          expirationDate: item.expirationDate,
          leaseDate: item.leaseDate,
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
      })
    );
    const result = await saveInquiry(body);

    return NextResponse.json(inquiryData, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process inquiry" },
      { status: 500 }
    );
  }
}
