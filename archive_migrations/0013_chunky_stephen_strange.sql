ALTER TABLE "tenant_activity" ALTER COLUMN "employee_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "tenant_activity" ALTER COLUMN "employee_initials" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "tenant_activity" ADD COLUMN "going_to_delete" varchar;