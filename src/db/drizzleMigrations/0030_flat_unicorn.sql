CREATE INDEX "inquiry_date_placed_index" ON "inquiry" USING btree ("date_placed");--> statement-breakpoint
CREATE INDEX "inquiry_first_follow_up_date_last_follow_up_date_index" ON "inquiry" USING btree ("first_follow_up_date","last_follow_up_date");--> statement-breakpoint
CREATE INDEX "inquiry_cancel_date_index" ON "inquiry" USING btree ("cancel_date");--> statement-breakpoint
CREATE INDEX "inquiry_expiration_date_index" ON "inquiry" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "inquiry_lease_date_index" ON "inquiry" USING btree ("lease_date");--> statement-breakpoint
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_date_placed_tenant_id_sitelink_id_unique" UNIQUE("date_placed","tenant_id","sitelink_id");