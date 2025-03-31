import {
  bigint,
  date,
  integer,
  numeric,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { bankAccount, storageFacilities } from "@/db/schema";
import { relations } from "drizzle-orm";

const bankBalance = pgTable(
  "bank_balance",
  {
    bankAccountId: integer("bank_account_id")
      .notNull()
      .references(() => bankAccount.bankAccountId),
    date: date("date").notNull().defaultNow(),
    balance: numeric("balance").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.bankAccountId, t.date] }),
  })
);

export const bankBalanceRelations = relations(bankBalance, ({ one }) => ({
  facility: one(bankAccount, {
    fields: [bankBalance.bankAccountId],
    references: [bankAccount.bankAccountId],
  }),
}));

export default bankBalance;
