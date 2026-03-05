CREATE TABLE "facility_unit_rate" (
	"id" serial PRIMARY KEY NOT NULL,
	"facility_id" varchar NOT NULL,
	"unit_type" varchar(100) NOT NULL,
	"unit_size" varchar(20) NOT NULL,
	"width" real,
	"length" real,
	"area" real,
	"standard_rate" numeric(8, 2),
	"push_rate" numeric(8, 2),
	"push_rate_used" boolean DEFAULT false,
	"web_rate" numeric(8, 2),
	"tax_rate" numeric(6, 4),
	"monthly_tax" numeric(8, 2),
	"total_units" integer,
	"total_occupied" integer,
	"total_vacant" integer,
	"imported_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "facility_unit_rate" ADD CONSTRAINT "facility_unit_rate_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "facility_unit_rate_unique" ON "facility_unit_rate" USING btree ("facility_id","unit_type","unit_size");