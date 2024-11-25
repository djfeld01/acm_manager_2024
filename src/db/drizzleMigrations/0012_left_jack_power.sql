DO $$ BEGIN
 CREATE TYPE "public"."vacation_type" AS ENUM('USED', 'EARNED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "vacation" ADD COLUMN "vacation_hours_type" "vacation_type" NOT NULL;