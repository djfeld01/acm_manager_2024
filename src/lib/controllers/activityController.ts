"use server";
import { db } from "@/db";
import { storageFacilities, tenantActivities } from "@/db/schema";
import monthlyGoals, { CreateMonthlyGoals } from "@/db/schema/monthlyGoals";
import { userRelations } from "@/db/schema/user";
import { count, sql, eq, lte, and, gte } from "drizzle-orm";

enum ActivityType {
  MoveIn = "MoveIn",
  MoveOut = "MoveOut",
  Transfer = "Transfer",
}

export async function getActivitiesByDates(
  loggedInUserId: string,
  startDate: string,
  endDate: string,
  employeeInitials: string
) {
  const queryResults = await db.query.usersToFacilities.findMany({
    where: (userRelation, { eq }) => eq(userRelation.userId, loggedInUserId),
    with: {
      storageFacility: {
        with: {
          tenantActivities: {
            where: (tenantActivity, { lte, eq, gte, and }) =>
              and(
                eq(tenantActivity.employeeInitials, employeeInitials),
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

export async function getActivitiesByMonth(
  userId: string,
  startDate?: string,
  endDate?: string,
  activityType?: ActivityType
) {
  const result = await db.query.usersToFacilities.findMany({
    where: (userRelation, { eq }) => eq(userRelation.userId, userId),
    with: {
      storageFacility: {
        columns: {},
        with: {
          tenantActivities: {
            where: (tenantActivity, { lte, eq, gte, and }) =>
              and(
                lte(tenantActivity.date, endDate || "2500-01-01"),
                gte(tenantActivity.date, startDate || "1900-01-01"),
                eq(tenantActivity.activityType, activityType || "MoveIn")
              ),
          },
        },
      },
    },
  });
  console.log(result);
  return result;
}

export async function getActivitiesByMonth2(
  userId: string,
  startDate?: string,
  endDate?: string
) {
  const result = await db
    .select({
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      activityType: tenantActivities.activityType,
      total: count(),
      month: sql<number>`EXTRACT (MONTH from ${tenantActivities.date})`,
      year: sql<number>`EXTRACT (YEAR from ${tenantActivities.date})`,
    })
    .from(tenantActivities)
    .groupBy(
      storageFacilities.facilityAbbreviation,
      tenantActivities.activityType,
      sql<number>`EXTRACT (YEAR from ${tenantActivities.date})`,
      sql<number>`EXTRACT (MONTH from ${tenantActivities.date})`
    )
    .orderBy(
      storageFacilities.facilityAbbreviation,
      sql<number>`EXTRACT (YEAR from ${tenantActivities.date})`,
      sql<number>`EXTRACT(MONTH from ${tenantActivities.date})`,
      tenantActivities.activityType
    )
    .fullJoin(
      storageFacilities,
      eq(tenantActivities.facilityId, storageFacilities.sitelinkId)
    )
    .where(
      and(
        lte(tenantActivities.date, endDate || "2500-01-01"),
        gte(tenantActivities.date, startDate || "1900-01-01")
      )
    );
  //console.log(result);
  return result;
}
