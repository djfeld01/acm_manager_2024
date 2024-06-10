ALTER TABLE "storageFacility" RENAME TO "storage_facility";--> statement-breakpoint
ALTER TABLE "user_to_facilities" DROP CONSTRAINT "user_to_facilities_storage_facility_id_storageFacility_sitelink_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "storageFacility_store_name_index";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_storage_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("storage_facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storage_facility_store_name_index" ON "storage_facility" ("store_name");