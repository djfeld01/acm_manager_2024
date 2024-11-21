// src/pages/api/users-with-facilities.ts
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db"; // Drizzle DB instance
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const users = await db.query.userDetails.findMany({
    with: {
      usersToFacilities: {
        with: {
          storageFacility: true,
        },
      },
    },
  });

  const result = users.map((user) => ({
    id: user.id,
    fullName: `${user.lastName}, ${user.firstName}`,
    facilities: user.usersToFacilities.map((uf) => ({
      sitelinkId: uf.storageFacility.sitelinkId,
      facilityAbbreviation: uf.storageFacility.facilityAbbreviation,
      position: uf.position,
    })),
  }));

  return NextResponse.json(result);
}
