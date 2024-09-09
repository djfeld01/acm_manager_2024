ALTER TABLE "user_detail" ADD COLUMN "supervisor_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_detail" ADD CONSTRAINT "user_detail_supervisor_id_user_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user_detail" ADD CONSTRAINT "user_detail_paycor_employee_id_unique" UNIQUE("paycor_employee_id");--> statement-breakpoint
ALTER TABLE "user_detail" ADD CONSTRAINT "user_detail_sitelink_employee_id_unique" UNIQUE("sitelink_employee_id");