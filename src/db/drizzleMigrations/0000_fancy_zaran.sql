DO $$ BEGIN
 CREATE TYPE "public"."activity_type" AS ENUM('MoveIn', 'MoveOut', 'Transfer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pay_period_status_enum" AS ENUM('Completed', 'In Process', 'Current', 'Future');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('USER', 'MANAGER', 'ASSISTANT', 'OWNER', 'ADMIN', 'SUPERVISOR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_management_occupancy" (
	"facility_id" varchar NOT NULL,
	"date" date NOT NULL,
	"unit_occupancy" real,
	"financial_occupancy" real,
	"square_footage_occupancy" real,
	"occupied_units" real,
	"vacant_units" real,
	"complimentary_units" real,
	"unrentable_units" real,
	"total_units" real,
	"occupied_square_footage" real,
	"vacant_square_footage" real,
	"complimentary_square_footage" real,
	"unrentable_square_footage" real,
	"total_square_footage" real,
	"date_created" timestamp (6) with time zone,
	"date_updated" timestamp (6) with time zone,
	CONSTRAINT "daily_management_occupancy_facility_id_date_pk" PRIMARY KEY("facility_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_payment" (
	"daily_payment_id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar NOT NULL,
	"date" date NOT NULL,
	"cash" real,
	"check" real,
	"visa" real,
	"mastercard" real,
	"american_express" real,
	"discover" real,
	"ach" real,
	"diners_club" real,
	"debit" real,
	CONSTRAINT "daily_payment_date_facility_id_unique" UNIQUE("date","facility_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_goal" (
	"month" date DEFAULT now() NOT NULL,
	"sitelink_id" varchar NOT NULL,
	"collections_goal" numeric NOT NULL,
	"retail_goal" numeric NOT NULL,
	"rental_goal" integer NOT NULL,
	CONSTRAINT "monthly_goal_month_sitelink_id_pk" PRIMARY KEY("month","sitelink_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pay_period" (
	"pay_period_id" text PRIMARY KEY NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"paycheck_date" date,
	"processing_date" date,
	"status" "pay_period_status_enum",
	CONSTRAINT "pay_period_start_date_unique" UNIQUE("start_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quickbooks_balance" (
	"sitelink_id" varchar NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"balance" numeric NOT NULL,
	CONSTRAINT "quickbooks_balance_sitelink_id_date_pk" PRIMARY KEY("sitelink_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sitelink_logon" (
	"sitelink_employee_id" varchar NOT NULL,
	"date_time" timestamp NOT NULL,
	"computer_name" varchar NOT NULL,
	"computer_ip" varchar NOT NULL,
	CONSTRAINT "sitelink_logon_date_time_sitelink_employee_id_pk" PRIMARY KEY("date_time","sitelink_employee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storage_facility" (
	"sitelink_id" varchar PRIMARY KEY NOT NULL,
	"sitelink_site_code" varchar(4) NOT NULL,
	"paycor_number" integer NOT NULL,
	"facility_name" varchar(255) NOT NULL,
	"street_address" varchar(255) NOT NULL,
	"zip_code" varchar(16) NOT NULL,
	"city" varchar NOT NULL,
	"state" varchar NOT NULL,
	"email" varchar NOT NULL,
	"facility_abbreviation" varchar NOT NULL,
	"phone_number" varchar NOT NULL,
	"twilio_number" varchar NOT NULL,
	"website" varchar,
	"domain_registrar" varchar,
	"current_client" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_activity" (
	"tenant_activity_id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"tenant_name" varchar NOT NULL,
	"unit_name" varchar NOT NULL,
	"unit_width" numeric NOT NULL,
	"unit_length" numeric NOT NULL,
	"unit_size" varchar NOT NULL,
	"unit_type" varchar NOT NULL,
	"unit_area" numeric NOT NULL,
	"move_in_rental_rate" numeric,
	"move_in_variance" numeric,
	"tenant_sitelink_id" bigint NOT NULL,
	"tenant_address" varchar,
	"tenant_city" varchar,
	"tenant_state" varchar,
	"tenant_zip_code" varchar,
	"tenant_email" varchar,
	"move_in_discount_plan" varchar,
	"move_out_days_rented" integer,
	"employee_id" varchar,
	"employee_initials" varchar NOT NULL,
	"has_insurance" boolean NOT NULL,
	"insurance_amount" numeric,
	"lead_source" varchar,
	"pay_period_id" text,
	"commission_has_been_paid" boolean DEFAULT false,
	CONSTRAINT "tenant_activity_date_tenant_name_unique" UNIQUE("date","tenant_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text GENERATED ALWAYS AS ("user_detail"."last_name" || ', ' || "user_detail"."first_name") STORED,
	"initials" text GENERATED ALWAYS AS (LEFT("user_detail"."first_name",1) || LEFT("user_detail"."last_name",1)) STORED,
	"paycor_employee_id" integer,
	"supervisor_id" text,
	"hire_date" date,
	"termination_date" date,
	"is_active_employee" boolean DEFAULT true,
	CONSTRAINT "user_detail_email_unique" UNIQUE("email"),
	CONSTRAINT "user_detail_paycor_employee_id_unique" UNIQUE("paycor_employee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"user_detail_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_to_facilities" (
	"user_id" text NOT NULL,
	"storage_facility_id" varchar NOT NULL,
	"sitelink_employee_id" varchar,
	"primary_site" boolean,
	"rents_units" boolean,
	CONSTRAINT "user_to_facilities_storage_facility_id_user_id_pk" PRIMARY KEY("storage_facility_id","user_id"),
	CONSTRAINT "user_to_facilities_sitelink_employee_id_unique" UNIQUE("sitelink_employee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_management_occupancy" ADD CONSTRAINT "daily_management_occupancy_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_goal" ADD CONSTRAINT "monthly_goal_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quickbooks_balance" ADD CONSTRAINT "quickbooks_balance_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sitelink_logon" ADD CONSTRAINT "sitelink_logon_sitelink_employee_id_user_to_facilities_sitelink_employee_id_fk" FOREIGN KEY ("sitelink_employee_id") REFERENCES "public"."user_to_facilities"("sitelink_employee_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_activity" ADD CONSTRAINT "tenant_activity_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_activity" ADD CONSTRAINT "tenant_activity_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_detail" ADD CONSTRAINT "user_detail_supervisor_id_user_detail_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_user_detail_id_user_detail_id_fk" FOREIGN KEY ("user_detail_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_user_id_user_detail_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_detail"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_storage_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("storage_facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_management_occupancy_date_index" ON "daily_management_occupancy" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_payment_date_index" ON "daily_payment" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storage_facility_facility_name_index" ON "storage_facility" USING btree ("facility_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_activity_date_index" ON "tenant_activity" USING btree ("date");