CREATE TABLE IF NOT EXISTS "daily_payment" (
	"daily_payment_id" serial PRIMARY KEY NOT NULL,
	"facility_id" bigint NOT NULL,
	"date" date NOT NULL,
	"cash" numeric,
	"checks" numeric,
	"visa" numeric,
	"mastercard" numeric,
	"american_express" numeric,
	"discover" numeric,
	"ach" numeric,
	"dinersClub" numeric,
	CONSTRAINT "daily_payment_daily_payment_id_unique" UNIQUE("daily_payment_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_payment_date_index" ON "daily_payment" ("date");