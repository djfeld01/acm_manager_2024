CREATE TABLE "daily_management_sundries" (
	"facility_id" varchar NOT NULL,
	"sundryType" varchar NOT NULL,
	"sort_number" integer NOT NULL,
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
ALTER TABLE "daily_management_sundries" ADD CONSTRAINT "daily_management_sundries_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_management_sundries_date_index" ON "daily_management_sundries" USING btree ("date");