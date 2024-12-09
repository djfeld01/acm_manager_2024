DO $$ BEGIN
 CREATE TYPE "public"."holiday_type" AS ENUM('christmas', 'thanksgiving', 'newYear', 'memorialDay', 'laborDay', 'fourthOfJuly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "holiday" (
	"holiday_id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"employee_id" varchar,
	"facility_id" varchar NOT NULL,
	"holiday_hours" real DEFAULT 8 NOT NULL,
	"holiday_hours_type" "holiday_type" NOT NULL,
	"holiday_note" text,
	"pay_period_id" text,
	"holiday_has_been_paid" boolean DEFAULT false
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "holiday" ADD CONSTRAINT "holiday_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "holiday" ADD CONSTRAINT "holiday_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "holiday" ADD CONSTRAINT "holiday_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holiday_date_index" ON "holiday" USING btree ("date");