ALTER TABLE "user_to_facilities" DROP CONSTRAINT "user_to_facilities_sitelink_employee_id_unique";--> statement-breakpoint
ALTER TABLE "user_detail" ALTER COLUMN "full_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_to_facilities" DROP COLUMN IF EXISTS "sitelink_employee_id";--> statement-breakpoint
ALTER TABLE "user_to_facilities" DROP COLUMN IF EXISTS "primary_site";