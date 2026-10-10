CREATE TABLE "rent_roll_snapshot" (
	"id" serial PRIMARY KEY NOT NULL,
	"sitelink_id" varchar NOT NULL,
	"snapshot_date" date NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	"unit_id" varchar NOT NULL,
	"unit_name" varchar(32),
	"ledger_id" varchar,
	"tenant_id" varchar,
	"unit_type" varchar(32) NOT NULL,
	"raw_unit_type" varchar(64),
	"size" varchar(32),
	"area" real,
	"is_rentable" boolean DEFAULT true NOT NULL,
	"is_rented" boolean DEFAULT false NOT NULL,
	"rent" real,
	"standard_rate" real,
	"web_rate" real,
	"push_rate" real,
	"push_rate_at_move_in" real,
	"rent_last_changed" date,
	"lease_date" date,
	"paid_thru" date,
	"sched_rent_start" date,
	"sched_rent" real,
	"sched_out" date,
	"charge_balance" real,
	"days_vacant" integer
);
--> statement-breakpoint
ALTER TABLE "rent_roll_snapshot" ADD CONSTRAINT "rent_roll_snapshot_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rent_roll_snapshot_unit_unique" ON "rent_roll_snapshot" USING btree ("sitelink_id","snapshot_date","unit_id");--> statement-breakpoint
CREATE INDEX "rent_roll_snapshot_site_date_idx" ON "rent_roll_snapshot" USING btree ("sitelink_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "rent_roll_snapshot_tenant_idx" ON "rent_roll_snapshot" USING btree ("tenant_id");