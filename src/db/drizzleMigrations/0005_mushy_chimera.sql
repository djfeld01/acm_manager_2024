ALTER TABLE "user" DROP CONSTRAINT "user_user_detail_id_user_detail_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "user_detail_id";