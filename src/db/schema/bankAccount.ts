import { boolean, pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { bankBalance, bankTransaction, storageFacilities } from "@/db/schema";
import { relations } from "drizzle-orm";

export const depositTypes = pgEnum("deposit_types", [
  "all",
  "cash",
  "creditCard",
  "truck",
  "other",
]);
const bankAccount = pgTable("bank_account", {
  bankAccountId: serial("bank_account_id").primaryKey(),
  sitelinkId: varchar("sitelink_id")
    .notNull()
    .references(() => storageFacilities.sitelinkId),
  bankName: varchar("bank_name").notNull(),
  bankAccountNumber: varchar("bank_account_number").notNull().unique(),
  bankRoutingNumber: varchar("bank_routing_number").notNull(),
  bankAccountType: varchar("bank_account_type").notNull(),
  depositType: depositTypes("deposit_type").notNull().default("all"),
  operatingAccount: boolean("operating_account").default(true).notNull(),
});

export const bankAccountRelations = relations(bankAccount, ({ one, many }) => ({
  facility: one(storageFacilities, {
    fields: [bankAccount.sitelinkId],
    references: [storageFacilities.sitelinkId],
  }),
  bankTransactions: many(bankTransaction),
  bankBalance: many(bankBalance),
}));

export default bankAccount;
