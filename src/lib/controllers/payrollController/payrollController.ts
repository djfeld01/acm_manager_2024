"use server";
import { db } from "@/db";
import bonus, { AddBonus } from "@/db/schema/bonus";
import holiday, { AddHolidayHours } from "@/db/schema/holiday";
import mileage, { AddMileage } from "@/db/schema/mileage";
import vacation, { AddVacationHours } from "@/db/schema/vacation";
import hoursEntry from "@/db/schema/hoursEntry";
import vacationRequest from "@/db/schema/vacationRequest";
import payrollPeriodStatus from "@/db/schema/payrollPeriodStatus";
import userDetails from "@/db/schema/userDetails";
import usersToFacilities from "@/db/schema/usersToFacilities";
import { auth } from "@/auth";
import { and, eq, inArray } from "drizzle-orm";

export async function addVacation(vacationValues: AddVacationHours) {
  try {
    return db.insert(vacation).values(vacationValues).returning();
  } catch (e) {
    console.log(e);
  }
}
export async function addMileage(mileageValues: AddMileage) {
  try {
    return db.insert(mileage).values(mileageValues).returning();
  } catch (e) {
    console.log(e);
  }
}

export async function addHoliday(holidayValues: AddHolidayHours) {
  try {
    return db.insert(holiday).values(holidayValues).returning();
  } catch (e) {
    console.log(e);
  }
}

export async function addBonus(bonusValues: AddBonus) {
  try {
    return db.insert(bonus).values(bonusValues).returning();
  } catch (e) {
    console.log(e);
  }
}

