import { db } from "@/db";
import logonWithFacilityUserView from "@/db/schema/views/logonWithFacityUserView";

/**
 * Refresh the logon_with_facility_user_view materialized view.
 *
 * Uses CONCURRENTLY so readers (the "last logon" widgets on every location
 * page) are never blocked during the refresh. That requires a unique index
 * on the view, added in migration 0048 on (sitelink_employee_id, date_time).
 * That pair is guaranteed unique in the view's output:
 *   - sitelink_logon's own primary key is (date_time, sitelink_employee_id),
 *     so each source row is already unique on this pair.
 *   - every join the view performs is 1:1, not fan-out: user_to_facilities
 *     has a UNIQUE constraint on sitelink_employee_id, and both
 *     user_detail.id and storage_facility.sitelink_id are primary keys.
 * So no sitelink_logon row can produce more than one output row.
 *
 * Previously this ran inline inside /api/sitelinkLogons on every sync call
 * (roughly hourly all day) WITHOUT concurrently(), which fully locked the
 * view for reads for up to 79s each time -- a major contributor to the
 * 2026-07-16 outage. It now runs on a schedule instead -- see
 * /api/cron/refresh-views.
 */
export async function refreshLogonWithFacilityUserView(): Promise<void> {
  await db.refreshMaterializedView(logonWithFacilityUserView).concurrently();
}
