import {
  createFacility,
  getFacilities,
} from "@/lib/controllers/facilityController";
import { NextRequest } from "next/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  return createFacility(req);
}

export async function GET() {
  const userId = headers().get("userId");
  //console.log(userId);
  return getFacilities(userId || "");
}
