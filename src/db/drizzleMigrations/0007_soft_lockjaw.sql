ALTER TABLE "storage_facility" RENAME COLUMN "store_name" TO "facility_name";--> statement-breakpoint
DROP INDEX IF EXISTS "storage_facility_store_name_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storage_facility_facility_name_index" ON "storage_facility" ("facility_name");