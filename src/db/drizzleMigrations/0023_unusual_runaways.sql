CREATE TABLE "daily_management_sundries" (
	"facility_id" varchar NOT NULL,
	"sundryType" varchar NOT NULL,
	"daily_total" real NOT NULL,
	"monthly_total" real NOT NULL,
	"yearly_total" real NOT NULL,
	"date" date NOT NULL,
	"sort_id" integer,
	"date_created" timestamp (6) with time zone,
	"date_updated" timestamp (6) with time zone,
	CONSTRAINT "daily_management_sundries_facility_id_date_sundryType_pk" PRIMARY KEY("facility_id","date","sundryType")
);
--> statement-breakpoint
CREATE TABLE "inquiry" (
	"id" serial PRIMARY KEY NOT NULL,
	"sitelink_id" varchar,
	"push_rate" numeric,
	"std_rate" numeric,
	"waiting_id" integer,
	"tenant_id" integer,
	"ledger_id" integer,
	"unit_id" integer,
	"date_placed" date,
	"first_follow_up_date" date,
	"last_follow_up_date" date,
	"cancel_date" date,
	"expiration_date" date,
	"lease_date" date,
	"call_type" varchar(32),
	"inquiry_type" varchar(32),
	"marketing_id" integer,
	"marketing_desc" varchar(128),
	"rental_type_id" integer,
	"rental_type" varchar(64),
	"converted_to_res_date" date,
	"needed_date" date,
	"cancellation_reason" text,
	"comment" text,
	"source" varchar(128),
	"quoted_rate" numeric,
	"employee_name" varchar(128),
	"employee_follow_up" varchar(128),
	"employee_converted_to_res" varchar(128),
	"employee_converted_to_move_in" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"tenant_id" integer PRIMARY KEY NOT NULL,
	"sitelink_id" varchar,
	"first_name" varchar(64),
	"middle_initial" varchar(8),
	"last_name" varchar(64),
	"company" varchar(128),
	"is_commercial" boolean,
	"email" varchar(128),
	"phone" varchar(32),
	"postal_code" varchar(16)
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"unit_id" integer PRIMARY KEY NOT NULL,
	"sitelink_id" varchar,
	"unit_name" varchar(32),
	"size" varchar(32),
	"width" numeric,
	"length" numeric,
	"area" numeric,
	"is_mobile" boolean,
	"is_climate" boolean,
	"is_alarm" boolean,
	"is_power" boolean,
	"is_inside" boolean,
	"floor" integer,
	"unit_type_id" integer,
	"unit_type_name" varchar(64)
);
--> statement-breakpoint
ALTER TABLE "daily_management_sundries" ADD CONSTRAINT "daily_management_sundries_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_tenant_id_tenant_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("tenant_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_unit_id_unit_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("unit_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_management_sundries_date_index" ON "daily_management_sundries" USING btree ("date");