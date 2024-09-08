ALTER TABLE "user_to_facilities" DROP CONSTRAINT "user_to_facilities_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_detail" ALTER COLUMN "full_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_detail" ALTER COLUMN "initials" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_detail" ADD COLUMN "user_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_detail" ADD CONSTRAINT "user_detail_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_to_facilities" ADD CONSTRAINT "user_to_facilities_user_id_user_detail_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
