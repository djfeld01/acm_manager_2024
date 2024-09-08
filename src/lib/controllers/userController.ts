"use server";

import { db } from "@/db";
import { CreateUserDetails, userDetails } from "@/db/schema/user";

export async function insertUserDetails(values: CreateUserDetails) {
  console.log(values);
  return await db.insert(userDetails).values(values).returning();
}
