"use server";
import { db } from "@/db";
import bonus, { AddBonus } from "@/db/schema/bonus";
import holiday, { AddHolidayHours } from "@/db/schema/holiday";
import mileage, { AddMileage } from "@/db/schema/mileage";
import vacation, { AddVacationHours } from "@/db/schema/vacation";

export async function addVacation(vacationValues: AddVacationHours) {
  try {
    return db.insert(vacation).values(vacationValues).returning();
  } catch (e) {
    console.log(e);
  }
}
export async function addMileage(mileageValues: AddMileage) {
  try {
    return db.insert(mileage).values(mileageValues).returning();
  } catch (e) {
    console.log(e);
  }
}

export async function addHoliday(holidayValues: AddHolidayHours) {
  try {
    return db.insert(holiday).values(holidayValues).returning();
  } catch (e) {
    console.log(e);
  }
}

export async function addBonus(bonusValues: AddBonus) {
  try {
    return db.insert(bonus).values(bonusValues).returning();
  } catch (e) {
    console.log(e);
  }
}
