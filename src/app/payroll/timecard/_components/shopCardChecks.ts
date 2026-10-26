import type { EmployeeTimecardSummary } from "@/lib/parseTimecardCsv";
import type { ReconcileResult } from "../../actions/reconcileTimecard";

/** One employee's shop bonus vs. what's keyed in Paycor. */
export interface ShopCardCheck {
  employeeNumber: string;
  lastName: string;
  firstName: string;
  /** Committed shop bonus in the app — the expected shop card amount. */
  appShopBonus: number;
  /** "Shop Cards" in Paycor. */
  paycorShopCards: number;
  /** Bonus keyed under "Shop" in Paycor, which should be "Monthly In". */
  paycorShopCoded: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Only employees with something to look at — a shop bonus, a shop card, or
 *  a "Shop"-coded entry. */
export function buildShopCardChecks(
  result: ReconcileResult,
  csvEmployees: EmployeeTimecardSummary[],
  appShopBonuses: { employeeId: string; amount: number }[]
): ShopCardCheck[] {
  const csvByNumber = new Map<string, { cards: number; coded: number }>();
  for (const e of csvEmployees) {
    const t = csvByNumber.get(e.employeeNumber) ?? { cards: 0, coded: 0 };
    t.cards += e.shopCardsCsv;
    t.coded += e.shopCodedCsv;
    csvByNumber.set(e.employeeNumber, t);
  }
  const appById = new Map(appShopBonuses.map((b) => [b.employeeId, b.amount]));

  // A reconciliation line per employee/department — collapse to one per
  // employee, since shop cards are checked per person.
  const seen = new Set<string>();
  const checks: ShopCardCheck[] = [];
  for (const emp of result.employees) {
    const key = emp.employeeId ?? `num:${emp.employeeNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const csv = csvByNumber.get(emp.employeeNumber) ?? { cards: 0, coded: 0 };
    const check: ShopCardCheck = {
      employeeNumber: emp.employeeNumber,
      lastName: emp.lastName,
      firstName: emp.firstName,
      appShopBonus: r2(emp.employeeId ? appById.get(emp.employeeId) ?? 0 : 0),
      paycorShopCards: r2(csv.cards),
      paycorShopCoded: r2(csv.coded),
    };
    if (check.appShopBonus || check.paycorShopCards || check.paycorShopCoded) {
      checks.push(check);
    }
  }
  return checks;
}
