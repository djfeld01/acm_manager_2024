import { db } from "@/db";
import {
  sitelinkLogons,
  tenantActivities,
  userDetails,
  usersToFacilities,
} from "@/db/schema";
import { desc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export type SitelinkLogonType = {
  sitelinkId: string;
  LogOnID: string;
  sitelinkEmployeeId: string;
  dateTime: Date;
  computerName: string;
  computerIP: string;
  fullName: string;
}[];
export async function POST(req: NextRequest) {
  const body: SitelinkLogonType = await req.json();
  let usersToFacilitiesArray = await db.query.usersToFacilities.findMany({
    // with: { user: { columns: { fullName: true } } },
  });
  let users = await db.query.userDetails.findMany({
    columns: { fullName: true, id: true, email: true },
  });

  const toInsert = [];

  // Use for...of instead of map
  for (const sitelinkLogon of body) {
    // Coerce to string — the external system sends sitelinkEmployeeId as a JSON
    // number, but the DB column is varchar. Without this, the strict-equality
    // check below (number 1112 vs string "1112") always misses and the INSERT
    // path hits the UNIQUE constraint on sitelink_employee_id.
    const employeeId = String(sitelinkLogon.sitelinkEmployeeId);

    //check to see if the employeeId is already in UserToFacility
    const userToFacility = usersToFacilitiesArray.some(
      (userToFacility) =>
        employeeId === userToFacility.sitelinkEmployeeId
    );

    if (userToFacility) {
      toInsert.push({
        sitelinkEmployeeId: employeeId,
        dateTime: new Date(sitelinkLogon.dateTime),
        computerName: sitelinkLogon.computerName,
        computerIP: sitelinkLogon.computerIP,
      });
      continue; // Move to the next iteration
    }

    const [lastName, firstName] = sitelinkLogon.fullName
      .split(", ")
      .map((name) => name.trim());
    let email = `${firstName
      .charAt(0)
      .toLowerCase()}.${lastName.toLowerCase()}@advantageconsultingmanagement.com`;

    if (sitelinkLogon.fullName.trim() === "Willey, Tabatha") {
      email = "tabby@advantageconsultingmanagement.com";
    }

    const employeeIndex = users.findIndex((user) => user.email === email);

    if (employeeIndex > -1) {
      const insertedUsertoFacility = await db
        .insert(usersToFacilities)
        .values({
          userId: users[employeeIndex].id,
          sitelinkEmployeeId: employeeId,
          storageFacilityId: sitelinkLogon.sitelinkId,
        })
        .returning({ insertedSitelinkEmployeeId: usersToFacilities.userId })
        // .onConflictDoNothing();
        .onConflictDoUpdate({
          target: [
            usersToFacilities.storageFacilityId,
            usersToFacilities.userId,
          ],
          set: { sitelinkEmployeeId: employeeId },
          // Only fill in a NULL sitelinkEmployeeId — never overwrite an existing
          // one. If we unconditionally update, the in-memory array keeps the old
          // value and a later logon in this batch for the old ID passes the
          // array check but fails the FK constraint on sitelink_logon.
          setWhere: isNull(usersToFacilities.sitelinkEmployeeId),
        });

      // result is empty when the conflict fired but setWhere was false (the row
      // already had a different sitelinkEmployeeId). Skip both the array push
      // and the logon insert in that case — we have no valid FK target.
      if (insertedUsertoFacility.length === 0) {
        continue;
      }

      usersToFacilitiesArray.push({
        userId: users[employeeIndex]?.id || "",
        sitelinkEmployeeId: employeeId,
        storageFacilityId: sitelinkLogon.sitelinkId,
        primarySite: null,
        rentsUnits: null,
        position: null,
        //user: { fullName: users[employeeIndex].fullName },
      });

      toInsert.push({
        sitelinkEmployeeId: employeeId,
        dateTime: new Date(sitelinkLogon.dateTime),
        computerName: sitelinkLogon.computerName,
        computerIP: sitelinkLogon.computerIP,
      });
      continue; // Move to the next iteration
    }
    //console.log("about to call trim at line 85");

    const insertedEmployee = await db
      .insert(userDetails)
      .values({ firstName, lastName, email })
      .returning({
        insertedId: userDetails.id,
        fullName: userDetails.fullName,
      })
      .onConflictDoNothing();

    //console.log("about to call trim at line 101", sitelinkLogon.fullName);
    users.push({
      fullName: sitelinkLogon.fullName.trim(),
      id: insertedEmployee[0].insertedId,
      email: email,
    });

    const insertedUserConnection = await db
      .insert(usersToFacilities)
      .values({
        userId: insertedEmployee[0].insertedId,
        storageFacilityId: sitelinkLogon.sitelinkId,
        sitelinkEmployeeId: employeeId,
      })
      .returning({ insertedUserId: usersToFacilities.userId })
      .onConflictDoNothing();

    usersToFacilitiesArray.push({
      userId: insertedUserConnection[0].insertedUserId,
      sitelinkEmployeeId: employeeId,
      storageFacilityId: sitelinkLogon.sitelinkId,
      primarySite: null,
      rentsUnits: null,
      position: null,
      //user: { fullName: users[employeeIndex].fullName },
    });

    toInsert.push({
      sitelinkEmployeeId: employeeId,
      dateTime: new Date(sitelinkLogon.dateTime),
      computerName: sitelinkLogon.computerName,
      computerIP: sitelinkLogon.computerIP,
    });
  }

  // Insert the logs into the database
  const res = await db
    .insert(sitelinkLogons)
    .values(toInsert)
    .onConflictDoNothing();

  // NOTE: this used to refresh logon_with_facility_user_view inline, right
  // here, on every sync call (roughly hourly all day), which fully locked the
  // view for up to 79s each time. That materialized view has since been
  // retired entirely (migration 0049) -- the "latest logons" widget it fed now
  // reads the base tables directly (getLatestLogonsForFacility), so there is
  // nothing to refresh here at all.

  return NextResponse.json(res);
}

export async function GET(req: NextRequest) {
  const response = await db.query.sitelinkLogons.findMany({
    orderBy: [desc(sitelinkLogons.dateTime)],
    limit: 5,
  });
  return NextResponse.json({ response });
}
//
