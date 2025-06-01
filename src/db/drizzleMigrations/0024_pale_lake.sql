ALTER TABLE "inquiry" ADD COLUMN "employee_id" varchar;--> statement-breakpoint
ALTER TABLE "inquiry" ADD COLUMN "employee_follow_up_id" varchar;--> statement-breakpoint
ALTER TABLE "inquiry" ADD COLUMN "employee_converted_to_res_id" varchar;--> statement-breakpoint
ALTER TABLE "inquiry" ADD COLUMN "employee_converted_to_move_in_id" varchar;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_employee_follow_up_id_user_detail_id_fk" FOREIGN KEY ("employee_follow_up_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_employee_converted_to_res_id_user_detail_id_fk" FOREIGN KEY ("employee_converted_to_res_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_employee_converted_to_move_in_id_user_detail_id_fk" FOREIGN KEY ("employee_converted_to_move_in_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;