ALTER TABLE "user_detail" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_detail" ADD CONSTRAINT "user_detail_email_unique" UNIQUE("email");