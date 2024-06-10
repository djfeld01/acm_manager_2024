CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
ALTER TABLE "storageFacility" ADD COLUMN "sitelink_site_code" varchar(4) NOT NULL;--> statement-breakpoint
ALTER TABLE "storageFacility" ADD COLUMN "email" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "storageFacility" ADD COLUMN "siteAbbreviation" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "storageFacility" ADD COLUMN "phone_number" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "storageFacility" ADD COLUMN "twilio_number" varchar NOT NULL;