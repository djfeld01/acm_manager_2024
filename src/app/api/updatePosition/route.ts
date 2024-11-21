// src/pages/api/updatePosition.ts
import { db } from "@/db"; // Your Drizzle DB instance
import { usersToFacilities } from "@/db/schema"; // Import schema
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  try {
    const { userId, updates } = await req.json(); // Expect `updates` to be an array of { storageFacilityId, position } body;

    if (!userId || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid input" });
    }

    for (const update of updates) {
      const { storageFacilityId, position } = update;
      await db
        .update(usersToFacilities)
        .set({ position })
        .where(
          and(
            eq(usersToFacilities.userId, userId),
            eq(usersToFacilities.storageFacilityId, storageFacilityId)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating positions:", error);
    return NextResponse.json({ error: "Internal server error" });
  }
}
