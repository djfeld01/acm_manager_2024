import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  index,
  date,
  real,
  unique,
  primaryKey,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { storageFacilities } from "@/db/schema";

// export const receivablePeriodTypeEnum = pgEnum("recievable_period", [
//   "zeroToTen",
//   "elevenToThirty",
//   "thirtyOneToSixty",
//   "sixtyToNinety",
//   "ninetyOneToOneTwenty",
//   "oneTwentyToOneEighty",
//   "oneEightyOneToThreeSixty",
//   "overThreeSixty",
// ]);

const dailyManagementReceivable = pgTable(
  "daily_management_receivable",
  {
    facilityId: varchar("facility_id")
      .notNull()
      .references(() => storageFacilities.sitelinkId),
    date: date("date").notNull(),
    delinquentTotal: real("delinquent_total").notNull(),
    delinquentUnits: real("delinquent_units").notNull(),
    lowerDayRange: integer("lower_day_range").notNull(),
    upperDayRange: integer("upper_day_range").notNull(),
    dateCreated: timestamp("date_created", {
      precision: 6,
      withTimezone: true,
    }),
    dateUpdated: timestamp("date_updated", {
      precision: 6,
      withTimezone: true,
    }),
  },
  (table) => ({
    dateIndex: index().on(table.date),
    pkDateFacility: primaryKey({
      columns: [
        table.facilityId,
        table.date,
        table.lowerDayRange,
        table.upperDayRange,
      ],
    }),
  })
);

export const dailyManagementReceivableRelations = relations(
  dailyManagementReceivable,
  ({ one }) => ({
    facility: one(storageFacilities, {
      fields: [dailyManagementReceivable.facilityId],
      references: [storageFacilities.sitelinkId],
    }),
  })
);

export default dailyManagementReceivable;
