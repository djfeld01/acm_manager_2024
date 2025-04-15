CREATE TYPE "public"."connection_types" AS ENUM('cash', 'creditCard');--> statement-breakpoint
CREATE TYPE "public"."deposit_types" AS ENUM('all', 'cash', 'creditCard', 'truck', 'other');--> statement-breakpoint
CREATE TABLE "bank_account" (
	"bank_account_id" serial PRIMARY KEY NOT NULL,
	"sitelink_id" varchar NOT NULL,
	"bank_name" varchar NOT NULL,
	"bank_account_number" varchar NOT NULL,
	"bank_routing_number" varchar NOT NULL,
	"bank_account_type" varchar NOT NULL,
	"deposit_type" "deposit_types" DEFAULT 'all' NOT NULL,
	"operating_account" boolean DEFAULT true NOT NULL,
	CONSTRAINT "bank_account_bank_account_number_unique" UNIQUE("bank_account_number")
);
--> statement-breakpoint
CREATE TABLE "bank_balance" (
	"bank_account_id" integer NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"balance" numeric NOT NULL,
	CONSTRAINT "bank_balance_bank_account_id_date_pk" PRIMARY KEY("bank_account_id","date")
);
--> statement-breakpoint
CREATE TABLE "bank_transaction" (
	"bank_transaction_id" serial PRIMARY KEY NOT NULL,
	"downloaded_id" varchar NOT NULL,
	"bank_account_id" integer NOT NULL,
	"transaction_date" date DEFAULT now() NOT NULL,
	"transaction_type" "deposit_types" NOT NULL,
	"transaction_amount" numeric NOT NULL,
	"committed" boolean DEFAULT false,
	CONSTRAINT "bank_transaction_bank_account_id_downloaded_id_transaction_amount_transaction_date_unique" UNIQUE("bank_account_id","downloaded_id","transaction_amount","transaction_date")
);
--> statement-breakpoint
CREATE TABLE "transactions_to_daily_payments" (
	"bank_transaction_id" integer NOT NULL,
	"daily_payment_id" integer NOT NULL,
	"amount" real NOT NULL,
	"deposit_difference" real NOT NULL,
	"connection_type" "connection_types" NOT NULL,
	"note" varchar,
	CONSTRAINT "transactions_to_daily_payments_bank_transaction_id_daily_payment_id_pk" PRIMARY KEY("bank_transaction_id","daily_payment_id")
);
--> statement-breakpoint
ALTER TABLE "bonus" ALTER COLUMN "date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bonus" ADD COLUMN "bonus_month" date;--> statement-breakpoint
ALTER TABLE "daily_payment" ADD COLUMN "cash_check_committed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "daily_payment" ADD COLUMN "credit_card_committed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_sitelink_id_storage_facility_sitelink_id_fk" FOREIGN KEY ("sitelink_id") REFERENCES "public"."storage_facility"("sitelink_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_balance" ADD CONSTRAINT "bank_balance_bank_account_id_bank_account_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("bank_account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transaction" ADD CONSTRAINT "bank_transaction_bank_account_id_bank_account_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("bank_account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD CONSTRAINT "transactions_to_daily_payments_bank_transaction_id_bank_transaction_bank_transaction_id_fk" FOREIGN KEY ("bank_transaction_id") REFERENCES "public"."bank_transaction"("bank_transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions_to_daily_payments" ADD CONSTRAINT "transactions_to_daily_payments_daily_payment_id_daily_payment_daily_payment_id_fk" FOREIGN KEY ("daily_payment_id") REFERENCES "public"."daily_payment"("daily_payment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_transaction_transaction_date_index" ON "bank_transaction" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "bank_transaction_bank_account_id_index" ON "bank_transaction" USING btree ("bank_account_id");