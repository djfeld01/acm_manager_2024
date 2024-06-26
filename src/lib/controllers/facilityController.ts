import { db } from "@/db";
import {
  storageFacilities,
  tenantActivities,
  users,
  usersToFacilities,
  usersToFacilitiesRelations,
} from "@/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { date } from "drizzle-orm/pg-core";
import { NextRequest, NextResponse } from "next/server";

export async function createFacility(req: NextRequest) {
  const body = await req.json();
  const res = await db.insert(storageFacilities).values(body);

  return NextResponse.json(res);
}

export async function getFacilities(userId: string) {
  const queryResults = await db.query.usersToFacilities.findMany({
    where: (userRelation, { eq }) => eq(userRelation.userId, userId),
    with: {
      storageFacility: {
        columns: { facilityAbbreviation: true },
        with: {
          tenantActivities: {
            where: (tenantActivity, { and, eq, gt }) =>
              and(
                gt(tenantActivity.date, "2024-01-01"),
                eq(tenantActivity.activityType, "MoveIn")
              ),
            columns: {
              unitSize: true,
              unitType: true,
              employeeInitials: true,
            },
          },
        },
      },
    },
  });

  const res = queryResults.map((result) => ({
    ...result,
    totalRentals: result.storageFacility.tenantActivities.length,
  }));
  //console.log(res);
  // const res = await db.query.storageFacilities.findMany({
  //   where: (storageFacility, { eq }) => eq(storageFacility.state, "FL"),
  //   columns: {
  //     facilityAbbreviation: true,
  //     sitelinkSiteCode: true,
  //   },
  //   with: {
  //     tenantActivities: {
  //       where: (activities, { gt }) =>
  //         and(
  //           gt(activities.date, "2024-06-01"),
  //           eq(activities.activityType, "MoveIn")
  //         ),
  //       columns: {
  //         date: true,
  //         unitName: true,
  //         employeeInitials: true,
  //       },
  //     },
  //   },
  // });
  return res;
}

export async function getFacilityConnections(userId: string) {
  const res = db.query.usersToFacilities.findMany({
    where: (userRelation, { eq }) => eq(userRelation.userId, userId),
    with: {
      storageFacility: {
        columns: { facilityAbbreviation: true },
      },
    },
  });
  return res;
}
