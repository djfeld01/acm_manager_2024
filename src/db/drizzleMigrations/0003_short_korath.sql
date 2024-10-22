CREATE TABLE IF NOT EXISTS "daily_management_summary" (
	"daily_management_summary_id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar NOT NULL,
	"date" date NOT NULL,
	"unit_occupancy" numeric,
	"financial_occupancy" numeric,
	"square_footage_occupancy" numeric,
	"occupiedUnits" numeric,
	CONSTRAINT "daily_management_summary_date_unique" UNIQUE("date")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_management_summary" ADD CONSTRAINT "daily_management_summary_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_management_summary_date_index" ON "daily_management_summary" USING btree ("date");