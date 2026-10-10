"use server";
import { db } from "@/db";
import { tenantActivities } from "@/db/schema";
import { sql } from "drizzle-orm";
import { assertAccess } from "../_lib/server/guard";
import { parseSpecialMonths } from "../_lib/specials";

export interface SpecialMapping {
  plan: string;
  moveIns: number;
  /** Months until the discount ends; null = text not recognized. */
  months: number | null;
}

/** Every distinct move-in special at this facility, with how it was read —
 *  for the user to confirm before eligibility dates rely on it. */
export async function getSpecialMappings(sitelinkId: string): Promise<SpecialMapping[]> {
  await assertAccess(sitelinkId);
  const rows = await db
    .select({
      plan: tenantActivities.moveInDiscountPlan,
      n: sql<number>`count(*)::int`,
    })
    .from(tenantActivities)
    .where(
      sql`${tenantActivities.facilityId} = ${sitelinkId} and ${tenantActivities.activityType} = 'MoveIn'`
    )
    .groupBy(tenantActivities.moveInDiscountPlan)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => ({
    plan: (r.plan ?? "").trim() || "(blank)",
    moveIns: r.n,
    months: parseSpecialMonths(r.plan),
  }));
}
