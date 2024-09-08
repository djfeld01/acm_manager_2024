CREATE TABLE IF NOT EXISTS "user_detail" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text GENERATED ALWAYS AS ("user_detail"."first_name" || ' ' || "user_detail"."last_name") STORED,
	"initials" text GENERATED ALWAYS AS (LEFT("user_detail"."first_name",1) || LEFT("user_detail"."last_name",1)) STORED,
	"paycor_employee_id" integer,
	"sitelink_employee_id" integer
);
