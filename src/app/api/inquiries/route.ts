import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiry, InquiryInsert } from "@/db/schema/inquiry";
import { and, eq, sql } from "drizzle-orm";
import {
  getAllEmployees,
  getEmployeeIdByFullName,
} from "@/lib/controllers/userController";
import { emptyStringToNull, isValidDate } from "@/lib/utils";
import unit, { UnitInsert } from "@/db/schema/unit";
import tenant, { TenantInsert } from "@/db/schema/tenant";
import { UserDetails } from "@/db/schema/userDetails";

// Helper function to safely parse dates
function safeParseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === "" || dateStr === "null") {
    return null;
  }

  const parsedDate = new Date(dateStr);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

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
  postalCode: string;
  sCallerID: string;
  sTrackingNum: string | null;
  iInquiryConvertedToLease: number;
  iReservationConvertedToLease: number;
  quotedRate: number;
  reportDate: string;
};

async function parseInquiryData(
  item: InquiryApiData,
  allEmployees: UserDetails[]
): Promise<InquiryInsert> {
  {
    const employee = allEmployees.filter(
      (employee) => employee.fullName === item.employeeName.trim()
    );
    const employeeId = employee[0]?.id || null;
    const employeeConvertedToMoveIn = allEmployees.filter(
      (employee) => employee.fullName === item.employeeConvertedToMoveIn.trim()
    );
    const employeeConvertedToMoveInId =
      employeeConvertedToMoveIn[0]?.id || null;
    const employeeConvertedToRes = allEmployees.filter(
      (employee) => employee.fullName === item.employeeConvertedToRes.trim()
    );
    const employeeConvertedToResId = employeeConvertedToRes[0]?.id || null;

    const employeeFollowUp = allEmployees.filter(
      (employee) => employee.fullName === item.employeeFollowUp.trim()
    );
    const employeeFollowUpId = employeeFollowUp[0]?.id || null;

    return {
      sitelinkId: item.sitelinkId,
      pushRate: item.pushRate,
      stdRate: item.stdRate,
      waitingId: item.waitingId,
      tenantId: item.tenantId,
      ledgerId: item.ledgerId,
      unitId: item.unitId,
      datePlaced:
        safeParseDate(item.datePlaced) ||
        safeParseDate(item.leaseDate) ||
        new Date(),
      firstFollowUpDate: safeParseDate(item.firstFollowUpDate),
      lastFollowUpDate: safeParseDate(item.lastFollowUpDate),
      cancelDate: safeParseDate(item.cancelDate),
      expirationDate: safeParseDate(item.expirationDate),
      leaseDate: safeParseDate(item.leaseDate),
      callType: item.callType,
      inquiryType: item.inquiryType,
      marketingId: item.marketingId,
      marketingDesc: item.marketingDesc,
      rentalTypeId: item.rentalTypeId,
      rentalType: item.rentalType,
      convertedToResDate: safeParseDate(item.convertedToResDate),
      neededDate: safeParseDate(item.neededDate),
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
      reportDate: safeParseDate(item.reportDate),
    };
  }
}

