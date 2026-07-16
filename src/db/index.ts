import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Singleton pattern: prevent multiple pool instances during Next.js hot-reloads in dev.
// Without this, each module re-evaluation creates a new connection pool, exhausting
// Supabase's connection limit and causing CONNECT_TIMEOUT errors.
//
// `max: 10` (postgres.js's own default -- see below) instead of `max: 1`:
// On 2026-07-16, `max: 1` meant a whole warm serverless instance shared a single
// physical connection. When a slow query hit Postgres's statement timeout, that one
// connection came back wedged, and since there was no second connection to fall back
// on, every subsequent request on that instance failed identically
// (`TypeError: Cannot redefine property: query`) until Vercel force-killed it ~5
// minutes later.
//
// Raising max to 10 fixes this without any extra recovery code, because postgres.js
// already handles per-connection failure gracefully once there's more than one
// connection in the pool: connections are lazy and independent -- a query in flight
// on a broken connection rejects on its own, and the *next* query lazily opens a
// fresh connection rather than being forced to reuse the broken one. (This is why the
// library deliberately has no generic "onerror" hook -- see postgres.js README,
// "The Connection Pool" / "Error handling" sections.) With max: 1 there was no other
// connection to route around the bad one; with max: 10, one wedged connection can
// only affect whatever request was actively using it at that moment, while the other
// 9 keep serving traffic normally. The real bug was pool *capacity*, not a missing
// recovery mechanism -- so no custom retry/error-event wrapper is added here.
//
// Caching the client itself (this singleton) across warm invocations is unrelated and
// still correct/recommended: it avoids re-opening the pool on every hot reload. The
// outage risk was `max: 1`, not the caching pattern.
//
// The real database connection ceiling (200 on Supabase's transaction-mode pooler at
// our compute tier) leaves comfortable headroom at max: 10 even under 15-20
// concurrent warm instances -- see the perf/database-investigation branch history for
// the concurrency audit this was based on.
declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

// `prepare: false` stays as-is: Supabase's transaction-mode pooler (Supavisor) does
// not support session-level prepared statements, since a client's queries can land on
// different backend server connections between calls. Automatic prepared statements
// (postgres.js's default) would break under that pooling mode, so this must remain
// false as long as DATABASE_URL points at the transaction pooler (port 6543 /
// `pgbouncer=true`).
const client =
  globalThis.__pgClient ?? postgres(process.env.DATABASE_URL!, { max: 10, prepare: false });

globalThis.__pgClient = client;

export const db = drizzle(client, { schema: { ...schema } });
