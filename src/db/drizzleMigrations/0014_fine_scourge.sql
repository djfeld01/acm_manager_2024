DO $$ BEGIN
 CREATE TYPE "public"."recievable_period" AS ENUM('zeroToTen', 'elevenToThirty', 'thirtyOneToSixty', 'sixtyToNinety', 'ninetyOneToOneTwenty', 'oneTwentyToOneEighty', 'oneEightyOneToThreeSixty', 'overThreeSixty');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_management_receivable" (
	"facility_id" varchar NOT NULL,
	"date" date NOT NULL,
	"period" "recievable_period" NOT NULL,
	"delinquent_total" real NOT NULL,
	"delinquent_units" real NOT NULL,
	"date_created" timestamp (6) with time zone,
	"date_updated" timestamp (6) with time zone,
	CONSTRAINT "daily_management_receivable_facility_id_date_pk" PRIMARY KEY("facility_id","date")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_management_receivable" ADD CONSTRAINT "daily_management_receivable_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_management_receivable_date_index" ON "daily_management_receivable" USING btree ("date");