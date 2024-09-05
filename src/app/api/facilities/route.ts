import {
  createFacility,
  getFacilities,
} from "@/lib/controllers/facilityController";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";

export async function POST(req: NextRequest) {
  return createFacility(req);
}

export async function GET() {
  // const userId = headers().get("userId");
  //console.log(userId);

  const response = await db.query.storageFacilities.findMany();

  return NextResponse.json(response || "EMPTY");
  //return getFacilities(userId || "");
}
