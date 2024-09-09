ALTER TABLE "user_detail" DROP CONSTRAINT "user_detail_sitelink_employee_id_unique";--> statement-breakpoint
ALTER TABLE "user_to_facilities" ADD COLUMN "sitelink_employee_id" integer;--> statement-breakpoint
ALTER TABLE "user_detail" DROP COLUMN IF EXISTS "sitelink_employee_id";--> statement-breakpoint
ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_sitelink_employee_id_unique" UNIQUE("sitelink_employee_id");