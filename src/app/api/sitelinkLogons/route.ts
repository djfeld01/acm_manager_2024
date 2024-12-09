import { db } from "@/db";
import {
  sitelinkLogons,
  tenantActivities,
  userDetails,
  usersToFacilities,
} from "@/db/schema";
import logonWithFacilityUserView from "@/db/schema/views/logonWithFacityUserView";
import { desc, eq } from "drizzle-orm";
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
    //check to see if the employeeId is already in UserToFacility
    const userToFacility = usersToFacilitiesArray.some(
      (userToFacility) =>
        sitelinkLogon.sitelinkEmployeeId === userToFacility.sitelinkEmployeeId
    );

    if (userToFacility) {
      toInsert.push({
        sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
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

    if (sitelinkLogon.fullName === "Willey, Tabatha") {
      email = "tabby@advantageconsultingmanagement.com";
    }

    const employeeIndex = users.findIndex((user) => user.email === email);

    if (employeeIndex > -1) {
      const insertedUsertoFacility = await db
        .insert(usersToFacilities)
        .values({
          userId: users[employeeIndex].id,
          sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
          storageFacilityId: sitelinkLogon.sitelinkId,
        })
        .returning({ insertedSitelinkEmployeeId: usersToFacilities.userId })
        // .onConflictDoNothing();
        .onConflictDoUpdate({
          target: [
            usersToFacilities.storageFacilityId,
            usersToFacilities.userId,
          ],
          set: { sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId },
        });

      usersToFacilitiesArray.push({
        userId: users[employeeIndex]?.id || "",
        sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
        storageFacilityId: sitelinkLogon.sitelinkId,
        primarySite: null,
        rentsUnits: null,
        position: null,
        //user: { fullName: users[employeeIndex].fullName },
      });

      toInsert.push({
        sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
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
        sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
      })
      .returning({ insertedUserId: usersToFacilities.userId })
      .onConflictDoNothing();

    usersToFacilitiesArray.push({
      userId: insertedUserConnection[0].insertedUserId,
      sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
      storageFacilityId: sitelinkLogon.sitelinkId,
      primarySite: null,
      rentsUnits: null,
      position: null,
      //user: { fullName: users[employeeIndex].fullName },
    });

    toInsert.push({
      sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
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

  try {
    await db.refreshMaterializedView(logonWithFacilityUserView);
  } catch (e) {
    console.log(e);
  }

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