export async function saveHoursEntry(values: {
  employeeId: string;
  payPeriodId: string;
  facilityId: string;
  regularHours: string;
  overtimeHours: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const enteredBy = session.user.userDetailId;
  return db
    .insert(hoursEntry)
    .values({ ...values, status: "DRAFT", enteredBy })
    .onConflictDoUpdate({
      target: [hoursEntry.employeeId, hoursEntry.payPeriodId, hoursEntry.facilityId],
      set: {
        regularHours: values.regularHours,
        overtimeHours: values.overtimeHours,
        notes: values.notes,
        updatedAt: new Date(),
      },
    })
    .returning();
}

export async function submitVacationRequest(values: {
  employeeId: string;
  payPeriodId: string;
  facilityId: string;
  startDate: string;
  endDate: string;
  hoursRequested: string;
}) {
  return db.insert(vacationRequest).values({ ...values, status: "PENDING" }).returning();
}

export async function getHoursEntry(employeeId: string, payPeriodId: string, facilityId: string) {
  const result = await db
    .select()
    .from(hoursEntry)
    .where(
      and(
        eq(hoursEntry.employeeId, employeeId),
        eq(hoursEntry.payPeriodId, payPeriodId),
        eq(hoursEntry.facilityId, facilityId)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function getVacationRequestsForPeriod(employeeId: string, payPeriodId: string) {
  return db
    .select()
    .from(vacationRequest)
    .where(
      and(
        eq(vacationRequest.employeeId, employeeId),
        eq(vacationRequest.payPeriodId, payPeriodId)
      )
    )
    .orderBy(vacationRequest.requestedAt);
}

export async function getMileageForPeriod(employeeId: string, payPeriodId: string, facilityId: string) {
  return db
    .select()
    .from(mileage)
    .where(
      and(
        eq(mileage.employeeId, employeeId),
        eq(mileage.payPeriodId, payPeriodId),
        eq(mileage.facilityId, facilityId)
      )
    )
    .orderBy(mileage.date);
}

// ── Supervisor actions ───────────────────────────────────────────────────────

/**
 * For a given facility + pay period, returns all employees who have
 * EMPLOYEE_SUBMITTED status, along with their hours, vacation requests,
 * and mileage for that period.
 */
export async function getSubmittedPayrollForFacility(
  sitelinkId: string,
  payPeriodId: string
) {
  // Find all employees at this facility
  const facilityEmployees = await db
    .select({ employeeId: usersToFacilities.userId, position: usersToFacilities.position })
    .from(usersToFacilities)
    .where(eq(usersToFacilities.storageFacilityId, sitelinkId));

  if (!facilityEmployees.length) return [];

  const employeeIds = facilityEmployees.map((e) => e.employeeId);

  // Get payroll period statuses for submitted employees
  const statuses = await db
    .select()
    .from(payrollPeriodStatus)
    .where(
      and(
        inArray(payrollPeriodStatus.employeeId, employeeIds),
        eq(payrollPeriodStatus.payPeriodId, payPeriodId)
      )
    );

  if (!statuses.length) return [];

  // Get employee names
  const employees = await db
    .select({ id: userDetails.id, fullName: userDetails.fullName })
    .from(userDetails)
    .where(inArray(userDetails.id, employeeIds));

  // Get hours entries
  const hours = await db
    .select()
    .from(hoursEntry)
    .where(
      and(
        inArray(hoursEntry.employeeId, employeeIds),
        eq(hoursEntry.payPeriodId, payPeriodId),
        eq(hoursEntry.facilityId, sitelinkId)
      )
    );

  // Get vacation requests
  const vacationRequests = await db
    .select()
    .from(vacationRequest)
    .where(
      and(
        inArray(vacationRequest.employeeId, employeeIds),
        eq(vacationRequest.payPeriodId, payPeriodId)
      )
    );

  // Get mileage
  const mileageEntries = await db
    .select()
    .from(mileage)
    .where(
      and(
        inArray(mileage.employeeId, employeeIds),
        eq(mileage.payPeriodId, payPeriodId),
        eq(mileage.facilityId, sitelinkId)
      )
    );

  return statuses.map((status) => ({
    status,
    employee: employees.find((e) => e.id === status.employeeId),
    position: facilityEmployees.find((e) => e.employeeId === status.employeeId)?.position,
    hours: hours.find((h) => h.employeeId === status.employeeId) ?? null,
    vacationRequests: vacationRequests.filter((v) => v.employeeId === status.employeeId),
    mileageEntries: mileageEntries.filter((m) => m.employeeId === status.employeeId),
  }));
}

export async function approveFacilityPayroll(
  employeeIds: string[],
  payPeriodId: string,
  notes?: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const approvedBy = session.user.userDetailId!;
  return db
    .insert(payrollPeriodStatus)
    .values(
      employeeIds.map((id) => ({
        employeeId: id,
        payPeriodId,
        status: "SUPERVISOR_APPROVED" as const,
        supervisorApprovedAt: new Date(),
        supervisorApprovedBy: approvedBy,
        supervisorNotes: notes ?? null,
      }))
    )
    .onConflictDoUpdate({
      target: [payrollPeriodStatus.employeeId, payrollPeriodStatus.payPeriodId],
      set: {
        status: "SUPERVISOR_APPROVED",
        supervisorApprovedAt: new Date(),
        supervisorApprovedBy: approvedBy,
        supervisorNotes: notes ?? null,
      },
    });
}

export async function requestPayrollChanges(
  employeeId: string,
  payPeriodId: string,
  notes: string
) {
  return db
    .insert(payrollPeriodStatus)
    .values({
      employeeId,
      payPeriodId,
      status: "NOT_STARTED" as const,
      supervisorNotes: notes,
    })
    .onConflictDoUpdate({
      target: [payrollPeriodStatus.employeeId, payrollPeriodStatus.payPeriodId],
      set: { status: "NOT_STARTED", supervisorNotes: notes },
    });
}

export async function submitFacilityForReview(employeeIds: string[], payPeriodId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return db
    .insert(payrollPeriodStatus)
    .values(
      employeeIds.map((id) => ({
        employeeId: id,
        payPeriodId,
        status: "EMPLOYEE_SUBMITTED" as const,
        employeeSubmittedAt: new Date(),
      }))
    )
    .onConflictDoUpdate({
      target: [payrollPeriodStatus.employeeId, payrollPeriodStatus.payPeriodId],
      set: { status: "EMPLOYEE_SUBMITTED", employeeSubmittedAt: new Date() },
    });
}
