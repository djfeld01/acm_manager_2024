import { db } from "@/db";
import { dailyPayments, storageFacilities } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// Types for aggregated daily payment data
export interface DailyPaymentTotals {
  facilityId: string;
  date: string;
  cashCheckTotal: number;
  creditCardTotal: number;
  totalAmount: number;
  cashCheckCommitted: boolean;
  creditCardCommitted: boolean;
}

export interface FacilityMonthlyTotals {
  facilityId: string;
  facilityName: string;
  month: number;
  year: number;
  totalCashCheck: number;
  totalCreditCard: number;
  totalAmount: number;
  dailyBreakdown: DailyPaymentTotals[];
}

/**
 * Calculate cash + check total for a daily payment record
 */
export function calculateCashCheckTotal(
  payment: typeof dailyPayments.$inferSelect
): number {
  const cash = payment.cash || 0;
  const check = payment.check || 0;
  return Number((cash + check).toFixed(2));
}

/**
 * Calculate credit card total for a daily payment record
 * Includes: visa, mastercard, americanExpress, discover, ach, dinersClub, debit
 */
export function calculateCreditCardTotal(
  payment: typeof dailyPayments.$inferSelect
): number {
  const visa = payment.visa || 0;
  const mastercard = payment.mastercard || 0;
  const americanExpress = payment.americanExpress || 0;
  const discover = payment.discover || 0;
  const ach = payment.ach || 0;
  const dinersClub = payment.dinersClub || 0;
  const debit = payment.debit || 0;

  return Number(
    (
      visa +
      mastercard +
      americanExpress +
      discover +
      ach +
      dinersClub +
      debit
    ).toFixed(2)
  );
}

/**
 * Calculate total amount for a daily payment record
 */
export function calculateTotalAmount(
  payment: typeof dailyPayments.$inferSelect
): number {
  const cashCheckTotal = calculateCashCheckTotal(payment);
  const creditCardTotal = calculateCreditCardTotal(payment);
  return Number((cashCheckTotal + creditCardTotal).toFixed(2));
}

/**
 * Convert a daily payment record to aggregated totals
 */
export function aggregateDailyPayment(
  payment: typeof dailyPayments.$inferSelect
): DailyPaymentTotals {
  return {
    facilityId: payment.facilityId,
    date: payment.date,
    cashCheckTotal: calculateCashCheckTotal(payment),
    creditCardTotal: calculateCreditCardTotal(payment),
    totalAmount: calculateTotalAmount(payment),
    cashCheckCommitted: payment.cashCheckCommitted || false,
    creditCardCommitted: payment.creditCardCommitted || false,
  };
}

/**
 * Get daily payment totals for a specific facility and date range
 */
export async function getDailyPaymentTotals(
  facilityId: string,
  startDate: string,
  endDate: string
): Promise<DailyPaymentTotals[]> {
  const payments = await db
    .select()
    .from(dailyPayments)
    .where(
      and(
        eq(dailyPayments.facilityId, facilityId),
        gte(dailyPayments.date, startDate),
        lte(dailyPayments.date, endDate)
      )
    )
    .orderBy(dailyPayments.date);

  return payments.map(aggregateDailyPayment);
}

/**
 * Get monthly totals for a specific facility
 */
