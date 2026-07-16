# Runbook: applying migrations 0046 / 0047 / 0048 without hitting the statement timeout

_Added 2026-07-16 on `perf/database-investigation`, after `npm run migrate` failed against
production with `PostgresError: canceling statement due to statement timeout` (code `57014`)._

## What went wrong

`npm run migrate` runs `npx drizzle-kit migrate`. With the `postgres` driver (this project's
driver), drizzle-kit hands off to `drizzle-orm/postgres-js/migrator`, whose `PgDialect.migrate`
wraps **every pending migration in a single `BEGIN … COMMIT` transaction** and only writes the
`public.__drizzle_migrations` rows on commit. (Verified in
`node_modules/drizzle-orm/pg-core/dialect.js` — one `session.transaction(...)` around the whole
loop; `--> statement-breakpoint` only splits statements, it does **not** split transactions.)

Inside that transaction the migrations do plain `CREATE INDEX` on large tables. A plain
`CREATE INDEX` takes an `ACCESS EXCLUSIVE`-blocking lock and does a full table scan + sort + write.
On a large table that exceeds Supabase's ~60s `statement_timeout`, Postgres kills the statement
(57014). Because it's all one transaction, the **entire batch rolls back** — including any index
that had already been built earlier in the batch, and including the migration bookkeeping rows.

### Which statement timed out
It timed out on the **first index build that hit a table too big to finish inside ~60s**. In
statement order that is:

1. `0046` statement 1 — `CREATE INDEX tenant_activity_pay_period_id_index` on `tenant_activity`
   (a wide ~30-column, full-history move-in/move-out event table with no supporting index on this
   column — confirmed full seq scans). Runs first, so it's the first candidate.
2. If `tenant_activity` was small enough to finish in time, the next suspect is `0047` statement 1
   — `CREATE INDEX daily_management_activity_activityType_facility_id_date_index` (a 3-column
   composite). We have hard evidence this table is large: today's logs show 20117ms and 29350ms
   **sequential scans** on it.

We can't tell exactly which from the files alone (no live row counts), and it doesn't matter for
recovery — see below.

## Current database state (as of the failed run)

**Clean. Nothing was half-applied.** Because the whole batch was one transaction that rolled back:

- No new rows in `public.__drizzle_migrations` — migrations 0046, 0047, 0048 are all still pending.
  The last applied migration is still `0045_monthly_occupancy_snapshot`.
- None of the six new indexes exist (any that were built mid-batch were rolled back with everything
  else).

> Note: the migrations bookkeeping table lives in schema **`public`**, not `drizzle` — this project
> sets `migrations.schema: "public"` in `drizzle.config.ts`. The table stores `hash` + `created_at`
> (the journal `when` value), **not** the tag name. Map by `created_at`:
> `0045` = `1781198202923`, `0046` = `1789000000000`, `0047` = `1789100000000`,
> `0048` = `1789200000000`.

### Step 0 — verify reality first (read-only, Supabase SQL Editor)

```sql
-- (a) Which migrations are recorded as applied? Expect the newest created_at to be 1781198202923 (0045).
SELECT id, hash, created_at, to_timestamp(created_at / 1000) AS applied_at
FROM public.__drizzle_migrations
ORDER BY created_at DESC
LIMIT 5;

-- (b) Do any of the six new indexes already exist? Expect ZERO rows on a clean rollback.
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN (
  'tenant_activity_pay_period_id_index',
  'tenant_activity_facility_id_index',
  'user_to_facilities_user_id_index',
  'daily_management_activity_activityType_facility_id_date_index',
  'logon_with_facility_user_view_storage_facility_id_index',
  'logon_with_facility_user_view_employee_date_idx'
)
ORDER BY tablename, indexname;

-- (c) Any INVALID indexes left behind by an interrupted build? Expect ZERO rows.
SELECT c.relname AS index_name, i.indisvalid
FROM pg_class c
JOIN pg_index i ON i.indexrelid = c.oid
WHERE i.indisvalid = false;
```

## The fix: build the indexes by hand with `CREATE INDEX CONCURRENTLY`

`CREATE INDEX CONCURRENTLY` builds without the blocking lock (readers/writers keep working — which
matters, this is production). **But `CONCURRENTLY` cannot run inside a transaction block**, and
drizzle-kit's migrator *always* wraps migrations in a transaction with no escape hatch in this
version (`drizzle-kit ^0.31.8` / `drizzle-orm ^0.41.0`). So we **cannot** push `CONCURRENTLY`
through `drizzle-kit migrate`. Do it by hand instead, then let the migrator record the (now
instant) `IF NOT EXISTS` no-ops.

`statement_timeout` **does** still apply to `CONCURRENTLY` builds, so raise it for the session
first, or the build gets killed the same way (and a killed `CONCURRENTLY` build leaves an INVALID
index behind that must be dropped before retrying).

### How to run it
Use **`psql` on the direct connection string** (the same direct `DATABASE_URL` you used for
`npm run migrate`). psql runs in autocommit, so `CONCURRENTLY` works. Run each statement one at a
time. (Avoid the Supabase SQL Editor for these — it can wrap statements in a transaction, which
makes `CONCURRENTLY` fail with error `25001`.)

