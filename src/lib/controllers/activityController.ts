"use server";
import EmployeeActivityData from "@/components/EmployeeActivityData";
import {
  Activity,
  Logins,
  Mileage,
  Vacations,
} from "@/components/EmployeeComissionComponent";
import { db } from "@/db";
import {
  mileage,
  payPeriod,
  sitelinkLogons,
  storageFacilities,
  tenantActivities,
  userDetails,
  userDetailsRelations,
  userRelations,
  usersToFacilities,
  vacation,
} from "@/db/schema";
import monthlyGoals, { CreateMonthlyGoals } from "@/db/schema/monthlyGoals";
import { Item } from "@radix-ui/react-dropdown-menu";

import {
  count,
  sql,
  eq,
  lte,
  and,
  gte,
  desc,
  asc,
  inArray,
  or,
  not,
  isNull,
} from "drizzle-orm";

enum ActivityType {
  MoveIn = "MoveIn",
  MoveOut = "MoveOut",
  Transfer = "Transfer",
}

export async function getActivitiesByDates(
  loggedInUserId: string,
  startDate: Date,
  endDate: Date
) {
  const userDetail = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, loggedInUserId),
  });
  const userDetailId = userDetail?.userDetailId || "";
  const queryResults = await db.query.usersToFacilities.findMany({
    where: (userRelation, { eq }) => eq(userRelation.userId, userDetailId),
    with: {
      storageFacility: {
        with: {
          tenantActivities: {
            where: (tenantActivity, { lte, eq, gte, and }) =>
              and(
                eq(tenantActivity.activityType, "MoveIn"),
                lte(tenantActivity.date, endDate),
                gte(tenantActivity.date, startDate)
              ),
          },
        },
      },
    },
  });
  const res = queryResults.map((result) => ({
    ...result,
    totalRentals: result.storageFacility.tenantActivities.length,
  }));
  return res;
}

export async function getActivitiesByEmployee() {}

export async function insertMonthlyGoals(values: CreateMonthlyGoals) {
  return await db.insert(monthlyGoals).values(values).returning();
}

export async function getActivitiesByMonth2(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const userDetail = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });
  const userDetailId = userDetail?.userDetailId || "";
  const result = await db
    .select({
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      facilityName: storageFacilities.facilityName,
      facilityId: storageFacilities.sitelinkId,
      activityType: tenantActivities.activityType,
      total: count(),
      month: sql<number>`EXTRACT (MONTH from ${tenantActivities.date})`,
      year: sql<number>`EXTRACT (YEAR from ${tenantActivities.date})`,
    })
    .from(tenantActivities)
    .fullJoin(
      storageFacilities,
      eq(tenantActivities.facilityId, storageFacilities.sitelinkId)
    )
    .innerJoin(
      usersToFacilities,
      eq(usersToFacilities.storageFacilityId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        lte(tenantActivities.date, endDate || new Date("2500-01-01")),
        gte(tenantActivities.date, startDate || new Date("1900-01-01")),
        eq(usersToFacilities.userId, userDetailId)
      )
    )
    .groupBy(
      storageFacilities.facilityAbbreviation,
      storageFacilities.facilityName,
      storageFacilities.sitelinkId,
      tenantActivities.activityType,
      sql<number>`EXTRACT (YEAR from ${tenantActivities.date})`,
      sql<number>`EXTRACT (MONTH from ${tenantActivities.date})`
    )
    .orderBy(
      storageFacilities.facilityAbbreviation,
      tenantActivities.activityType,
      sql<number>`EXTRACT (YEAR from ${tenantActivities.date})`,
      sql<number>`EXTRACT(MONTH from ${tenantActivities.date})`
    );

  // const formattedResult = result.reduce<FacilityNameGroup>((acc, curr,index) => {
  //   const facilityName = curr.facilityName || "";
  //   const activityType = curr.activityType || "MoveIn";
  //   const month = curr.month || "";

  //   // Ensure facility group exists
  //   const facilityIndex=acc.find((facility)=>facility)
  //   if (!acc[facilityName]) {
  //     acc[facilityName] = {} as ActivityTypeGroup;
  //   }

  //   // Ensure activityType group exists within facility
  //   if (!acc[facilityName][activityType]) {
  //     acc[facilityName][activityType] = {};
  //   }

  //   // Ensure month group exists within activityType
  //   if (!acc[facilityName][activityType][month]) {
  //     acc[facilityName][activityType][month] = curr.total;
  //   }

  //   return acc;
  // }, []);

  // console.log(JSON.stringify(formattedResult, null, 4));

  return result;
}

export async function getUnpaidActivitiesByEmployee(sitelinkId: string) {
  const nextPayPeriodArray = await db
    .select()
    .from(payPeriod)
    .where(gte(payPeriod.processingDate, new Date().toDateString()))
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
    })
    .from(userDetails)
    .innerJoin(usersToFacilities, eq(userDetails.id, usersToFacilities.userId))
    .leftJoin(loginsSubquery, eq(userDetails.id, loginsSubquery.employeeId))
    .leftJoin(
      activitiesSubquery,
      eq(userDetails.id, activitiesSubquery.employeeId)
    )
    .leftJoin(
      committedActivitiesSubquery,
      eq(userDetails.id, committedActivitiesSubquery.employeeId)
    )
    .leftJoin(vacationSubquery, eq(userDetails.id, vacationSubquery.employeeId))
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
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
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
    unlinkedActivities,
  };
}

export async function markActivitiesAsPaid(activitiesArray: number[]) {
  const updatedArray = await db
    .update(tenantActivities)
    .set({ commisionHasBeenPaid: true })
    .where(inArray(tenantActivities.Id, activitiesArray))
    .returning({ ids: tenantActivities.Id });

  return updatedArray;
}

export async function commitActivityCommissionToPayroll(
  activitiesArray: number[],
  payPeriodId: string
) {
  const updatedArray = await db
    .update(tenantActivities)
    .set({ payPeriodId: payPeriodId })
    .where(inArray(tenantActivities.Id, activitiesArray))
    .returning({ ids: tenantActivities.Id });

  return updatedArray;
}

export async function uncommitActivityFromPayroll(activitiesArray: number[]) {
  const updatedArray = await db
    .update(tenantActivities)
    .set({ payPeriodId: null, commisionHasBeenPaid: false })
    .where(inArray(tenantActivities.Id, activitiesArray))
    .returning({ ids: tenantActivities.Id });
  return updatedArray;
}

export async function updateActivityUser(activityUpdate: {
  activityId: number;
  userDetailId: string;
}) {
  const { activityId, userDetailId } = activityUpdate;
  if (!activityId || !userDetailId) {
    throw Error(`The data wasn't formed correctly`);
  }
  const updatedData = await db
    .update(tenantActivities)
    .set({ employeeId: userDetailId })
    .where(eq(tenantActivities.Id, activityId))
    .returning({ Ids: tenantActivities.Id });
  return updatedData;
}
