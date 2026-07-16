import { NextRequest, NextResponse } from "next/server";
import { refreshMonthlyOccupancySnapshot } from "@/lib/controllers/dailyOccupancyController/getMonthlyOccupancy";

// monthly_occupancy_snapshot's refresh uses CONCURRENTLY and is quick, but
// give the route a little headroom so a slow refresh can't be killed mid-run.
export const maxDuration = 60;

// Vercel Cron calls this route with `Authorization: Bearer ${CRON_SECRET}`
// automatically when a `crons` entry is configured in vercel.json and the
// CRON_SECRET env var is set in the Vercel project settings. Refuse if the
// secret isn't configured so this can't be hit with no auth at all.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// GET /api/cron/refresh-views
//
// Refreshes the monthly_occupancy_snapshot materialized view once a day (see
// vercel.json's `crons` entry). Vercel's Hobby plan only allows cron jobs to
// run once per day, and once-daily is plenty for monthly occupancy data.
//
// This used to also refresh logon_with_facility_user_view. That view has been
// retired (migration 0049): the "latest logons" widget it fed now reads the
// base tables directly (see getLatestLogonsForFacility), so there is nothing
// to refresh -- the data is always current -- and none of the old refresh /
// concurrent-refresh / hourly-cron machinery is needed anymore.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, { success: boolean; error?: string }> = {};

  try {
    await refreshMonthlyOccupancySnapshot();
    results.monthlyOccupancySnapshot = { success: true };
  } catch (e) {
    results.monthlyOccupancySnapshot = {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const allSucceeded = Object.values(results).every((r) => r.success);
  return NextResponse.json({ results }, { status: allSucceeded ? 200 : 500 });
}
