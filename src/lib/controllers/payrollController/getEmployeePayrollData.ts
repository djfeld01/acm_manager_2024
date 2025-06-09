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
  mileage,
  payPeriod,
  sitelinkLogons,
  storageFacilities,
  tenantActivities,
  userDetails,
  usersToFacilities,
  vacation,
} from "@/db/schema";
import { eq, sql, and, isNull, gte, lte, not } from "drizzle-orm";

export async function getEmployeePayrollData(payrollNumber?: string) {
  try {
    const sitelinkId = "67";
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
    if (!endDate) {
      throw new Error("No End Date");
    }
    const nextPayPeriod = nextPayPeriodArray[0];
    const loginsSubquery = db
      .select({
        employeeId: userDetails.id,
        logins: sql`ARRAY_AGG(JSON_BUILD_OBJECT(
            'dateTime', ${sitelinkLogons.dateTime},
            'computerName', ${sitelinkLogons.computerName},
            'computerIP', ${sitelinkLogons.computerIP}
    ))`.as("logins"),
      })
      .from(sitelinkLogons)
      .innerJoin(
        usersToFacilities,
        eq(
          sitelinkLogons.sitelinkEmployeeId,
          usersToFacilities.sitelinkEmployeeId
        )
      )
      .innerJoin(userDetails, eq(usersToFacilities.userId, userDetails.id))
      .where(
        and(
          eq(usersToFacilities.storageFacilityId, sitelinkId),
          gte(sitelinkLogons.dateTime, new Date(`${startDate}T00:00:00-05:00`)),
          lte(sitelinkLogons.dateTime, new Date(`${endDate}T11:59:59-05:00`))
        )
      )
      .groupBy(userDetails.id)
      .as("logins_subquery");

    // Subquery: Aggregate activities for each employee
    const activitiesSubquery = db
      .select({
        employeeId: userDetails.id,
        activities: sql`ARRAY_AGG(JSON_BUILD_OBJECT(
           'activityType', ${tenantActivities.activityType},
           'activityId',${tenantActivities.Id},
           'date', ${tenantActivities.date},
           'tenantName', ${tenantActivities.tenantName},
           'unitName', ${tenantActivities.unitName},
           'hasInsurance', ${tenantActivities.hasInsurance},
            'payPeriodId', ${tenantActivities.payPeriodId}
    ))`.as("activities"),
      })
      .from(tenantActivities)
      .fullJoin(userDetails, eq(tenantActivities.employeeId, userDetails.id))
      .where(
        and(
          eq(tenantActivities.activityType, "MoveIn"),
          eq(tenantActivities.commisionHasBeenPaid, false),
          eq(tenantActivities.facilityId, sitelinkId),
          isNull(tenantActivities.payPeriodId)
        )
      )
      .groupBy(userDetails.id)
      .as("activities_subquery");

    const committedActivitiesSubquery = db
      .select({
        employeeId: userDetails.id,
        activities: sql`ARRAY_AGG(JSON_BUILD_OBJECT(
            'activityType', ${tenantActivities.activityType},
            'activityId',${tenantActivities.Id},
            'date', ${tenantActivities.date},
            'tenantName', ${tenantActivities.tenantName},
            'unitName', ${tenantActivities.unitName},
            'hasInsurance', ${tenantActivities.hasInsurance},
            'payPeriodId', ${tenantActivities.payPeriodId}
    ))`.as("committed_activities"),
      })
      .from(tenantActivities)
      .fullJoin(userDetails, eq(tenantActivities.employeeId, userDetails.id))
      .where(
        and(
          eq(tenantActivities.activityType, "MoveIn"),
          eq(tenantActivities.payPeriodId, nextPayPeriod.payPeriodId),
          eq(tenantActivities.facilityId, sitelinkId)
        )
      )
      .groupBy(userDetails.id)
      .as("committed_activities_subquery");

    const vacationSubquery = db
      .select({
        employeeId: userDetails.id,
        vacationUsage: sql`ARRAY_AGG(JSON_BUILD_OBJECT(
            'vacationId', ${vacation.vacationId},
            'vacationHours',${vacation.vacationHours},
            'date', ${vacation.date},
            'employeeId', ${vacation.employeeId},
            'vacationNote', ${vacation.vacationNote},
            'payPeriodId', ${vacation.payPeriodId}
  ))`.as("vacation_usage"),
      })
      .from(vacation)
      .fullJoin(userDetails, eq(vacation.employeeId, userDetails.id))
      .where(
        and(
          eq(vacation.payPeriodId, nextPayPeriod.payPeriodId),
          eq(vacation.facilityId, sitelinkId)
        )
      )
      .groupBy(userDetails.id)
      .as("vacation_subquery");

    const mileageSubquery = db
      .select({
        employeeId: userDetails.id,
        mileageUsage: sql`ARRAY_AGG(JSON_BUILD_OBJECT(
            'mileageId', ${mileage.mileageId},
            'mileage',${mileage.mileage},
            'mileageRate',${mileage.mileageRate},
            'date', ${mileage.date},
            'employeeId', ${mileage.employeeId},
            'mileageNote', ${mileage.mileageNote},
            'payPeriodId', ${mileage.payPeriodId}
    ))`.as("mileage_usage"),
      })
      .from(mileage)
      .fullJoin(userDetails, eq(mileage.employeeId, userDetails.id))
      .where(
        and(
          eq(mileage.payPeriodId, nextPayPeriod.payPeriodId),
          eq(mileage.facilityId, sitelinkId)
        )
      )
      .groupBy(userDetails.id)
      .as("mileage_subquery");

    const bonusSubquery = db
      .select({
        employeeId: userDetails.id,
        bonuses: sql`ARRAY_AGG(JSON_BUILD_OBJECT(
            'mileageId', ${bonus.bonusId},
            'date', ${bonus.date},
            'employeeId', ${bonus.employeeId},
            'bonusNote', ${bonus.bonusNote},
            'payPeriodId', ${bonus.payPeriodId}
    ))`.as("bonus"),
      })
      .from(bonus)
      .fullJoin(userDetails, eq(bonus.employeeId, userDetails.id))
      .where(
        and(
          eq(bonus.payPeriodId, nextPayPeriod.payPeriodId),
          eq(bonus.facilityId, sitelinkId)
        )
      )
      .groupBy(userDetails.id)
      .as("bonus_subquery");
    // Main query: Combine employee data with logins and activities and committed activities
    const result = await db
      .select({
        userDetailsId: userDetails.id,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        fullName: userDetails.fullName,
        position: usersToFacilities.position,
        logins: loginsSubquery.logins,
        activities: activitiesSubquery.activities,
        committedActivities: committedActivitiesSubquery.activities,
        vacation: vacationSubquery.vacationUsage,
        mileage: mileageSubquery.mileageUsage,
        bonuses: bonusSubquery.bonuses,
      })
      .from(userDetails)
      .innerJoin(
        usersToFacilities,
        eq(userDetails.id, usersToFacilities.userId)
      )
      .leftJoin(loginsSubquery, eq(userDetails.id, loginsSubquery.employeeId))
      .leftJoin(
        activitiesSubquery,
        eq(userDetails.id, activitiesSubquery.employeeId)
      )
      .leftJoin(
        committedActivitiesSubquery,
        eq(userDetails.id, committedActivitiesSubquery.employeeId)
      )
      .leftJoin(
        vacationSubquery,
        eq(userDetails.id, vacationSubquery.employeeId)
      )
      .leftJoin(mileageSubquery, eq(userDetails.id, mileageSubquery.employeeId))
      .where(
        and(
          eq(usersToFacilities.storageFacilityId, sitelinkId),
          sql`${loginsSubquery.logins} IS NOT NULL AND ARRAY_LENGTH(${loginsSubquery.logins}, 1) > 0`,
          and(
            not(eq(usersToFacilities.position, "AREA_MANAGER")),
            not(eq(usersToFacilities.position, "ACM_OFFICE"))
          )
        )
      );

    const employees = result.map((item) => {
      const typedItem = {
        ...item,
        logins: item.logins as Logins[],
        activities: item.activities as Activity[],
        committedActivities: item.committedActivities as Activity[],
        vacation: item.vacation as Vacations[],
        mileage: item.mileage as Mileage[],
      };

      const sortedLogins = typedItem.logins.sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      );
      let sortedActivities = [] as Activity[];
      if (typedItem.activities) {
        sortedActivities = typedItem.activities.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }
      let sortedCommittedActivities = [] as Activity[];
      if (typedItem.committedActivities) {
        sortedCommittedActivities = typedItem.committedActivities.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      }
      return {
        ...typedItem,
        logins: sortedLogins,
        activities: sortedActivities,
        committedActivities: sortedCommittedActivities,
      };
    });

    const employeeList = employees.reduce<
      { userDetailId: string; firstName: string; lastName: string }[]
    >((prevList, employee) => {
      if (employee.firstName) {
        return [
          ...prevList,
          {
            userDetailId: employee.userDetailsId,
            firstName: employee.firstName,
            lastName: employee.lastName,
          },
        ];
      }
      return prevList;
    }, []);

    const results = await db.query.tenantActivities.findMany({
      where: (tenantActivities, { eq, and, isNull }) =>
        and(
          eq(tenantActivities.facilityId, sitelinkId),
          isNull(tenantActivities.employeeId),
          eq(tenantActivities.commisionHasBeenPaid, false),
          eq(tenantActivities.activityType, "MoveIn")
        ),
      columns: {
        activityType: true,
        date: true,
        Id: true,
        unitName: true,
        tenantName: true,
        hasInsurance: true,
        payPeriodId: true,
      },
    });
    const unlinkedActivities = results.map((item) => {
      return {
        ...item,
        date: item.date.toISOString(),
        activityId: item.Id,
        payPeriodId: item.payPeriodId ?? undefined,
      };
    });
    const unlinkedEntry = {
      activities: unlinkedActivities,
      committedActivities: [],
      logins: [],
      userDetailsId: "",
      vacation: [],
      firstName: "",
      lastName: "",
      fullName: null,
      position: null,
      mileage: [],
    };
    const finalEmployees = [...employees, unlinkedEntry];

    const { insuranceCommissionRate, storageCommissionRate } =
      (await db.query.storageFacilities.findFirst({
        where: (storageFacilities, { eq }) =>
          eq(storageFacilities.sitelinkId, sitelinkId),
        columns: { storageCommissionRate: true, insuranceCommissionRate: true },
      })) || { storageCommissionRate: 5, insuranceCommissionRate: 1.5 };

    return {
      nextPayPeriod,
      employees: finalEmployees,
      insuranceCommissionRate,
      storageCommissionRate,
      employeeList,
    };
  } catch (error) {
    console.error("Error fetching employee payroll data:", error);
    throw new Error("Failed to fetch employee payroll data");
  }
}
