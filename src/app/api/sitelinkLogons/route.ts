import { db } from "@/db";
import {
  sitelinkLogons,
  tenantActivities,
  userDetails,
  usersToFacilities,
} from "@/db/schema";
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
  let usersToFacilitiesArray = await db.query.usersToFacilities.findMany({});
  let users = await db.query.userDetails.findMany({
    columns: { fullName: true, id: true },
  });

  const toInsert = [];

  // Use for...of instead of map
  for (const sitelinkLogon of body) {
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

    const employeeIndex = users.findIndex(
      (user) => user.fullName === sitelinkLogon.fullName.trim()
    );

    if (employeeIndex > -1) {
      const insertedUsertoFacility = await db
        .insert(usersToFacilities)
        .values({
          userId: users[employeeIndex].id,
          sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
          storageFacilityId: sitelinkLogon.sitelinkId,
        })
        .returning({ insertedSitelinkEmployeeId: usersToFacilities.userId })
        .onConflictDoNothing();

      usersToFacilitiesArray.push({
        userId: users[employeeIndex]?.id || "",
        sitelinkEmployeeId: sitelinkLogon.sitelinkEmployeeId,
        storageFacilityId: sitelinkLogon.sitelinkId,
        primarySite: null,
        rentsUnits: null,
      });

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
    const email = `${firstName
      .charAt(0)
      .toLowerCase()}.${lastName.toLowerCase()}@advantageconsultingmanagement.com`;

    const insertedEmployee = await db
      .insert(userDetails)
      .values({ firstName, lastName, email })
      .returning({
        insertedId: userDetails.id,
        fullName: userDetails.fullName,
      })
      .onConflictDoNothing();

    users.push({
      fullName: sitelinkLogon.fullName.trim(),
      id: insertedEmployee[0].insertedId,
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
