CREATE TABLE IF NOT EXISTS "mileage" (
	"mileage_id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"employee_id" varchar,
	"facility_id" varchar NOT NULL,
	"mileage" real NOT NULL,
	"mileage_rate" real DEFAULT 0.35 NOT NULL,
	"pay_period_id" text,
	"mileage_has_been_paid" boolean DEFAULT false
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mileage" ADD CONSTRAINT "mileage_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mileage" ADD CONSTRAINT "mileage_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mileage" ADD CONSTRAINT "mileage_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mileage_date_index" ON "mileage" USING btree ("date");