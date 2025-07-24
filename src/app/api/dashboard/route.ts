import { getDashboardData } from "@/lib/controllers/manSumController";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's facility access
    const userFacilities = session.user.facilities || [];
    const isAdmin = session.user.role === "ADMIN";
    
    // Admins see all facilities, others only see their assigned facilities
    const facilityIds = isAdmin ? undefined : userFacilities.map(f => f.sitelinkId);
    
    const { response } = await getDashboardData(undefined, facilityIds);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