async function saveTenants(data: TenantInsert[]) {
  try {
    console.log("Inserting into Tenants");
    const result = await db
      .insert(tenant)
      .values(data)
      .onConflictDoUpdate({
        target: [tenant.tenantId],
        set: {
          company: sql.raw(`excluded.company`),
          email: sql.raw(`excluded.email`),
          firstName: sql.raw(`excluded.first_name`),
          middleName: sql.raw(`excluded.middle_name`),
          isCommercial: sql.raw(`excluded.is_commercial`),
          insurancePremium: sql.raw(`excluded.insurance_premium`),
          lastName: sql.raw(`excluded.last_name`),
          middleInitial: sql.raw(`excluded.middle_initial`),
          phone: sql.raw(`excluded.phone`),
          postalCode: sql.raw(`excluded.postal_code`),
          sitelinkId: sql.raw(`excluded.sitelink_id`),
          reportDate: sql.raw(`excluded.report_date`),
        },
        where: sql.raw(
          `excluded.report_date > tenant.report_date OR tenant.report_date IS NULL`
        ),
      });
    console.log("Tenant saved successfully:", result);
  } catch (error) {
    console.error("Error saving Tenant:", error);
    throw new Error("Database operation failed");
  }
  return { success: true };
}
async function saveUnits(data: UnitInsert[]) {
  try {
    console.log("Inserting into Units");
    const result = await db
      .insert(unit)
      .values(data)
      .onConflictDoUpdate({
        target: [unit.unitId],
        set: {
          area: sql.raw(`excluded.area`),
          floor: sql.raw(`excluded.floor`),
          isAlarm: sql.raw(`excluded.is_alarm`),
          isClimate: sql.raw(`excluded.is_climate`),
          isInside: sql.raw(`excluded.is_inside`),
          isMobile: sql.raw(`excluded.is_mobile`),
          isPower: sql.raw(`excluded.is_power`),
          length: sql.raw(`excluded.length`),
          size: sql.raw(`excluded.size`),
          unitName: sql.raw(`excluded.unit_name`),
          unitTypeId: sql.raw(`excluded.unit_type_id`),
          unitTypeName: sql.raw(`excluded.unit_type_name`),
          width: sql.raw(`excluded.width`),
          reportDate: sql.raw(`excluded.report_date`),
        },
        where: sql.raw(
          `excluded.report_date > unit.report_date OR unit.report_date IS NULL`
        ),
      });
    console.log("Unit saved successfully:", result);
  } catch (error) {
    console.error("Error saving unit:", error);
    throw new Error("Database operation failed");
  }
  return { success: true };
}
async function saveInquiries(data: InquiryInsert[]) {
  try {
    console.log("Inserting into Inquiries");
    const result = await db
      .insert(inquiry)
      .values(data)
      .onConflictDoUpdate({
        target: [inquiry.tenantId, inquiry.datePlaced, inquiry.sitelinkId],
        set: {
          ledgerId: sql.raw(`excluded.ledger_id`),
          waitingId: sql.raw(`excluded.waiting_id`),
          unitId: sql.raw(`excluded.unit_id`),
          firstFollowUpDate: sql.raw(`excluded.first_follow_up_date`),
          lastFollowUpDate: sql.raw(`excluded.last_follow_up_date`),
          cancelDate: sql.raw(`excluded.cancel_date`),
          expirationDate: sql.raw(`excluded.expiration_date`),
          leaseDate: sql.raw(`excluded.lease_date`),
          callType: sql.raw(`excluded.call_type`),
          inquiryType: sql.raw(`excluded.inquiry_type`),
          marketingId: sql.raw(`excluded.marketing_id`),
          marketingDesc: sql.raw(`excluded.marketing_desc`),
          rentalTypeId: sql.raw(`excluded.rental_type_id`),
          rentalType: sql.raw(`excluded.rental_type`),
          convertedToResDate: sql.raw(`excluded.converted_to_res_date`),
          neededDate: sql.raw(`excluded.needed_date`),
          cancellationReason: sql.raw(`excluded.cancellation_reason`),
          comment: sql.raw(`excluded.comment`),
          source: sql.raw(`excluded.source`),
          quotedRate: sql.raw(`excluded.quoted_rate`),
          employeeName: sql.raw(`excluded.employee_name`),
          employeeFollowUp: sql.raw(`excluded.employee_follow_up`),
          employeeConvertedToRes: sql.raw(`excluded.employee_converted_to_res`),
          employeeConvertedToMoveIn: sql.raw(
            `excluded.employee_converted_to_move_in`
          ),
          pushRate: sql.raw(`excluded.push_rate`),
          stdRate: sql.raw(`excluded.std_rate`),
          discountPlanName: sql.raw(`excluded.discount_plan_name`),
          employeeConvertedToMoveInId: sql.raw(
            `excluded.employee_converted_to_move_in_id`
          ),
          employeeId: sql.raw(`excluded.employee_id`),
          employeeConvertedToResId: sql.raw(
            `excluded.employee_converted_to_res_id`
          ),
          employeeFollowUpId: sql.raw(`excluded.employee_follow_up_id`),
          reportDate: sql.raw(`excluded.report_date`),
        },
        where: sql.raw(
          `excluded.report_date > inquiry.report_date OR inquiry.report_date IS NULL`
        ),
      });
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
    console.log("Build Unit Data");
    const unitData: UnitInsert[] = body
      .map((item) => {
        return {
          sitelinkId: item.sitelinkId,
          unitId: item.unitId,
          unitName: item.unitName,
          size: item.size,
          width: item.width,
          length: item.length,
          area: item.area,
          isMobile: item.isMobile,
          isClimate: item.isClimate,
          isAlarm: item.isAlarm,
          isPower: item.isPower,
          isInside: item.isInside,
          floor: item.floor,
          unitTypeId: item.unitTypeId,
          unitTypeName: item.unitTypeName,
          reportDate: safeParseDate(item.reportDate),
        };
      })
      .filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.unitId === obj.unitId)
      );
    console.log("Build Tenant Data");
    const tenantData: TenantInsert[] = body
      .map((item) => {
        return {
          sitelinkId: item.sitelinkId,
          tenantId: item.tenantId,
          firstName: emptyStringToNull(item.firstName),
          middleName: emptyStringToNull(item.middleName),
          lastName: emptyStringToNull(item.lastName),
          company: emptyStringToNull(item.company),
          email: emptyStringToNull(item.email),
          phone: emptyStringToNull(item.phone),
          isCommercial: item.isCommercial,
          insurancePremium: item.insurancePremium.toString(),
          postalCode: item.postalCode,
          reportDate: safeParseDate(item.reportDate),
        };
      })
      .filter(
        (obj, index, self) =>
          index === self.findIndex((t) => t.tenantId === obj.tenantId)
      );
    console.log("Build Inquiry Data");
    const allEmployees = await getAllEmployees();
    const inquiryData: InquiryInsert[] = await Promise.all(
      body.map(async (item) => await parseInquiryData(item, allEmployees))
    );

    // Track duplicates for debugging
    const duplicates: InquiryInsert[] = [];
    const seen = new Set<string>();
    const deduplicatedInquiryData: InquiryInsert[] = [];

    inquiryData.forEach((inquiry) => {
      const key = `${inquiry.tenantId}|${inquiry.datePlaced?.getTime()}|${
        inquiry.sitelinkId
      }`;
      if (seen.has(key)) {
        duplicates.push(inquiry);
      } else {
        seen.add(key);
        deduplicatedInquiryData.push(inquiry);
      }
    });

    console.log(
      `inquiry Data Built: ${inquiryData.length} total, ${deduplicatedInquiryData.length} after deduplication, ${duplicates.length} duplicates removed`
    );
    const tenantResult = await saveTenants(tenantData);
    const unitResult = await saveUnits(unitData);
    const inquiryResult = await saveInquiries(deduplicatedInquiryData);

    return NextResponse.json(
      {
        tenantResult,
        unitResult,
        inquiryResult,
        duplicates: {
          count: duplicates.length,
          removedInquiries: duplicates.map((inquiry) => ({
            tenantId: inquiry.tenantId,
            datePlaced: inquiry.datePlaced,
            sitelinkId: inquiry.sitelinkId,
            waitingId: inquiry.waitingId,
            ledgerId: inquiry.ledgerId,
            employeeName: inquiry.employeeName,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process inquiry" },
      { status: 500 }
    );
  }
}
