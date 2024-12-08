"use server";

import { db } from "@/db";
import { tenantActivities } from "@/db/schema";
import { inArray } from "drizzle-orm";

export async function mutateCommitActivityCommissionToPayroll(updates: {
  activitiesArray: number[];
  payPeriodId: string;
}) {
  const { activitiesArray, payPeriodId } = updates;
  const data = await db
    .update(tenantActivities)
    .set({ payPeriodId: payPeriodId })
    .where(inArray(tenantActivities.Id, activitiesArray))
    .returning({ ids: tenantActivities.Id });
  return data;
}
