CREATE TYPE "public"."unit_availability" AS ENUM('AVAILABLE', 'LIMITED', 'WAITLIST', 'UNAVAILABLE');--> statement-breakpoint
CREATE TABLE "competitor_price" (
	"id" serial PRIMARY KEY NOT NULL,
	"competitor_id" integer NOT NULL,
	"unit_size" varchar(20) NOT NULL,
	"unit_type" varchar(100),
	"width" numeric(5, 1),
	"depth" numeric(5, 1),
	"street_rate" numeric(8, 2),
	"web_rate" numeric(8, 2),
	"promotion" varchar(255),
	"availability" "unit_availability",
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"chain" varchar(100),
	"street_address" varchar(255),
	"city" varchar(100),
	"state" varchar(2),
	"zip_code" varchar(10),
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(500),
	"scrape_url" varchar(500),
	"scrape_enabled" boolean DEFAULT true NOT NULL,
	"last_scraped_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "facility_competitor" (
	"facility_id" varchar NOT NULL,
	"competitor_id" integer NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "facility_competitor_facility_id_competitor_id_pk" PRIMARY KEY("facility_id","competitor_id")
);
--> statement-breakpoint
ALTER TABLE "competitor_price" ADD CONSTRAINT "competitor_price_competitor_id_competitor_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_competitor" ADD CONSTRAINT "facility_competitor_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_competitor" ADD CONSTRAINT "facility_competitor_competitor_id_competitor_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitor"("id") ON DELETE cascade ON UPDATE no action;