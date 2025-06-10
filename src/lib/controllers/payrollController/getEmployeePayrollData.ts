"use server";

import {
  Activity,
  Logins,
  Mileage,
  Vacations,
} from "@/components/EmployeeComissionComponent";
import { db } from "@/db";
import {
  bonus,
  holiday,
  mileage,
  payPeriod,
  sitelinkLogons,
  storageFacilities,
  tenantActivities,
  userDetails,
  usersToFacilities,
  vacation,
} from "@/db/schema";
import { eq, sql, and, isNull, gte, lte, not, Name } from "drizzle-orm";
// Employee Last Name
// Employee First Name
// Employee Full Name
// Employee Number
// Rate
//Dept
//Regular Hours
//OT Hours
//Holiday Hours
//Vacation Hours
//Sick Hours (null)
//Christmas Bonus
//Monthly Bonus
//Storage Commission
//Mileage

export async function getEmployeePayrollData(payrollNumber?: string) {
  try {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const nextPayPeriodArray = await db
      .select()
      .from(payPeriod)
      .where(gte(payPeriod.processingDate, yesterday.toDateString()))
      .limit(1)
      .orderBy(payPeriod.processingDate);
    if (!nextPayPeriodArray) {
      throw new Error("No pay period found for the given criteria.");
    }
    const { startDate, endDate } = nextPayPeriodArray[0];
    const payrollId = nextPayPeriodArray[0].payPeriodId;
    const employees = await db.query.userDetails.findMany({
      columns: {
        firstName: true,
        lastName: true,
        fullName: true,
        paycorEmployeeId: true,
        id: true,
      },
      orderBy: [userDetails.fullName],
    });
    const holidayHours = await db.query.holiday.findMany({
      where: (holiday, { eq }) => eq(holiday.payPeriodId, payrollId),
      columns: {
        date: true,
        employeeId: true,
        facilityId: true,
        holidayHours: true,
        holidayHoursType: true,
      },
    });
    const vacationHours = await db.query.vacation.findMany({
      where: (vacation, { eq }) => eq(vacation.payPeriodId, payrollId),
      columns: {
        date: true,
        employeeId: true,
        facilityId: true,
        vacationHours: true,
        vacationHoursType: true,
      },
    });
    const bonusPay = await db.query.bonus.findMany({
      where: (bonus, { eq }) => eq(bonus.payPeriodId, payrollId),
      columns: {
        employeeId: true,
        bonusAmount: true,
        bonusMonth: true,
        date: true,
        facilityId: true,
      },
    });
    const mileageUsage = await db.query.mileage.findMany({
      where: (mileage, { eq }) => eq(mileage.payPeriodId, payrollId),
      columns: {
        employeeId: true,
        mileage: true,
        mileageRate: true,
        facilityId: true,
        date: true,
      },
    });
    const rentals = await db.query.tenantActivities.findMany({
      where: (tenantActivities, { eq }) =>
        eq(tenantActivities.payPeriodId, payrollId),
      columns: {
        employeeId: true,
        unitName: true,
        hasInsurance: true,
        facilityId: true,
      },
    });
    const employeeFacilityRelation = await db.query.usersToFacilities.findMany({
      with: { storageFacility: true },
    });
    let finalResult: any = [];

    employees.forEach((employee) => {
      const facilityConnections = employeeFacilityRelation.filter(
        (relation) => relation.userId === employee.id
      );
      const employeeOutput = facilityConnections.map((employeeFacility) => {
        const mileage = mileageUsage.reduce(
          (prev, entry) =>
            entry.employeeId === employeeFacility.userId &&
            entry.facilityId === employeeFacility.storageFacilityId
              ? prev + entry.mileage * entry.mileageRate
              : prev,
          0
        );
        const storage = rentals.reduce((prev, rental) => {
          const { position, storageFacilityId, userId, storageFacility } =
            employeeFacility;
          if (
            rental.employeeId !== userId ||
            rental.facilityId !== storageFacilityId
          ) {
            return prev;
          }

          if (position === "MANAGER") {
            return rental.hasInsurance
              ? prev + storageFacility.insuranceCommissionRate
              : prev;
          }

          return rental.hasInsurance
            ? prev + storageFacility.insuranceCommissionRate + 5
            : prev + 5;
        }, 0);

        const vacation = vacationHours.reduce(
          (prev, vacationTime) =>
            vacationTime.employeeId === employeeFacility.userId &&
            vacationTime.facilityId === employeeFacility.storageFacilityId
              ? vacationTime.vacationHours + prev
              : prev,
          0
        );
        const holiday = holidayHours.reduce(
          (prev, holidayTime) =>
            holidayTime.employeeId === employeeFacility.userId &&
            holidayTime.facilityId === employeeFacility.storageFacilityId
              ? holidayTime.holidayHours + prev
              : prev,
          0
        );
        const bonus = bonusPay.reduce(
          (prev, bonusItem) =>
            bonusItem.employeeId === employeeFacility.userId &&
            bonusItem.facilityId === employeeFacility.storageFacilityId
              ? bonusItem.bonusAmount + prev
              : prev,
          0
        );

        return {
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: employee.fullName,
          facility: employeeFacility.storageFacility.paycorNumber,
          bonus,
          mileage,
          storage,
          vacation,
          holiday,
        };
      });
      finalResult = [...finalResult, ...employeeOutput];
    });

    const finalResultArray = finalResult.map((item: any) => [
      item.lastName,
      item.firstName,
      item.fullName,
      ,
      ,
      item.facility,
      ,
      ,
      item.holiday,
      item.vacation,
      ,
      ,
      item.bonus,
      item.storage,
      item.mileage,
    ]);
    finalResultArray.unshift([
      "Last Name",
      "First Name",
      "Full Name",
      "Employee Number",
      "Rate",
      "Dept",
      "Regular Hours",
      "OT Hours",
      "Holiday Hours",
      "Vacation Hours",
      "Sick Hours",
      "Christmas Bonus",
      "Monthly Incentive",
      "Storage Commission",
      "Mileage",
    ]);
    return {
      finalResult,
      finalResultArray,
    };
  } catch (error) {
    console.error("Error fetching employee payroll data:", error);
    throw new Error("Failed to fetch employee payroll data");
  }
}
