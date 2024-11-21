DO $$ BEGIN
 CREATE TYPE "public"."position" AS ENUM('ACM_OFFICE', 'AREA_MANAGER', 'MANAGER', 'ASSISTANT', 'STORE_OWNER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vacation" (
	"vacation_id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"employee_id" varchar,
	"facility_id" varchar NOT NULL,
	"vacation_hours" real NOT NULL,
	"vacation_note" text,
	"pay_period_id" text,
	"vacation_has_been_paid" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "user_to_facilities" ADD COLUMN "position" "position";--> statement-breakpoint
ALTER TABLE "user_to_facilities" ADD COLUMN "rental_commission_rate" real;--> statement-breakpoint
ALTER TABLE "user_to_facilities" ADD COLUMN "insurance_commission_rate" real;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vacation" ADD CONSTRAINT "vacation_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vacation" ADD CONSTRAINT "vacation_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vacation" ADD CONSTRAINT "vacation_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vacation_date_index" ON "vacation" USING btree ("date");