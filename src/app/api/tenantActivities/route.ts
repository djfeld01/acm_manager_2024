import {
  createFacility,
  getFacilities,
} from "@/lib/controllers/facilityController";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { tenantActivities } from "@/db/schema";

export type TenantActivityType = {
  facilityId: string;
  date: Date;
  activityType: "MoveIn" | "MoveOut" | "Transfer";
  tenantName: string;
  unitName: string;
  unitWidth: number;
  unitLength: number;
  unitSize: number;
  unitType: string;
  unitArea: number;
  moveInRentalRate: number;
  moveInVariance: number;
  tenantSitelinkId: number;
  tenantAddress: string;
  tenantCity: string;
  tenantState: string;
  tenantZipCode: string;
  tenantEmail: string;
  moveInDiscountPlan: string;
  moveOutDaysRented?: number;
  employeeInitials: string;
  hasInsurance: boolean;
  insuranceAmount: string;
  leadSource: string;
}[];

export async function POST(req: NextRequest) {
  const body: TenantActivityType = await req.json();
  const locationsWithEmployees = await db.query.storageFacilities.findMany({
    with: { usersToFacilities: { with: { user: true } } },
  });

  const toInsert = body.map((activity) => {
    const userId = locationsWithEmployees
      .find((location) => location.sitelinkId == activity.facilityId)
      ?.usersToFacilities.find(
        (userToFacility) =>
          userToFacility.user.initials === activity.employeeInitials
      )?.userId;
    let updatedActivity = {
      ...activity,
      date: new Date(activity.date),
      employeeId: userId,
      unitWidth: String(activity.unitWidth),
      unitLength: String(activity.unitLength),
      unitSize: String(activity.unitSize),
      unitArea: String(activity.unitArea),
      moveInRentalRate: String(activity.moveInRentalRate),
      moveInVariance: String(activity.moveInVariance),
    };
    if (activity.hasInsurance) {
      updatedActivity = {
        ...updatedActivity,
        insuranceAmount: String(activity.insuranceAmount),
      };
    }
    return updatedActivity;
  });

  const res = await db
    .insert(tenantActivities)
    .values(toInsert)
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ data: "This is a Get" });
}
