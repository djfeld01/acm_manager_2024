ALTER TABLE "tenant_activity" ALTER COLUMN "tenant_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_activity" ALTER COLUMN "tenant_city" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_activity" ALTER COLUMN "tenant_state" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_activity" ALTER COLUMN "tenant_zip_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_activity" ALTER COLUMN "move_in_discount_plan" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_activity" ALTER COLUMN "move_out_days_rented" DROP NOT NULL;