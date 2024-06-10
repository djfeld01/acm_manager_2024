import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";
import { cwd } from "process";
loadEnvConfig(cwd());

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/drizzleMigrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    schema: "public",
  },
});
