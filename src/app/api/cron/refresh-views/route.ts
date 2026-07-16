import { NextRequest, NextResponse } from "next/server";
import { refreshMonthlyOccupancySnapshot } from "@/lib/controllers/dailyOccupancyController/getMonthlyOccupancy";
import { refreshLogonWithFacilityUserView } from "@/lib/controllers/logonController";

// The logon_with_facility_user_view refresh alone has been observed taking
// up to ~79s. Give this route enough headroom to run both refreshes
// sequentially without timing out. (Requires a Vercel plan that allows
// serverless functions to run this long -- Pro does.)
export const maxDuration = 120;

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
// Refreshes both dashboard-supporting materialized views on a schedule
// (see vercel.json's `crons` entry -- hourly by default, matching how often
// the sync endpoints that used to trigger these refreshes inline were
// actually being hit) instead of inline inside the sitelinkLogons and
// sitelinkManagementDaily/occupancy sync routes.
//
// Why this moved: those two routes were firing these refreshes on every
// sync call, roughly hourly all day, at whatever moment SiteLink happened
// to call them -- often during business hours. The logon view refresh in
// particular ran without CONCURRENTLY, fully locking the view for reads for
// up to 79s each time. Running both refreshes here, off the request path,
// on a schedule, means:
//   - sync routes no longer pay the refresh cost as part of their own
//     response time
//   - the (still-locking, see below) logon view refresh happens on a
//     predictable schedule rather than whenever a sync call happens to land
//   - monthly_occupancy_snapshot's refresh already uses CONCURRENTLY and
//     already never blocked readers; moving it here is purely about not
//     doing unnecessary work inline in a hot request path
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

  try {
    await refreshLogonWithFacilityUserView();
    results.logonWithFacilityUserView = { success: true };
  } catch (e) {
    results.logonWithFacilityUserView = {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const allSucceeded = Object.values(results).every((r) => r.success);
  return NextResponse.json({ results }, { status: allSucceeded ? 200 : 500 });
}
