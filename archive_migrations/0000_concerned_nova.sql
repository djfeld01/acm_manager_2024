CREATE TABLE IF NOT EXISTS "storageFacility" (
	"sitelink_id" bigint PRIMARY KEY NOT NULL,
	"paycor_number" integer NOT NULL,
	"store_name" varchar(255) NOT NULL,
	"street_address" varchar(255) NOT NULL,
	"zip_code" varchar(16) NOT NULL,
	"city" varchar NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storageFacility_store_name_index" ON "storageFacility" ("store_name");