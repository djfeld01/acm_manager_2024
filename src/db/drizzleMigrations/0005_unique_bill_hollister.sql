ALTER TABLE "tenant_activity" RENAME COLUMN "moved_in_rental_rate" TO "move_in_rental_rate";--> statement-breakpoint
ALTER TABLE "tenant_activity" RENAME COLUMN "moved_in_variance" TO "move_in_variance";--> statement-breakpoint
ALTER TABLE "tenant_activity" ADD COLUMN "unit_area" varchar NOT NULL;