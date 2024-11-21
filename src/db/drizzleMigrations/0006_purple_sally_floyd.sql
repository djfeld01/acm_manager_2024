CREATE TABLE IF NOT EXISTS "payrollNote" (
	"payrollNote_id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"employee_id" varchar,
	"note" text NOT NULL,
	"pay_period_id" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payrollNote" ADD CONSTRAINT "payrollNote_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payrollNote" ADD CONSTRAINT "payrollNote_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payrollNote_date_index" ON "payrollNote" USING btree ("date");