import { db } from "@/db";
import { usersToFacilities, storageFacilities, userDetails } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getUserFacilities(userId: string) {
  try {
    const userFacilities = await db
      .select({
        sitelinkId: storageFacilities.sitelinkId,
        facilityName: storageFacilities.facilityName,
        facilityAbbreviation: storageFacilities.facilityAbbreviation,
        position: usersToFacilities.position,
        primarySite: usersToFacilities.primarySite,
        rentsUnits: usersToFacilities.rentsUnits,
      })
      .from(usersToFacilities)
      .innerJoin(
        storageFacilities,
        eq(usersToFacilities.storageFacilityId, storageFacilities.sitelinkId)
      )
      .where(eq(usersToFacilities.userId, userId));

    return userFacilities;
  } catch (error) {
    console.error("Error fetching user facilities:", error);
    return [];
  }
}

export async function getAllUserFacilityConnections() {
  try {
    const userFacilityConnections = await db
      .select({
        sitelinkId: storageFacilities.sitelinkId,
        facilityName: storageFacilities.facilityName,
        facilityAbbreviation: storageFacilities.facilityAbbreviation,
        position: usersToFacilities.position,
        fullName: userDetails.fullName,
      })
      .from(usersToFacilities)
      .innerJoin(
        storageFacilities,
        eq(usersToFacilities.storageFacilityId, storageFacilities.sitelinkId)
      )
      .innerJoin(userDetails, eq(usersToFacilities.userId, userDetails.id));

    return userFacilityConnections;
  } catch (error) {
    console.error("Error fetching user facility connections:", error);
    return [];
  }
}
