CREATE TABLE IF NOT EXISTS "daily_management_payment_receipt" (
	"facility_id" varchar NOT NULL,
	"date" date NOT NULL,
	"desription" varchar NOT NULL,
	"sort_id" integer NOT NULL,
	"daily_amount" real NOT NULL,
	"monthly_amount" real NOT NULL,
	"yearly_amount" real NOT NULL,
	"date_created" timestamp (6) with time zone,
	"date_updated" timestamp (6) with time zone,
	CONSTRAINT "daily_management_payment_receipt_facility_id_date_desription_pk" PRIMARY KEY("facility_id","date","desription")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_management_payment_receipt" ADD CONSTRAINT "daily_management_payment_receipt_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_management_payment_receipt_date_index" ON "daily_management_payment_receipt" USING btree ("date");