CREATE TABLE "owner" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"address" varchar(255),
	"city" varchar(100),
	"state" varchar(2),
	"zip" varchar(16)
);
--> statement-breakpoint
CREATE TABLE "ownership_group" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"ein" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "ownership_group_to_owners" (
	"ownership_group_id" text NOT NULL,
	"owner_id" text NOT NULL,
	CONSTRAINT "ownership_group_to_owners_ownership_group_id_owner_id_pk" PRIMARY KEY("ownership_group_id","owner_id")
);
--> statement-breakpoint
ALTER TABLE "storage_facility" ADD COLUMN "area_manager_id" text;--> statement-breakpoint
ALTER TABLE "storage_facility" ADD COLUMN "ownership_group_id" text;--> statement-breakpoint
ALTER TABLE "ownership_group_to_owners" ADD CONSTRAINT "ownership_group_to_owners_ownership_group_id_ownership_group_id_fk" FOREIGN KEY ("ownership_group_id") REFERENCES "public"."ownership_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_group_to_owners" ADD CONSTRAINT "ownership_group_to_owners_owner_id_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_facility" ADD CONSTRAINT "storage_facility_area_manager_id_user_detail_id_fk" FOREIGN KEY ("area_manager_id") REFERENCES "public"."user_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_facility" ADD CONSTRAINT "storage_facility_ownership_group_id_ownership_group_id_fk" FOREIGN KEY ("ownership_group_id") REFERENCES "public"."ownership_group"("id") ON DELETE no action ON UPDATE no action;