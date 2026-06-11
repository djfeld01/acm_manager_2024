-- Materialized view: last-day-of-month occupancy snapshot per facility.
-- Replaces a correlated subquery that ran once per row; now a single scan
-- with a sort. Completed months are immutable so this view rarely needs
-- a full refresh — only the current month's row ever changes.
CREATE MATERIALIZED VIEW monthly_occupancy_snapshot AS
SELECT DISTINCT ON (facility_id, DATE_TRUNC('month', date))
  facility_id,
  date,
  unit_occupancy,
  financial_occupancy,
  occupied_variance,
  rent_potential,
  rent_actual,
  square_footage_occupancy,
  occupied_units,
  vacant_units,
  complimentary_units,
  unrentable_units,
  total_units,
  occupied_square_footage,
  vacant_square_footage,
  complimentary_square_footage,
  unrentable_square_footage,
  total_square_footage,
  date_created,
  date_updated
FROM daily_management_occupancy
ORDER BY facility_id, DATE_TRUNC('month', date), date DESC;

-- Unique index required for REFRESH CONCURRENTLY (non-blocking reads during refresh)
CREATE UNIQUE INDEX monthly_occupancy_snapshot_facility_date_idx
  ON monthly_occupancy_snapshot (facility_id, date);

-- Covering index for the common query pattern: filter by date range, join on facility_id
CREATE INDEX monthly_occupancy_snapshot_date_idx
  ON monthly_occupancy_snapshot (date);
