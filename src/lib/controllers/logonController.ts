import { db } from "@/db";
import {
  sitelinkLogons,
  userDetails,
  storageFacilities,
  usersToFacilities,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Latest SiteLink logons for a single facility, read live from the base tables.
 *
 * This replaces the old logon_with_facility_user_view materialized view. The
 * view pre-joined sitelink_logon -> user_to_facilities -> user_detail ->
 * storage_facility into ~55k rows and had to be refreshed on a schedule; the
 * only thing that ever read it was the "latest logons" widget on the
 * location-detail and payroll/facility pages -- always the same shape:
 * newest N logons for one facility.
 *
 * That does not need a materialized view. sitelink_logon is filtered here by
 * facility via user_to_facilities (its sitelink_employee_id is UNIQUE, so each
 * employee maps to exactly one facility, and a facility has only a handful of
 * employees). Migration 0049 adds an index on
 * sitelink_logon(sitelink_employee_id, date_time) so the per-employee,
 * date-ordered lookup is an index seek. The result is always current -- no
 * refresh lag, no blocking REFRESH, no cron.
 *
 * The selected columns intentionally match the old view's output shape so
 * callers and downstream components are unaffected.
 */
export async function getLatestLogonsForFacility(
  sitelinkId: string,
  limit: number
) {
  return db
    .select({
      employeeId: sitelinkLogons.sitelinkEmployeeId,
      logonDate: sitelinkLogons.dateTime,
      computerName: sitelinkLogons.computerName,
      computerIP: sitelinkLogons.computerIP,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      storageFacilityId: usersToFacilities.storageFacilityId,
      userId: usersToFacilities.userId,
    })
    .from(sitelinkLogons)
    .innerJoin(
      usersToFacilities,
      eq(sitelinkLogons.sitelinkEmployeeId, usersToFacilities.sitelinkEmployeeId)
    )
    .innerJoin(userDetails, eq(usersToFacilities.userId, userDetails.id))
    .innerJoin(
      storageFacilities,
      eq(usersToFacilities.storageFacilityId, storageFacilities.sitelinkId)
    )
    .where(eq(usersToFacilities.storageFacilityId, sitelinkId))
    .orderBy(desc(sitelinkLogons.dateTime))
    .limit(limit);
}
