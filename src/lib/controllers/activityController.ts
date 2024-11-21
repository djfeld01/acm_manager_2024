"use server";
import { Activity } from "@/components/EmployeeCard";
import { db } from "@/db";
import {
  storageFacilities,
  tenantActivities,
  userDetails,
  userDetailsRelations,
  userRelations,
  usersToFacilities,
} from "@/db/schema";
import monthlyGoals, { CreateMonthlyGoals } from "@/db/schema/monthlyGoals";

import { count, sql, eq, lte, and, gte } from "drizzle-orm";

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
  const getEmployees = await db
    .select({
      fullName: userDetails.fullName,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      userDetailsId: userDetails.id,
      position: usersToFacilities.position,
      rentals: count(),
      insurance:
        sql`CAST(SUM(CASE WHEN ${tenantActivities.hasInsurance} THEN 1 ELSE 0 END) AS INTEGER)`.as(
          "insurance"
        ),
      activities:
        sql`JSON_AGG(JSON_BUILD_OBJECT('activityType', ${tenantActivities.activityType},
      'date', ${tenantActivities.date},'unitName',${tenantActivities.unitName},
      'tenantName',${tenantActivities.tenantName},
      'activityId', ${tenantActivities.Id},
      'hasInsurance', ${tenantActivities.hasInsurance}))`.as("activities"),
    })
    .from(userDetails)
    .fullJoin(tenantActivities, eq(tenantActivities.employeeId, userDetails.id))
    .leftJoin(
      usersToFacilities,
      and(
        eq(usersToFacilities.userId, userDetails.id),
        eq(usersToFacilities.storageFacilityId, sitelinkId)
      )
    )
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        eq(tenantActivities.activityType, "MoveIn"),
        eq(tenantActivities.commisionHasBeenPaid, false)
      )
    )
    .groupBy(userDetails.id, usersToFacilities.position);

  const result = getEmployees.map((item) => {
    const typedItem = {
      ...item,
      insurance: item.insurance as number,
      activities: item.activities as Activity[],
    };

    const sortedActivities = typedItem.activities.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return { ...typedItem, activities: sortedActivities };
  });
  const { insuranceCommissionRate, storageCommissionRate } =
    (await db.query.storageFacilities.findFirst({
      where: (storageFacilities, { eq }) =>
        eq(storageFacilities.sitelinkId, sitelinkId),
      columns: { storageCommissionRate: true, insuranceCommissionRate: true },
    })) || { storageCommissionRate: 5, insuranceCommissionRate: 1.5 };
  const employees = result.map((employee) => {
    const commission =
      employee.position === "MANAGER"
        ? employee.insurance * insuranceCommissionRate
        : employee.insurance * insuranceCommissionRate +
          employee.rentals * storageCommissionRate;
    return { ...employee, commission };
  });
  return employees;
}
