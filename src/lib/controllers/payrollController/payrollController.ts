"use server";
import { db } from "@/db";
import bonus, { AddBonus } from "@/db/schema/bonus";
import holiday, { AddHolidayHours } from "@/db/schema/holiday";
import mileage, { AddMileage } from "@/db/schema/mileage";
import vacation, { AddVacationHours } from "@/db/schema/vacation";
import hoursEntry from "@/db/schema/hoursEntry";
import vacationRequest from "@/db/schema/vacationRequest";
import payrollPeriodStatus from "@/db/schema/payrollPeriodStatus";
import { auth } from "@/auth";

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
