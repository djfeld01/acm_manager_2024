"use server";

import { db } from "@/db";
import { tenantActivities } from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addUnpaidCommissionsToPayroll(
  commissionIds: string[],
  payrollId: string
) {
  try {
    // Update the selected tenant activities to include the payroll ID
    await db
      .update(tenantActivities)
      .set({ payPeriodId: payrollId })
      .where(
        and(
          inArray(
            tenantActivities.Id,
            commissionIds.map((id) => parseInt(id))
          ),
          // Safety check to ensure we only update unpaid commissions
          isNull(tenantActivities.payPeriodId)
        )
      );

    // Revalidate the payroll page to refresh the data
    revalidatePath("/payroll");

    return {
      success: true,
      message: `Successfully added ${commissionIds.length} commissions to payroll`,
    };
  } catch (error) {
    console.error("Error adding unpaid commissions:", error);
    return { success: false, message: "Failed to add commissions to payroll" };
  }
}
