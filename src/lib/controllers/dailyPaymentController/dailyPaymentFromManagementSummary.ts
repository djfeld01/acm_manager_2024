import { db } from "@/db";
import { dailyManagementPaymentReceipt } from "@/db/schema";

export async function dailyPaymentFromManagementSummary(facilityId: string) {
  const dailyPaymentFromManagementSummary =
    await db.query.dailyManagementPaymentReceipt.findMany({
      where: (dailyManagementPaymentReceipt, { eq }) =>
        eq(dailyManagementPaymentReceipt.facilityId, facilityId),
    });
  return dailyPaymentFromManagementSummary;
}
