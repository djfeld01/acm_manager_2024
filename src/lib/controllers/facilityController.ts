"use server";

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

export async function getAllFacilities() {
  const facilities = await db.query.storageFacilities.findMany({
    columns: { sitelinkId: true, facilityAbbreviation: true },
  });
  return facilities;
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
                gt(tenantActivity.date, new Date("2024-01-01")),
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

  return res;
}

export async function getFacilityConnections(userId: string) {
  const res = await db.query.usersToFacilities.findMany({
    where: (userRelation, { eq }) => eq(userRelation.userId, userId),
    columns: {},
    with: {
      storageFacility: {
        columns: {
          facilityAbbreviation: true,
          facilityName: true,
          sitelinkId: true,
          currentClient: true,
        },
      },
    },
  });
  const result = res
    .filter((facility) => facility.storageFacility.currentClient)
    .map((facility) => facility.storageFacility);

  return result;
}

export async function connectUserToFacilities(userId: string) {
  const res = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });
}

export async function getConnectedFacilities(userDetailId: string) {
  return await db.query.usersToFacilities.findMany({
    where: eq(usersToFacilities.userId, userDetailId),
  });
}
