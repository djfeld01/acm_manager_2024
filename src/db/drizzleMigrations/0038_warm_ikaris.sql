CREATE TYPE "public"."discrepancy_status" AS ENUM('pending_approval', 'approved', 'rejected', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."discrepancy_type" AS ENUM('multi_day_combination', 'refund', 'error', 'timing_difference', 'bank_fee', 'other');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('automatic', 'manual', 'partial');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('in_progress', 'pending_review', 'completed', 'rejected');--> statement-breakpoint
CREATE TABLE "monthly_reconciliation" (
	"reconciliation_id" serial PRIMARY KEY NOT NULL,
	"reconciliation_month" integer NOT NULL,
	"reconciliation_year" integer NOT NULL,
	"facility_id" varchar NOT NULL,
	"status" "reconciliation_status" DEFAULT 'in_progress' NOT NULL,
	"created_by" text NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"submitted_for_review_at" timestamp,
	"reviewed_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"review_notes" text,
	CONSTRAINT "unique_facility_month_year" UNIQUE("facility_id","reconciliation_month","reconciliation_year")
);
--> statement-breakpoint
CREATE TABLE "reconciliation_discrepancies" (
	"discrepancy_id" serial PRIMARY KEY NOT NULL,
	"reconciliation_id" integer NOT NULL,
	"discrepancy_type" "discrepancy_type" NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "discrepancy_status" DEFAULT 'pending_approval' NOT NULL,
	"created_by" text NOT NULL,
	"approved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"resolved_at" timestamp,
	"notes" text,
	"approval_notes" text,
	"reference_transaction_ids" text,
	"reference_daily_payment_ids" text,
	"is_critical" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD COLUMN "reconciliation_id" integer;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD COLUMN "match_type" "match_type" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD COLUMN "is_manual_match" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD COLUMN "match_confidence" real;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD COLUMN "matched_by" text;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD COLUMN "matched_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD COLUMN "reconciliation_notes" text;--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD CONSTRAINT "monthly_reconciliation_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD CONSTRAINT "monthly_reconciliation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reconciliation" ADD CONSTRAINT "monthly_reconciliation_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_discrepancies" ADD CONSTRAINT "reconciliation_discrepancies_reconciliation_id_monthly_reconciliation_reconciliation_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."monthly_reconciliation"("reconciliation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_discrepancies" ADD CONSTRAINT "reconciliation_discrepancies_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliation_discrepancies" ADD CONSTRAINT "reconciliation_discrepancies_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "monthly_rec_facility_date_idx" ON "monthly_reconciliation" USING btree ("facility_id","reconciliation_year","reconciliation_month");--> statement-breakpoint
CREATE INDEX "monthly_rec_status_idx" ON "monthly_reconciliation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "monthly_rec_created_by_idx" ON "monthly_reconciliation" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "discrepancy_reconciliation_idx" ON "reconciliation_discrepancies" USING btree ("reconciliation_id");--> statement-breakpoint
CREATE INDEX "discrepancy_status_idx" ON "reconciliation_discrepancies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "discrepancy_type_idx" ON "reconciliation_discrepancies" USING btree ("discrepancy_type");--> statement-breakpoint
CREATE INDEX "discrepancy_created_by_idx" ON "reconciliation_discrepancies" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "discrepancy_approved_by_idx" ON "reconciliation_discrepancies" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "discrepancy_critical_idx" ON "reconciliation_discrepancies" USING btree ("is_critical");--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD CONSTRAINT "transactions_to_daily_payments_reconciliation_id_monthly_reconciliation_reconciliation_id_fk" FOREIGN KEY ("reconciliation_id") REFERENCES "public"."monthly_reconciliation"("reconciliation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD CONSTRAINT "transactions_to_daily_payments_matched_by_user_id_fk" FOREIGN KEY ("matched_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ttdp_reconciliation_idx" ON "transactions_to_daily_payments" USING btree ("reconciliation_id");--> statement-breakpoint
CREATE INDEX "ttdp_match_type_idx" ON "transactions_to_daily_payments" USING btree ("match_type");--> statement-breakpoint
CREATE INDEX "ttdp_matched_by_idx" ON "transactions_to_daily_payments" USING btree ("matched_by");--> statement-breakpoint
CREATE INDEX "ttdp_matched_at_idx" ON "transactions_to_daily_payments" USING btree ("matched_at");