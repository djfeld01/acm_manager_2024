import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Singleton pattern: prevent multiple pool instances during Next.js hot-reloads in dev.
// Without this, each module re-evaluation creates a new connection pool, exhausting
// Supabase's connection limit and causing CONNECT_TIMEOUT errors.
declare global {
  // eslint-disable-next-line no-var
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__pgClient ?? postgres(process.env.DATABASE_URL!, { max: 1 });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgClient = client;
}

export const db = drizzle(client, { schema: { ...schema } });
