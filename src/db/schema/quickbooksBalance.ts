import {
  bigint,
  date,
  numeric,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";
import { relations } from "drizzle-orm";

const quickbooksBalance = pgTable(
  "quickbooks_balance",
  {
    sitelinkId: varchar("sitelink_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    date: date("date").notNull().defaultNow(),
    balance: numeric("balance").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.sitelinkId, t.date] }),
  })
);

export const quickbooksBalanceRelations = relations(
  quickbooksBalance,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [quickbooksBalance.sitelinkId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export default quickbooksBalance;
