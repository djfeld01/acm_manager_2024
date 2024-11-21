CREATE TABLE IF NOT EXISTS "bonus" (
	"bonus_id" text PRIMARY KEY NOT NULL,
	"date" date,
	"employee_id" varchar,
	"facility_id" varchar NOT NULL,
	"bonus_amount" real NOT NULL,
	"bonus_type" text NOT NULL,
	"pay_period_id" text,
	"bonus_has_been_paid" boolean DEFAULT false
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bonus" ADD CONSTRAINT "bonus_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bonus" ADD CONSTRAINT "bonus_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bonus" ADD CONSTRAINT "bonus_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bonus_date_index" ON "bonus" USING btree ("date");