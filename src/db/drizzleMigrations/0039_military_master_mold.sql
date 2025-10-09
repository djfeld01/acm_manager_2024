CREATE TABLE "multi_day_discrepancies" (
	"multi_day_id" serial PRIMARY KEY NOT NULL,
	"discrepancy_id" integer NOT NULL,
	"daily_payment_id" integer NOT NULL,
	"notes" text,
	"added_by" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" DROP CONSTRAINT "unique_facility_month_year";--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "bank_account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "total_expected_cash_check" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "total_actual_cash_check" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "total_expected_credit_card" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "total_actual_credit_card" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "total_transactions_matched" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "total_transactions_unmatched" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD COLUMN "total_discrepancies" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "multi_day_discrepancies" ADD CONSTRAINT "multi_day_discrepancies_discrepancy_id_reconciliation_discrepancies_discrepancy_id_fk" FOREIGN KEY ("discrepancy_id") REFERENCES "public"."reconciliation_discrepancies"("discrepancy_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_day_discrepancies" ADD CONSTRAINT "multi_day_discrepancies_daily_payment_id_daily_payment_daily_payment_id_fk" FOREIGN KEY ("daily_payment_id") REFERENCES "public"."daily_payment"("daily_payment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_day_discrepancies" ADD CONSTRAINT "multi_day_discrepancies_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "multi_day_discrepancy_idx" ON "multi_day_discrepancies" USING btree ("discrepancy_id");--> statement-breakpoint
CREATE INDEX "multi_day_daily_payment_idx" ON "multi_day_discrepancies" USING btree ("daily_payment_id");--> statement-breakpoint
CREATE INDEX "multi_day_added_by_idx" ON "multi_day_discrepancies" USING btree ("added_by");--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD CONSTRAINT "monthly_reconciliation_bank_account_id_bank_account_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("bank_account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD CONSTRAINT "unique_facility_bank_month_year" UNIQUE("facility_id","bank_account_id","reconciliation_month","reconciliation_year");