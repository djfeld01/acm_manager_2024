ALTER TABLE "sitelink_logon" DROP CONSTRAINT "sitelink_logon_sitelink_employee_id_user_to_facilities_sitelink_employee_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sitelink_logon" ADD CONSTRAINT "sitelink_logon_sitelink_employee_id_user_to_facilities_sitelink_employee_id_fk" FOREIGN KEY ("sitelink_employee_id") REFERENCES "public"."user_to_facilities"("sitelink_employee_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
