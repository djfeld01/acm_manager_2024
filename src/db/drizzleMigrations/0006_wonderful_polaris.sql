ALTER TABLE "daily_payment" ALTER COLUMN "cash" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ALTER COLUMN "check" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ALTER COLUMN "visa" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ALTER COLUMN "mastercard" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ALTER COLUMN "american_express" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ALTER COLUMN "discover" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ALTER COLUMN "ach" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ALTER COLUMN "diners_club" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "daily_payment" ADD CONSTRAINT "daily_payment_date_facility_id_unique" UNIQUE("date","facility_id");