"use server";

import { db } from "@/db";
import {
  dailyManagementActivity,
  dailyManagementOccupancy,
  dailyManagementReceivable,
  dailyManagementPaymentReceipt,
  storageFacilities,
  tenantActivities,
  usersToFacilities,
} from "@/db/schema";
import { and, eq, gte, inArray, sql, desc, count, lte, sum } from "drizzle-orm";
import { date } from "drizzle-orm/pg-core";
import { NextRequest, NextResponse } from "next/server";
import { parseLocalDate } from "../utils";
import logonWithFacilityUserView from "@/db/schema/views/logonWithFacityUserView";

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

export async function getLocationDetailData(sitelinkId: string) {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const sevenDaysAgoStr = toDateStr(sevenDaysAgo);
  const thirtyDaysAgoStr = toDateStr(thirtyDaysAgo);

  const [
    facility,
    latestOccupancyArr,
    sevenDayOccupancyArr,
    thirtyDayOccupancyArr,
    latestActivityDateArr,
    latestReceivableDateArr,
    latestLogons,
    thisMonthsRentals,
    latestPaymentDateArr,
  ] = await Promise.all([
    db.query.storageFacilities.findFirst({
      where: (sf, { eq }) => eq(sf.sitelinkId, sitelinkId),
      with: {
        monthlyGoals: {
          where: (mg, { eq }) => eq(mg.month, firstOfMonth),
        },
      },
    }),
    db
      .select()
      .from(dailyManagementOccupancy)
      .where(eq(dailyManagementOccupancy.facilityId, sitelinkId))
      .orderBy(desc(dailyManagementOccupancy.date))
      .limit(1),
    db
      .select()
      .from(dailyManagementOccupancy)
      .where(
        and(
          eq(dailyManagementOccupancy.facilityId, sitelinkId),
          eq(dailyManagementOccupancy.date, sevenDaysAgoStr)
        )
      )
      .limit(1),
    db
      .select()
      .from(dailyManagementOccupancy)
      .where(
        and(
          eq(dailyManagementOccupancy.facilityId, sitelinkId),
          eq(dailyManagementOccupancy.date, thirtyDaysAgoStr)
        )
      )
      .limit(1),
    db
      .select({ date: dailyManagementActivity.date })
      .from(dailyManagementActivity)
      .where(eq(dailyManagementActivity.facilityId, sitelinkId))
      .orderBy(desc(dailyManagementActivity.date))
      .limit(1),
    db
      .select({ date: dailyManagementReceivable.date })
      .from(dailyManagementReceivable)
      .where(eq(dailyManagementReceivable.facilityId, sitelinkId))
      .orderBy(desc(dailyManagementReceivable.date))
      .limit(1),
    db
      .select()
      .from(logonWithFacilityUserView)
      .where(eq(logonWithFacilityUserView.storageFacilityId, sitelinkId))
      .orderBy(desc(logonWithFacilityUserView.logonDate))
      .limit(8),
    db
      .select({ total: count() })
      .from(tenantActivities)
      .where(
        and(
          eq(tenantActivities.facilityId, sitelinkId),
          eq(tenantActivities.activityType, "MoveIn"),
          gte(tenantActivities.date, firstOfMonth),
          lte(tenantActivities.date, today)
        )
      ),
    // Latest date with payment receipt data (for MTD collections)
    db
      .select({ date: dailyManagementPaymentReceipt.date })
      .from(dailyManagementPaymentReceipt)
      .where(eq(dailyManagementPaymentReceipt.facilityId, sitelinkId))
      .orderBy(desc(dailyManagementPaymentReceipt.date))
      .limit(1),
  ]);

  const latestActivityDate = latestActivityDateArr[0]?.date;
  const latestReceivableDate = latestReceivableDateArr[0]?.date;
  const latestPaymentDate = latestPaymentDateArr[0]?.date ?? null;

  const [activityData, receivableData, mtdCollectionsArr] = await Promise.all([
    latestActivityDate
      ? db
          .select()
          .from(dailyManagementActivity)
          .where(
            and(
              eq(dailyManagementActivity.facilityId, sitelinkId),
              eq(dailyManagementActivity.date, latestActivityDate)
            )
          )
          .orderBy(dailyManagementActivity.sortId)
      : Promise.resolve([]),
    latestReceivableDate
      ? db
          .select()
          .from(dailyManagementReceivable)
          .where(
            and(
              eq(dailyManagementReceivable.facilityId, sitelinkId),
              eq(dailyManagementReceivable.date, latestReceivableDate)
            )
          )
          .orderBy(dailyManagementReceivable.lowerDayRange)
      : Promise.resolve([]),
    // Sum all MTD payment receipt rows for the latest date
    latestPaymentDate
      ? db
          .select({ total: sum(dailyManagementPaymentReceipt.monthlyAmount) })
          .from(dailyManagementPaymentReceipt)
          .where(
            and(
              eq(dailyManagementPaymentReceipt.facilityId, sitelinkId),
              eq(dailyManagementPaymentReceipt.date, latestPaymentDate)
            )
          )
      : Promise.resolve([{ total: null }]),
  ]);

  const goal = facility?.monthlyGoals?.[0];
  const mtdCollections = parseFloat(mtdCollectionsArr[0]?.total ?? "0");

  return {
    facility,
    latestOccupancy: latestOccupancyArr[0] ?? null,
    sevenDayOccupancy: sevenDayOccupancyArr[0] ?? null,
    thirtyDayOccupancy: thirtyDayOccupancyArr[0] ?? null,
    activityData,
    latestActivityDate,
    receivableData,
    latestReceivableDate,
    latestLogons,
    monthlyRentals: thisMonthsRentals[0]?.total ?? 0,
    rentalGoal: goal?.rentalGoal ?? 0,
    collectionsGoal: parseFloat(goal?.collectionsGoal ?? "0"),
    retailGoal: parseFloat(goal?.retailGoal ?? "0"),
    mtdCollections,
    mtdCollectionsDate: latestPaymentDate,
  };
}

