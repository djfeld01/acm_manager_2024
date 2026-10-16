CREATE TABLE "increase_wave_month" (
	"id" serial PRIMARY KEY NOT NULL,
	"sitelink_id" varchar NOT NULL,
	"month" date NOT NULL,
	"unit_type" varchar(32) NOT NULL,
	"size" varchar(32) NOT NULL,
	"units_raised" integer DEFAULT 0 NOT NULL,
	"dollars_added" real DEFAULT 0 NOT NULL,
	"avg_pct" real DEFAULT 0 NOT NULL,
	"at_standard" integer DEFAULT 0 NOT NULL,
	"below_standard" integer DEFAULT 0 NOT NULL,
	"above_standard" integer DEFAULT 0 NOT NULL,
	"moveouts_0_30" integer DEFAULT 0 NOT NULL,
	"moveouts_31_60" integer DEFAULT 0 NOT NULL,
	"moveouts_61_90" integer DEFAULT 0 NOT NULL,
	"moveouts_0_30_rent" real DEFAULT 0 NOT NULL,
	"moveouts_31_60_rent" real DEFAULT 0 NOT NULL,
	"moveouts_61_90_rent" real DEFAULT 0 NOT NULL,
	"report_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occupancy_month" (
	"id" serial PRIMARY KEY NOT NULL,
	"sitelink_id" varchar NOT NULL,
	"month" date NOT NULL,
	"unit_type" varchar(32) NOT NULL,
	"size" varchar(32) NOT NULL,
	"units_occupied" integer DEFAULT 0 NOT NULL,
	"total_units" integer DEFAULT 0 NOT NULL,
	"gross_occupied" real DEFAULT 0 NOT NULL,
	"actual_occupied" real DEFAULT 0 NOT NULL,
	"report_date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "increase_wave_month" ADD CONSTRAINT "increase_wave_month_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupancy_month" ADD CONSTRAINT "occupancy_month_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "increase_wave_month_unique" ON "increase_wave_month" USING btree ("sitelink_id","month","unit_type","size");--> statement-breakpoint
CREATE INDEX "increase_wave_month_site_idx" ON "increase_wave_month" USING btree ("sitelink_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "occupancy_month_unique" ON "occupancy_month" USING btree ("sitelink_id","month","unit_type","size");--> statement-breakpoint
CREATE INDEX "occupancy_month_site_idx" ON "occupancy_month" USING btree ("sitelink_id","month");