import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load the local test environment
config({ path: ".env.test.local" });

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
