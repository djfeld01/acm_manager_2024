"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import monthlyGoals from "@/db/schema/monthlyGoals";
import { storageFacilities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export type FacilityGoalRow = {
  sitelinkId: string;
  facilityAbbreviation: string;
  facilityName: string;
  rentalGoal: number | null;
  retailGoal: number | null;
  collectionsGoal: number | null;
};

export type UpsertGoalInput = {
  sitelinkId: string;
  month: string; // "YYYY-MM-01"
  rentalGoal: number;
  retailGoal: number;
  collectionsGoal: number;
};

export async function getFacilitiesWithGoals(
  year: number,
  month: number
): Promise<FacilityGoalRow[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const firstOfMonth = new Date(year, month - 1, 1);

  const facilities = await db.query.storageFacilities.findMany({
    where: eq(storageFacilities.currentClient, true),
    columns: {
      sitelinkId: true,
      facilityAbbreviation: true,
      facilityName: true,
    },
    with: {
      monthlyGoals: {
        where: (mg, { eq }) => eq(mg.month, firstOfMonth),
      },
    },
    orderBy: (sf, { asc }) => asc(sf.facilityAbbreviation),
  });

  return facilities.map((f) => ({
    sitelinkId: f.sitelinkId,
    facilityAbbreviation: f.facilityAbbreviation,
    facilityName: f.facilityName,
    rentalGoal: f.monthlyGoals[0]?.rentalGoal ?? null,
    retailGoal:
      f.monthlyGoals[0]?.retailGoal != null
        ? parseFloat(f.monthlyGoals[0].retailGoal as unknown as string)
        : null,
    collectionsGoal:
      f.monthlyGoals[0]?.collectionsGoal != null
        ? parseFloat(f.monthlyGoals[0].collectionsGoal as unknown as string)
        : null,
  }));
}

export async function upsertGoals(
  goals: UpsertGoalInput[]
): Promise<{ count: number }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const values = goals.map((g) => {
    const [yearStr, monthStr] = g.month.split("-");
    const firstOfMonth = new Date(
      parseInt(yearStr),
      parseInt(monthStr) - 1,
      1
    );
    return {
      month: firstOfMonth,
      sitelinkId: g.sitelinkId,
      rentalGoal: g.rentalGoal,
      retailGoal: String(g.retailGoal),
      collectionsGoal: String(g.collectionsGoal),
    };
  });

  await db
    .insert(monthlyGoals)
    .values(values)
    .onConflictDoUpdate({
      target: [monthlyGoals.month, monthlyGoals.sitelinkId],
      set: {
        rentalGoal: sql`excluded.rental_goal`,
        retailGoal: sql`excluded.retail_goal`,
        collectionsGoal: sql`excluded.collections_goal`,
      },
    });

  return { count: goals.length };
}
