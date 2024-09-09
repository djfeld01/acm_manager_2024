ALTER TABLE "user_detail" DROP CONSTRAINT "user_detail_supervisor_id_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_detail" ADD CONSTRAINT "user_detail_supervisor_id_user_detail_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