export async function getFacilityMonthlyTotals(
  facilityId: string,
  month: number,
  year: number
): Promise<FacilityMonthlyTotals | null> {
  // Calculate date range for the month
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // Last day of month

  // Get facility info
  const facility = await db
    .select()
    .from(storageFacilities)
    .where(eq(storageFacilities.sitelinkId, facilityId))
    .limit(1);

  if (facility.length === 0) {
    return null;
  }

  // Get daily totals for the month
  const dailyTotals = await getDailyPaymentTotals(
    facilityId,
    startDate,
    endDate
  );

  // Calculate monthly totals
  const totalCashCheck = dailyTotals.reduce(
    (sum, day) => sum + day.cashCheckTotal,
    0
  );
  const totalCreditCard = dailyTotals.reduce(
    (sum, day) => sum + day.creditCardTotal,
    0
  );
  const totalAmount = totalCashCheck + totalCreditCard;

  return {
    facilityId,
    facilityName: facility[0].facilityName,
    month,
    year,
    totalCashCheck: Number(totalCashCheck.toFixed(2)),
    totalCreditCard: Number(totalCreditCard.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    dailyBreakdown: dailyTotals,
  };
}

/**
 * Get monthly totals for all facilities
 */
export async function getAllFacilitiesMonthlyTotals(
  month: number,
  year: number
): Promise<FacilityMonthlyTotals[]> {
  // Get all facilities
  const facilities = await db.select().from(storageFacilities);

  // Get monthly totals for each facility
  const monthlyTotals = await Promise.all(
    facilities.map(async (facility) => {
      const totals = await getFacilityMonthlyTotals(
        facility.sitelinkId,
        month,
        year
      );
      return totals;
    })
  );

  // Filter out null results and return
  return monthlyTotals.filter(
    (totals): totals is FacilityMonthlyTotals => totals !== null
  );
}

/**
 * Get aggregated totals using SQL for better performance (alternative approach)
 */
export async function getFacilityMonthlyTotalsSQL(
  facilityId: string,
  month: number,
  year: number
): Promise<{
  facilityId: string;
  totalCashCheck: number;
  totalCreditCard: number;
  totalAmount: number;
  recordCount: number;
} | null> {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const result = await db
    .select({
      facilityId: dailyPayments.facilityId,
      totalCashCheck: sql<number>`COALESCE(SUM(COALESCE(${dailyPayments.cash}, 0) + COALESCE(${dailyPayments.check}, 0)), 0)`,
      totalCreditCard: sql<number>`COALESCE(SUM(
        COALESCE(${dailyPayments.visa}, 0) + 
        COALESCE(${dailyPayments.mastercard}, 0) + 
        COALESCE(${dailyPayments.americanExpress}, 0) + 
        COALESCE(${dailyPayments.discover}, 0) + 
        COALESCE(${dailyPayments.ach}, 0) + 
        COALESCE(${dailyPayments.dinersClub}, 0) + 
        COALESCE(${dailyPayments.debit}, 0)
      ), 0)`,
      recordCount: sql<number>`COUNT(*)`,
    })
    .from(dailyPayments)
    .where(
      and(
        eq(dailyPayments.facilityId, facilityId),
        gte(dailyPayments.date, startDate),
        lte(dailyPayments.date, endDate)
      )
    )
    .groupBy(dailyPayments.facilityId);

  if (result.length === 0) {
    return null;
  }

  const totals = result[0];
  return {
    facilityId: totals.facilityId,
    totalCashCheck: Number(totals.totalCashCheck.toFixed(2)),
    totalCreditCard: Number(totals.totalCreditCard.toFixed(2)),
    totalAmount: Number(
      (totals.totalCashCheck + totals.totalCreditCard).toFixed(2)
    ),
    recordCount: totals.recordCount,
  };
}

/**
 * Validate daily payment data for reconciliation
 */
export function validateDailyPaymentForReconciliation(
  payment: typeof dailyPayments.$inferSelect
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required fields
  if (!payment.facilityId) {
    errors.push("Missing facility ID");
  }
  if (!payment.date) {
    errors.push("Missing date");
  }

  // Check for negative amounts
  const fields = [
    "cash",
    "check",
    "visa",
    "mastercard",
    "americanExpress",
    "discover",
    "ach",
    "dinersClub",
    "debit",
  ];
  fields.forEach((field) => {
    const value = payment[field as keyof typeof payment] as number;
    if (value && value < 0) {
      warnings.push(`Negative amount in ${field}: ${value}`);
    }
  });

  // Check if all amounts are zero
  const totalAmount = calculateTotalAmount(payment);
  if (totalAmount === 0) {
    warnings.push("All payment amounts are zero");
  }

  // Check commitment status
  if (!payment.cashCheckCommitted && calculateCashCheckTotal(payment) > 0) {
    warnings.push("Cash/check amounts not committed");
  }
  if (!payment.creditCardCommitted && calculateCreditCardTotal(payment) > 0) {
    warnings.push("Credit card amounts not committed");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
