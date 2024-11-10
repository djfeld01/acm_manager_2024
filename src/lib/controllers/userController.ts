"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { userDetails, usersToFacilities } from "@/db/schema";
import { Role } from "@/db/schema/user";
import { asc, eq } from "drizzle-orm";
import { CreateUserDetails } from "@/db/schema/userDetails";

export type StorageFacility = {
  sitelinkId: string;
  facilityAbbreviation: string;
};
export type UserToFacility = {
  storageFacility: StorageFacility;
};

export type UserFacilityConnections = {
  fullName?: string;
  usersToFacilities?: UserToFacility[];
};
export async function insertUserDetails(values: CreateUserDetails) {
  return await db.insert(userDetails).values(values).returning();
}

export async function getUsers() {
  const session = await auth();
  const role = session?.user?.role || Role.USER;

  //if admin
  if (role === Role.ADMIN) {
    return await db.query.userDetails.findMany({
      with: { usersToFacilities: true },
    });
  }

  if (role === Role.SUPERVISOR) {
    const loggedInDetailId = session?.user?.userDetailId || "";

    //get details id
    //const userDetailsId = await db.query.userDetails.findMany();

    return await db.query.userDetails.findMany({
      where: eq(userDetails.supervisorId, loggedInDetailId),
      with: { usersToFacilities: true },
    });
  }
}

export async function getUsersWithConnectedFacilities() {
  const session = await auth();
  const role = session?.user?.role || Role.USER;

  //if admin
  if (role === Role.ADMIN) {
    return await db.query.userDetails.findMany({
      with: {
        usersToFacilities: {
          with: {
            storageFacility: {
              columns: { sitelinkId: true, facilityAbbreviation: true },
            },
          },
          columns: {},
        },
      },
      columns: { id: true, fullName: true },
      orderBy: [asc(userDetails.fullName)],
    });
  }

  if (role === Role.SUPERVISOR) {
    const loggedInDetailId = session?.user?.userDetailId || "";

    //get details id
    //const userDetailsId = await db.query.userDetails.findMany();

    return await db.query.userDetails.findMany({
      where: eq(userDetails.supervisorId, loggedInDetailId),
      with: {
        usersToFacilities: {
          with: {
            storageFacility: {
              columns: { sitelinkId: true, facilityAbbreviation: true },
            },
          },
          columns: {},
        },
      },
      columns: { id: true, fullName: true },
    });
  }
}

export type UserFacilityConnectionType = {
  userId: string;
  storageFacilityId: string;
};

export async function deleteUserFacilitieConnections(userId: string) {
  try {
    return db
      .delete(usersToFacilities)
      .where(eq(usersToFacilities.userId, userId))
      .returning();
  } catch (e) {}
}
export async function insertUserFacilitiesConnections(
  userFacilityConnections: UserFacilityConnectionType[]
) {
  try {
    return db
      .insert(usersToFacilities)
      .values(userFacilityConnections)
      .returning();
  } catch (e) {
    console.log(e);
  }
}
