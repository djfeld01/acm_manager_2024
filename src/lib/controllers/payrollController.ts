"use server";
import { db } from "@/db";
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