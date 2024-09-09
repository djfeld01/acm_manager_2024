ALTER TYPE "role" ADD VALUE 'MANAGER';--> statement-breakpoint
ALTER TYPE "role" ADD VALUE 'ASSISTANT';--> statement-breakpoint
ALTER TYPE "role" ADD VALUE 'OWNER';--> statement-breakpoint
ALTER TABLE "user_detail" ADD COLUMN "role" "role" DEFAULT 'USER' NOT NULL;