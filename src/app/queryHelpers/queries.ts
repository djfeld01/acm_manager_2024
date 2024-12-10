"use server";

import { db } from "@/db";
import { bonus, tenantActivities } from "@/db/schema";
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

export async function addBonus(
  employeeId: string,
  sitelinkId: string,
  bonusType: string,
  bonusAmount: number,
  payPeriodId: string,
  date: string,
  bonusMonth: string
) {
  const response = await db
    .insert(bonus)
    .values({
      employeeId,
      facilityId: sitelinkId,
      bonusType,
      bonusAmount,
      payPeriodId,
      date,
      bonusMonth,
    })
    .returning({ id: bonus.employeeId, type: bonus.bonusType });
  console.log(response);
}
