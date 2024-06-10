DO $$ BEGIN
 CREATE TYPE "public"."activity_type" AS ENUM('MoveIn', 'MoveOut', 'Transfer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "tenant_activity" ALTER COLUMN "activity_type" SET DATA TYPE activity_type;