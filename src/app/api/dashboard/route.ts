import { getDashboardData } from "@/lib/controllers/manSumController";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { unstable_cache } from "next/cache";

export const maxDuration = 30;

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFacilities = session.user.facilities || [];
    const isAdmin = session.user.role === "ADMIN";
    const facilityIds = isAdmin
      ? undefined
      : userFacilities.map((f) => f.sitelinkId);

    const cacheKey = isAdmin ? "all" : (facilityIds ?? []).join(",");
    const getCached = unstable_cache(
      () => getDashboardData(undefined, facilityIds),
      [`dashboard-${cacheKey}`],
      { revalidate: 1800 }
    );

    const { response, lastUpdated } = await getCached();
    return NextResponse.json({ response, lastUpdated });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
