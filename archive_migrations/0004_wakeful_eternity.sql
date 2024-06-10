CREATE TABLE IF NOT EXISTS "user_to_facilities" (
	"user_id" text NOT NULL,
	"storage_facility_id" bigint NOT NULL,
	CONSTRAINT "user_to_facilities_user_id_storage_facility_id_pk" PRIMARY KEY("user_id","storage_facility_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_storage_facility_id_storageFacility_sitelink_id_fk" FOREIGN KEY ("storage_facility_id") REFERENCES "public"."storageFacility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
