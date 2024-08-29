DO $$ BEGIN
 CREATE TYPE "public"."activity_type" AS ENUM('MoveIn', 'MoveOut', 'Transfer');
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
CREATE TABLE IF NOT EXISTS "daily_payment" (
	"daily_payment_id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar NOT NULL,
	"date" date NOT NULL,
	"cash" numeric,
	"checks" numeric,
	"visa" numeric,
	"mastercard" numeric,
	"american_express" numeric,
	"discover" numeric,
	"ach" numeric,
	"dinersClub" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_goal" (
	"month" date DEFAULT now() NOT NULL,
	"sitelink_id" varchar NOT NULL,
	"collections_goal" numeric,
	"retail_goal" numeric,
	"rental_goal" integer,
	"name" varchar,
	CONSTRAINT "monthly_goal_month_sitelink_id_pk" PRIMARY KEY("month","sitelink_id")
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
	"twilio_number" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_activity" (
	"tenant_activity_id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar NOT NULL,
	"date" date NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"tenant_name" varchar NOT NULL,
	"unit_name" varchar NOT NULL,
	"unit_width" numeric NOT NULL,
	"unit_length" numeric NOT NULL,
	"unit_size" varchar NOT NULL,
	"unit_type" varchar NOT NULL,
	"unit_area" varchar NOT NULL,
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
	"lead_source" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_to_facilities" (
	"user_id" text NOT NULL,
	"storage_facility_id" varchar NOT NULL,
	CONSTRAINT "user_to_facilities_storage_facility_id_user_id_pk" PRIMARY KEY("storage_facility_id","user_id")
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
 ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
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
CREATE INDEX IF NOT EXISTS "daily_payment_date_index" ON "daily_payment" ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storage_facility_facility_name_index" ON "storage_facility" ("facility_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_activity_date_index" ON "tenant_activity" ("date");