import {
  bigint,
  boolean,
  date,
  integer,
  numeric,
  PgColumn,
  pgTable,
  PgTableWithColumns,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const monthlyGoals = pgTable(
  "monthly_goal",
  {
    month: date("month", { mode: "date" }).defaultNow().notNull(),
    sitelinkId: varchar("sitelink_id")
      .references(() => storageFacilities.sitelinkId)
      .notNull(),
    collectionsGoal: numeric("collections_goal").notNull(),
    retailGoal: numeric("retail_goal").notNull(),
    rentalGoal: integer("rental_goal").notNull(),
    hasBeenPaid: boolean("has_been_paid").default(false),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.month, t.sitelinkId] }),
  })
);

export const monthlyGoalsRelations = relations(monthlyGoals, ({ one }) => ({
  facility: one(storageFacilities, {
    fields: [monthlyGoals.sitelinkId],
    references: [storageFacilities.sitelinkId],
  }),
}));

export const insertMonthlyGoalsSchema = createInsertSchema(monthlyGoals, {
  rentalGoal: z.string().transform((val) => parseFloat(val)),
});

export type CreateMonthlyGoals = z.infer<typeof insertMonthlyGoalsSchema>;

export default monthlyGoals;
