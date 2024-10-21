import {
  createFacility,
  getFacilities,
} from "@/lib/controllers/facilityController";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { tenantActivities } from "@/db/schema";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("🚀 ~ POST ~ body:", body);
  const employees = await db.query.userDetails.findMany({
    with: { usersToFacilities: { with: { storageFacility: true } } },
  });
  console.log("🚀 ~ POST ~ employees:", employees);

  const res = await db
    .insert(tenantActivities)
    .values(body)
    .onConflictDoNothing();

  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ data: "This is a Get" });
}
