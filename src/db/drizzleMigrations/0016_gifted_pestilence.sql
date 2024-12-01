CREATE TABLE IF NOT EXISTS "daily_management_activity" (
	"facility_id" varchar NOT NULL,
	"activityType" varchar NOT NULL,
	"daily_total" integer NOT NULL,
	"monthly_total" integer NOT NULL,
	"yearly_total" integer NOT NULL,
	"date" date NOT NULL,
	"sort_id" integer,
	CONSTRAINT "daily_management_activity_facility_id_date_activityType_pk" PRIMARY KEY("facility_id","date","activityType")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_management_activity" ADD CONSTRAINT "daily_management_activity_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_management_activity_date_index" ON "daily_management_activity" USING btree ("date");