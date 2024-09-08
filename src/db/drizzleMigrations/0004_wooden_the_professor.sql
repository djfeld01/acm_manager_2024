ALTER TABLE "user" ADD COLUMN "user_detail_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_user_detail_id_user_detail_id_fk" FOREIGN KEY ("user_detail_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
