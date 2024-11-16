import { relations, sql, SQL } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  date,
  integer,
  pgTable,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersToFacilities, users } from "@/db/schema";

const userDetails = pgTable("user_detail", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fullName: text("full_name").generatedAlwaysAs(
    (): SQL => sql`${userDetails.lastName} || ', ' || ${userDetails.firstName}`
  ),
  initials: text("initials").generatedAlwaysAs(
    (): SQL =>
      sql`LEFT(${userDetails.firstName},1) || LEFT(${userDetails.lastName},1)`
  ),
  //connect to the user table from auth.js
  paycorEmployeeId: integer("paycor_employee_id").unique(),
  supervisorId: text("supervisor_id").references(
    (): AnyPgColumn => userDetails.id
  ),
  hireDate: date("hire_date"),
  terminationDate: date("termination_date"),
  isActiveEmployee: boolean("is_active_employee").default(true),
});

export const insertUserDetailsSchema = createInsertSchema(userDetails, {
  email: (schema) => schema.email.email(),
  paycorEmployeeId: z.string().transform((val) => parseFloat(val)),
});

export type CreateUserDetails = z.infer<typeof insertUserDetailsSchema>;

export const userDetailsRelations = relations(userDetails, ({ one, many }) => ({
  usersToFacilities: many(usersToFacilities),
  user: one(users),
  supervisor: one(userDetails, {
    fields: [userDetails.supervisorId],
    references: [userDetails.id],
  }),
}));

export default userDetails;
