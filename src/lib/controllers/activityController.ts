"use server";
import { db } from "@/db";
import monthlyGoals, { CreateMonthlyGoals } from "@/db/schema/monthlyGoals";

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
