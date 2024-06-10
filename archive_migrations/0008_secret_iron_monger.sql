CREATE TABLE IF NOT EXISTS "tenant_activity" (
	"tenant_activity_id" serial PRIMARY KEY NOT NULL,
	"facility_id" bigint NOT NULL,
	"date" date NOT NULL,
	"activityType" "activityType",
	"tenantName" varchar NOT NULL,
	"unit_name" varchar NOT NULL,
	"unit_width" integer NOT NULL,
	"unit_length" integer NOT NULL,
	"unit_size" varchar NOT NULL,
	"unit_type" varchar NOT NULL,
	"moved_in_rental_rate" numeric,
	"moved_in_variance" numeric,
	"tenant_sitelink_id" bigint NOT NULL,
	"tenant_address" varchar NOT NULL,
	"tenant_city" varchar NOT NULL,
	"tenant_state" varchar NOT NULL,
	"tenant_zip_code" varchar NOT NULL,
	"tenant_email" varchar NOT NULL,
	"move_in_discount_plan" varchar NOT NULL,
	"move_out_days_rented" integer NOT NULL,
	"employee_id" text NOT NULL,
	"employee_initials" text NOT NULL,
	"has_insurance" boolean NOT NULL,
	"insurance_amount" numeric,
	CONSTRAINT "tenant_activity_tenant_activity_id_unique" UNIQUE("tenant_activity_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_activity_date_index" ON "tenant_activity" ("date");