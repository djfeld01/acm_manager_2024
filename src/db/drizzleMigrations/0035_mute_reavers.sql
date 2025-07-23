ALTER TABLE "tenant" ADD COLUMN "middle_name" varchar(64);--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "insurance_premium" integer;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "report_date" timestamp;--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "report_date" timestamp;