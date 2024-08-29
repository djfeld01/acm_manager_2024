import {
  bigint,
  date,
  integer,
  numeric,
  PgColumn,
  pgTable,
  PgTableWithColumns,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";
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
    collectionsGoal: numeric("collections_goal"),
    retailGoal: numeric("retail_goal"),
    rentalGoal: integer("rental_goal"),
    name: varchar("name"),
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

export const insertMonthlyGoalsSchema = createInsertSchema(monthlyGoals, {});

export type CreateMonthlyGoals = z.infer<typeof insertMonthlyGoalsSchema>;

export default monthlyGoals;
