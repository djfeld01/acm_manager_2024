import {
  createFacility,
  getFacilities,
} from "@/lib/controllers/facilityController";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";

export async function POST(req: NextRequest) {
  return NextResponse.json({ data: "This is a Post" });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ data: "This is a Get" });
}
