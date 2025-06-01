import {
  boolean,
  integer,
  numeric,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";
import storageFacilities from "./storageFacilities";
import { relations } from "drizzle-orm";
import inquiry from "./inquiry";

// Unit Table
const unit = pgTable("unit", {
  unitId: integer("unit_id").notNull().primaryKey(),
  sitelinkId: varchar("sitelink_id").references(
    () => storageFacilities.sitelinkId
  ),
  unitName: varchar("unit_name", { length: 32 }),
  size: varchar("size", { length: 32 }),
  width: numeric("width"),
  length: numeric("length"),
  area: numeric("area"),
  isMobile: boolean("is_mobile"),
  isClimate: boolean("is_climate"),
  isAlarm: boolean("is_alarm"),
  isPower: boolean("is_power"),
  isInside: boolean("is_inside"),
  floor: integer("floor"),
  unitTypeId: integer("unit_type_id"),
  unitTypeName: varchar("unit_type_name", { length: 64 }),
});

export const unitRelations = relations(unit, ({ many }) => ({
  inquiry: many(inquiry),
}));

export default unit;
