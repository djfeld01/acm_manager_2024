CREATE TABLE "rate_increase_batch" (
	"id" serial PRIMARY KEY NOT NULL,
	"sitelink_id" varchar NOT NULL,
	"name" varchar(120) NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"effective_date" date NOT NULL,
	"snapshot_date" date NOT NULL,
	"rules" jsonb NOT NULL,
	"notes" text,
	"created_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rate_increase_batch_item" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"ledger_id" varchar NOT NULL,
	"tenant_id" varchar,
	"unit_id" varchar NOT NULL,
	"unit_name" varchar(32),
	"unit_type" varchar(32) NOT NULL,
	"size" varchar(32),
	"old_rent" real NOT NULL,
	"new_rent" real NOT NULL,
	"standard_rate" real,
	"special_months" integer,
	"rent_last_changed" date,
	"lease_date" date,
	"baseline_exit_90" real
);
--> statement-breakpoint
ALTER TABLE "rate_increase_batch" ADD CONSTRAINT "rate_increase_batch_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_increase_batch_item" ADD CONSTRAINT "rate_increase_batch_item_batch_id_rate_increase_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."rate_increase_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rate_increase_batch_site_idx" ON "rate_increase_batch" USING btree ("sitelink_id","effective_date");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_increase_batch_item_unique" ON "rate_increase_batch_item" USING btree ("batch_id","ledger_id");