import { pgMaterializedView } from "drizzle-orm/pg-core";
import {
  sitelinkLogons,
  userDetails,
  storageFacilities,
  usersToFacilities,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const logonWithFacilityUserView = pgMaterializedView(
  "logon_with_facility_user_view"
).as((qb) =>
  qb
    .select({
      employeeId: sitelinkLogons.sitelinkEmployeeId,
      logonDate: sitelinkLogons.dateTime,
      computerName: sitelinkLogons.computerName,
      computerIP: sitelinkLogons.computerIP,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      facilityName: storageFacilities.facilityName,
      facilityAbbreviation: storageFacilities.facilityAbbreviation,
      storageFacilityId: usersToFacilities.storageFacilityId,
      userId: usersToFacilities.userId,
    })
    .from(sitelinkLogons)
    .innerJoin(
      usersToFacilities,
      eq(
        sitelinkLogons.sitelinkEmployeeId,
        usersToFacilities.sitelinkEmployeeId
      )
    )
    .innerJoin(userDetails, eq(usersToFacilities.userId, userDetails.id))
    .innerJoin(
      storageFacilities,
      eq(usersToFacilities.storageFacilityId, storageFacilities.sitelinkId)
    )
);

export default logonWithFacilityUserView;
