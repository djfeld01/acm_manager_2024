CREATE TYPE "public"."change_reason" AS ENUM('HIRE', 'ANNUAL_INCREASE', 'INTERIM_RAISE', 'PROMOTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."compensation_type" AS ENUM('HOURLY', 'SALARY');--> statement-breakpoint
CREATE TYPE "public"."employee_type" AS ENUM('HOURLY', 'SALARY');--> statement-breakpoint
CREATE TYPE "public"."hours_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED');--> statement-breakpoint
CREATE TYPE "public"."payroll_period_status_enum" AS ENUM('NOT_STARTED', 'EMPLOYEE_SUBMITTED', 'SUPERVISOR_APPROVED', 'FINALIZED');--> statement-breakpoint
CREATE TYPE "public"."vacation_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "employee_compensation" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"effective_date" date NOT NULL,
	"wage" numeric(10, 4) NOT NULL,
	"compensation_type" "compensation_type" NOT NULL,
	"title" varchar(100),
	"change_reason" "change_reason" NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp (6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hours_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"pay_period_id" text NOT NULL,
	"facility_id" varchar,
	"regular_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"status" "hours_status" DEFAULT 'DRAFT' NOT NULL,
	"entered_by" text,
	"approved_by" text,
	"approved_at" timestamp (6) with time zone,
	"notes" text,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone,
	CONSTRAINT "hours_entry_employee_id_pay_period_id_facility_id_unique" UNIQUE("employee_id","pay_period_id","facility_id")
);
--> statement-breakpoint
CREATE TABLE "payroll_period_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"pay_period_id" text NOT NULL,
	"status" "payroll_period_status_enum" DEFAULT 'NOT_STARTED' NOT NULL,
	"employee_submitted_at" timestamp (6) with time zone,
	"supervisor_approved_at" timestamp (6) with time zone,
	"supervisor_approved_by" text,
	"finalized_at" timestamp (6) with time zone,
	"finalized_by" text,
	"supervisor_notes" text,
	"admin_notes" text,
	CONSTRAINT "payroll_period_status_employee_id_pay_period_id_unique" UNIQUE("employee_id","pay_period_id")
);
--> statement-breakpoint
CREATE TABLE "vacation_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"pay_period_id" text,
	"facility_id" varchar,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"hours_requested" numeric(6, 2) NOT NULL,
	"status" "vacation_request_status" DEFAULT 'PENDING' NOT NULL,
	"requested_at" timestamp (6) with time zone DEFAULT now(),
	"reviewed_by" text,
	"reviewed_at" timestamp (6) with time zone,
	"review_notes" text
);
--> statement-breakpoint
ALTER TABLE "storage_facility" ADD COLUMN "is_corporate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_detail" ADD COLUMN "employee_type" "employee_type" DEFAULT 'HOURLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_detail" ADD COLUMN "next_scheduled_raise" date;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_created_by_user_detail_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_entry" ADD CONSTRAINT "hours_entry_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_entry" ADD CONSTRAINT "hours_entry_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_entry" ADD CONSTRAINT "hours_entry_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_entry" ADD CONSTRAINT "hours_entry_entered_by_user_detail_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hours_entry" ADD CONSTRAINT "hours_entry_approved_by_user_detail_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_period_status" ADD CONSTRAINT "payroll_period_status_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_period_status" ADD CONSTRAINT "payroll_period_status_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_period_status" ADD CONSTRAINT "payroll_period_status_supervisor_approved_by_user_detail_id_fk" FOREIGN KEY ("supervisor_approved_by") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_period_status" ADD CONSTRAINT "payroll_period_status_finalized_by_user_detail_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_request" ADD CONSTRAINT "vacation_request_employee_id_user_detail_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_request" ADD CONSTRAINT "vacation_request_pay_period_id_pay_period_pay_period_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_period"("pay_period_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_request" ADD CONSTRAINT "vacation_request_facility_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_request" ADD CONSTRAINT "vacation_request_reviewed_by_user_detail_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;