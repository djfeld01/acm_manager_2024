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
    let payrollId = payrollNumber;
    if (!payrollId) {
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
      payrollId = nextPayPeriodArray[0].payPeriodId;
    }
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
      where: (bonus, { eq, and, ne }) =>
        and(eq(bonus.payPeriodId, payrollId), ne(bonus.bonusType, "Christmas")),
      columns: {
        employeeId: true,
        bonusAmount: true,
        bonusMonth: true,
        date: true,
        facilityId: true,
        bonusType: true,
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
        Id: true,
        employeeId: true,
        date: true,
        tenantName: true,
        unitName: true,
        hasInsurance: true,
        facilityId: true,
      },
    });
    const unpaidRentals = await db.query.tenantActivities.findMany({
      where: (tenantActivities, { eq, isNull }) =>
        and(
          eq(tenantActivities.activityType, "MoveIn"),
          isNull(tenantActivities.payPeriodId)
        ),
      columns: {
        Id: true,
        employeeId: true,
        date: true,
        tenantName: true,
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
        const mileageDollars = mileageUsage.reduce(
          (prev, entry) =>
            entry.employeeId === employeeFacility.userId &&
            entry.facilityId === employeeFacility.storageFacilityId
              ? prev + entry.mileage * entry.mileageRate
              : prev,
          0
        );
        const filteredRentals = rentals.filter(
          (rental) =>
            rental.employeeId === employeeFacility.userId &&
            rental.facilityId === employeeFacility.storageFacilityId
        );
        //console.log("Filtered Rentals", filteredRentals);
        const storage = filteredRentals.reduce((prev, rental) => {
          const { position, storageFacilityId, userId, storageFacility } =
            employeeFacility;

          if (position === "MANAGER") {
            return rental.hasInsurance
              ? prev + storageFacility.insuranceCommissionRate
              : prev;
          }

          return rental.hasInsurance
            ? prev + storageFacility.insuranceCommissionRate + 5
            : prev + 5;
        }, 0);
        const unpaidCommission = unpaidRentals.filter((rental) => {
          return (
            rental.employeeId === employeeFacility.userId &&
            rental.facilityId === employeeFacility.storageFacilityId
          );
        });
        //console.log("Unpaid Commission:", unpaidCommission);
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
        const monthlyBonusBreakdown = bonusPay.filter(
          (bonusItem) =>
            bonusItem.employeeId === employeeFacility.userId &&
            bonusItem.facilityId === employeeFacility.storageFacilityId
        );
        const monthlyBonus = monthlyBonusBreakdown.reduce(
          (prev, bonusItem) => bonusItem.bonusAmount + prev,

          0
        );

        return {
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: employee.fullName,
          locationPaycorNumber: employeeFacility.storageFacility.paycorNumber,
          locationAbbreviation:
            employeeFacility.storageFacility.facilityAbbreviation,
          locationName: employeeFacility.storageFacility.facilityName,
          monthlyBonus,
          monthlyBonusBreakdown,
          mileageDollars,
          commission: storage,
          unpaidCommission,
          unpaidCommissionCount: unpaidCommission.length,
          rentals: filteredRentals,
          vacationHours: vacation,
          holidayHours: holiday,
          christmasBonus: 0, // Assuming no christmas bonus in this context
          // Include the current payroll ID for the action
          currentPayrollId: payrollId,
          // Include employee and facility IDs for the action
          employeeId: employeeFacility.userId,
          facilityId: employeeFacility.storageFacilityId,
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
      item.locationPaycorNumber,
      ,
      ,
      item.holidayHours,
      item.vacationHours,
      ,
      ,
      item.monthlyBonus,
      item.commission,
      item.mileageDollars,
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
