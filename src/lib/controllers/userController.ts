"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { CreateUserDetails, userDetails } from "@/db/schema/user";
import { Role } from "@/db/schema/user";

export async function insertUserDetails(values: CreateUserDetails) {
  return await db.insert(userDetails).values(values).returning();
}

export async function getUsers() {
  const session = await auth();
  const role = session?.user?.role || Role.USER;

  //if admin
  if (role === Role.ADMIN) {
    return await db.query.userDetails.findMany();
  }

  if (role === Role.SUPERVISOR) {
    const loggedInId = session?.user?.id || "";

    //get details id
    const userDetailsId = await db.query.userDetails.findMany();

    return "";
    // return await db.query.userDetails.findMany({
    //   where: (userDetails, { eq }) =>
    //     eq(userDetails.supervisorId, userDetailsId.id),
    // });
  }
}
