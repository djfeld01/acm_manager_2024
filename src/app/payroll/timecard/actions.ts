"use server";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { bonus } from "@/db/schema";
import { Role } from "@/db/schema/user";
import { requireRole } from "@/lib/auth/utils";

/**
 * Each employee's committed shop bonus total for a pay period. Every shop
 * bonus should have a matching "Shop Cards" entry in Paycor. Bonus types
 * vary ("Shop", "Shop - July"), so match anything starting with "Shop".
 */
export async function getShopBonusTotals(
  payPeriodId: string
): Promise<{ employeeId: string; amount: number }[]> {
  await requireRole([Role.ADMIN, Role.OWNER]);

  const rows = await db
    .select({ employeeId: bonus.employeeId, amount: bonus.bonusAmount })
    .from(bonus)
    .where(and(eq(bonus.payPeriodId, payPeriodId), ilike(bonus.bonusType, "shop%")));

  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!r.employeeId) continue;
    totals.set(r.employeeId, (totals.get(r.employeeId) ?? 0) + r.amount);
  }
  return Array.from(totals, ([employeeId, amount]) => ({ employeeId, amount }));
}
