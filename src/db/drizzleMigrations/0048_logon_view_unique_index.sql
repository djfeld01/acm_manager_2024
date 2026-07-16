-- Perf/reliability follow-up (2026-07-16, perf/database-investigation branch):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY requires at least one unique index
-- on the view. logon_with_facility_user_view had none (migration 0047 only
-- added a non-unique index on storage_facility_id, for read performance),
-- so refreshing it was always a full blocking rebuild -- observed today
-- taking up to 79s, during which the view was fully locked against readers.
-- That was a major contributor to today's outage.
--
-- The view is safe to index uniquely on (sitelink_employee_id, date_time):
--   - sitelink_logon's own primary key is (date_time, sitelink_employee_id),
--     so each source row is already unique on this pair.
--   - Every join the view performs is 1:1, not fan-out: user_to_facilities
--     has a UNIQUE constraint on sitelink_employee_id, and both
--     user_detail.id and storage_facility.sitelink_id are primary keys.
-- So no sitelink_logon row can produce more than one output row, and
-- (sitelink_employee_id, date_time) is guaranteed unique in the view.
--
-- IF NOT EXISTS is used defensively so this migration is safe to re-run.
CREATE UNIQUE INDEX IF NOT EXISTS "logon_with_facility_user_view_employee_date_idx"
  ON "logon_with_facility_user_view" USING btree ("sitelink_employee_id", "date_time");
