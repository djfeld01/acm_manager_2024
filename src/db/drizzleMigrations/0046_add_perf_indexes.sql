-- Performance pass (2026-07-15): add missing indexes on columns that are
-- filtered on every request or every payroll run, but had no index to
-- support that filter.
--
--  * tenant_activity.pay_period_id / facility_id — the payroll query filters
--    tenant_activity by pay_period_id, and the facility/dashboard detail
--    queries filter by facility_id + date range. Neither had an index, so
--    both ran as sequential scans over the whole move-in/move-out history.
--  * user_to_facilities.user_id — this table's primary key is
--    (storage_facility_id, user_id), so a lookup filtered only by user_id
--    (the nav sidebar/header facility list, run on every page load; the
--    payroll facility lookup) can't use that composite index efficiently.
--
-- IF NOT EXISTS is used defensively so this migration is safe to re-run.
CREATE INDEX IF NOT EXISTS "tenant_activity_pay_period_id_index" ON "tenant_activity" USING btree ("pay_period_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_activity_facility_id_index" ON "tenant_activity" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_to_facilities_user_id_index" ON "user_to_facilities" USING btree ("user_id");
