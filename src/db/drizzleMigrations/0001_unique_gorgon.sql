ALTER TABLE "monthly_goal" ALTER COLUMN "collections_goal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_goal" ALTER COLUMN "retail_goal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_goal" ALTER COLUMN "rental_goal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_goal" DROP COLUMN IF EXISTS "name";