export async function getFacilityPageData(sitelinkId: string) {
  const date = new Date();
  const goalsDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const sevenDaysAgoString = sevenDaysAgo.toDateString();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoString = thirtyDaysAgo.toDateString();
  const thisMonthsRentals = await db
    .select({ monthlyRentals: count() })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        eq(tenantActivities.activityType, "MoveIn"),
        lte(tenantActivities.date, today),
        gte(tenantActivities.date, goalsDate)
      )
    )
    .limit(1);

  const latestOccupancy = await db.query.dailyManagementOccupancy.findFirst({
    where: (dailyManagementOccupancy, { eq }) =>
      eq(dailyManagementOccupancy.facilityId, sitelinkId),
  });

  const facilityData = await db.query.storageFacilities.findFirst({
    where: (storageFacilities, { eq }) =>
      eq(storageFacilities.sitelinkId, sitelinkId),
    with: {
      monthlyGoals: {
        where: (monthlyGoals, { eq }) => eq(monthlyGoals.month, goalsDate),
      },
      dailyManagementOccupancy: {
        where: (dailyManagementOccupancy, { eq, or }) =>
          or(
            eq(dailyManagementOccupancy.date, sevenDaysAgoString),
            eq(dailyManagementOccupancy.date, thirtyDaysAgoString)
          ),
      },
    },
  });

  const latestLogons = await db
    .select()
    .from(logonWithFacilityUserView)
    .where(eq(logonWithFacilityUserView.storageFacilityId, sitelinkId))
    .orderBy(desc(logonWithFacilityUserView.logonDate))
    .limit(10);
  const formattedLatestLogons = latestLogons.map((logon) => {
    const correctedDate = parseLocalDate(logon.logonDate.toISOString());
    return { ...logon, logonDate: correctedDate };
  });

  const historicOccupancies = facilityData?.dailyManagementOccupancy || [];
  const occupancies = [latestOccupancy, ...historicOccupancies];
  const monthlyRentals = thisMonthsRentals[0].monthlyRentals;
  const rentalGoal = facilityData?.monthlyGoals[0]?.rentalGoal || 0;
  return {
    facility: facilityData,
    monthlyRentals,
    rentalGoal,
    occupancies,
    latestLogons: formattedLatestLogons,
  };
}