```sql
-- Raise the timeout for THIS session (must be the same session as the CREATE INDEX below).
SET statement_timeout = '600s';   -- or: SET statement_timeout = 0;  to disable entirely

-- 0046 --------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS "tenant_activity_pay_period_id_index"
  ON "tenant_activity" USING btree ("pay_period_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "tenant_activity_facility_id_index"
  ON "tenant_activity" USING btree ("facility_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_to_facilities_user_id_index"
  ON "user_to_facilities" USING btree ("user_id");

-- 0047 --------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS "daily_management_activity_activityType_facility_id_date_index"
  ON "daily_management_activity" USING btree ("activityType", "facility_id", "date");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "logon_with_facility_user_view_storage_facility_id_index"
  ON "logon_with_facility_user_view" USING btree ("storage_facility_id");

-- 0048 --------------------------------------------------------------------
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "logon_with_facility_user_view_employee_date_idx"
  ON "logon_with_facility_user_view" USING btree ("sitelink_employee_id", "date_time");
```

If any build is interrupted / times out, clean up the invalid leftover before retrying:

```sql
DROP INDEX CONCURRENTLY IF EXISTS "<index_name>";
```

### Then record the migrations as applied
Re-run:

```bash
npm run migrate
```

Every `CREATE INDEX IF NOT EXISTS` statement now sees the index already exists and skips instantly,
so the migrator's transaction commits in milliseconds and writes the 0046/0047/0048 rows into
`public.__drizzle_migrations`. Re-run Step 0 query (a) to confirm all three `created_at` values are
now present.

## Index → migration checklist

| Migration | Index | Table |
|-----------|-------|-------|
| 0046 | `tenant_activity_pay_period_id_index` | `tenant_activity` |
| 0046 | `tenant_activity_facility_id_index` | `tenant_activity` |
| 0046 | `user_to_facilities_user_id_index` | `user_to_facilities` |
| 0047 | `daily_management_activity_activityType_facility_id_date_index` | `daily_management_activity` |
| 0047 | `logon_with_facility_user_view_storage_facility_id_index` | `logon_with_facility_user_view` (matview) |
| 0048 | `logon_with_facility_user_view_employee_date_idx` (UNIQUE) | `logon_with_facility_user_view` (matview) |
| 0049 | `sitelink_logon_employee_id_date_time_index` | `sitelink_logon` |

> Why the migration `.sql` files were **not** changed to use `CONCURRENTLY`: doing so would make
> `drizzle-kit migrate` fail with `25001` (CONCURRENTLY inside a transaction). Leaving them as
> `CREATE INDEX IF NOT EXISTS` is deliberate — it's exactly what makes the post-manual re-run an
> instant, safe no-op that just records the bookkeeping rows.

## Update — migration 0049 (retire `logon_with_facility_user_view`)

_Added 2026-07-16 on `perf/database-investigation`._

Migration `0049_drop_logon_view_add_base_index` does two things:

1. **Adds** `sitelink_logon_employee_id_date_time_index` on
   `sitelink_logon(sitelink_employee_id, date_time)`. `sitelink_logon` is ~55k rows, so this build
   can exceed the statement timeout inside the migrator transaction — treat it exactly like the
   0046/0047 index builds: run it by hand with `CREATE INDEX CONCURRENTLY` first (after
   `SET statement_timeout`), then let `npm run migrate` record it as an instant `IF NOT EXISTS` no-op.

   ```sql
   SET statement_timeout = '600s';
   CREATE INDEX CONCURRENTLY IF NOT EXISTS "sitelink_logon_employee_id_date_time_index"
     ON "sitelink_logon" USING btree ("sitelink_employee_id", "date_time");
   ```

2. **Drops** the `logon_with_facility_user_view` materialized view
   (`DROP MATERIALIZED VIEW IF EXISTS`). This is instant and needs no `CONCURRENTLY`. Dropping the
   matview also drops its own indexes, so the two view indexes from 0047/0048
   (`logon_with_facility_user_view_storage_facility_id_index` and
   `logon_with_facility_user_view_employee_date_idx`) go away with it.

**If 0046–0048 have not been applied to production yet** (per the top of this runbook, they were
still pending after the failed run): you can skip building the two *view* indexes
(0047's `logon_with_facility_user_view_storage_facility_id_index` and 0048's
`logon_with_facility_user_view_employee_date_idx`) by hand — 0049 drops the view moments later, so
building them would just be throwaway work. When `npm run migrate` runs 0047/0048's
`CREATE INDEX IF NOT EXISTS` on the ~55k-row matview inside its transaction it will build them
quickly (well under the timeout), then 0049 drops the view. Only the **base-table** index in step 1
above needs the by-hand `CONCURRENTLY` treatment. Still build `0046`'s and `0047`'s *base-table*
indexes (on `tenant_activity` / `daily_management_activity`) by hand as originally documented.
