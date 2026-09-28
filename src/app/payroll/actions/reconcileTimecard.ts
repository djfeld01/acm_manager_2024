"use server";
import { db } from "@/db";
import { userDetails, payPeriod } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getEmployeePayrollData } from "@/lib/controllers/payrollController/getEmployeePayrollData";
import type { EmployeeTimecardSummary } from "@/lib/parseTimecardCsv";

export interface ReconcileCategoryResult {
  appValue: number;
  csvValue: number;
  status: "match" | "mismatch" | "app-only" | "csv-only" | "none";
}

export interface ReconcileEmployeeResult {
  employeeId: string | null;
  employeeNumber: string;
  lastName: string;
  firstName: string;
  departmentName: string;
  hourlyRate: number | null;
  regularHours: number;
  otHours: number;
  matchedBy: "paycorId" | "name" | "unmatched";
  /** True for a row synthesized because the app has committed data for this
   *  employee/period that never showed up anywhere in the uploaded CSV. */
  missingFromCsv: boolean;
  vacation: ReconcileCategoryResult;
  holiday: ReconcileCategoryResult;
  commission: ReconcileCategoryResult;
  mileage: ReconcileCategoryResult;
  bonus: ReconcileCategoryResult;
  // App-side values, carried through for the final export.
  holidayHoursExport: number;
  vacationHoursExport: number;
  christmasBonusExport: number;
  monthlyIncentiveExport: number;
  commissionExport: number;
  mileageExport: number;
}

export interface ReconcileResult {
  payPeriodLabel: string;
  employees: ReconcileEmployeeResult[];
  outOfRangeDates: string[];
  linkedEmployeeIds: string[];
}

const TOLERANCE = 0.01;

interface AppTotals {
  vacationHours: number;
  holidayHours: number;
  commission: number;
  mileageDollars: number;
  christmasBonus: number;
  monthlyBonus: number;
}

const EMPTY_APP_TOTALS: AppTotals = {
  vacationHours: 0,
  holidayHours: 0,
  commission: 0,
  mileageDollars: 0,
  christmasBonus: 0,
  monthlyBonus: 0,
};

function compareCategory(appValue: number, csvValue: number): ReconcileCategoryResult {
  const a = Math.round(appValue * 100) / 100;
  const c = Math.round(csvValue * 100) / 100;
  let status: ReconcileCategoryResult["status"];
  if (Math.abs(a - c) <= TOLERANCE) status = a === 0 && c === 0 ? "none" : "match";
  else if (c === 0) status = "app-only";
  else if (a === 0) status = "csv-only";
  else status = "mismatch";
  return { appValue: a, csvValue: c, status };
}

function parseMDY(dateStr: string): string | null {
  const [m, d, y] = dateStr.split("/").map((p) => parseInt(p, 10));
  if (!m || !d || !y) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export async function reconcileTimecard(
  payPeriodId: string,
  csvEmployees: EmployeeTimecardSummary[],
  csvDates: string[]
): Promise<ReconcileResult> {
  const [period] = await db
    .select()
    .from(payPeriod)
    .where(eq(payPeriod.payPeriodId, payPeriodId))
    .limit(1);
  if (!period) throw new Error("Pay period not found");

  const outOfRangeDates = csvDates.filter((d) => {
    const iso = parseMDY(d);
    if (!iso) return false;
    return iso < period.startDate || (period.endDate ? iso > period.endDate : false);
  });

  const { finalResult } = await getEmployeePayrollData(payPeriodId);

  // finalResult has one row per (employee, facility) — aggregate to one
  // total per employee, since the CSV/export don't split by facility.
  const appByEmployee = new Map<string, AppTotals>();
  for (const row of finalResult as Array<{
    employeeId: string;
    vacationHours: number;
    holidayHours: number;
    commission: number;
    mileageDollars: number;
    christmasBonus: number;
    monthlyBonus: number;
  }>) {
    if (!appByEmployee.has(row.employeeId)) {
      appByEmployee.set(row.employeeId, { ...EMPTY_APP_TOTALS });
    }
    const agg = appByEmployee.get(row.employeeId)!;
    agg.vacationHours += row.vacationHours;
    agg.holidayHours += row.holidayHours;
    agg.commission += row.commission;
    agg.mileageDollars += row.mileageDollars;
    agg.christmasBonus += row.christmasBonus;
    agg.monthlyBonus += row.monthlyBonus;
  }

  const allEmployees = await db.query.userDetails.findMany({
    where: (u, { eq }) => eq(u.isActiveEmployee, true),
    columns: { id: true, fullName: true, paycorEmployeeId: true },
  });
  const byPaycorId = new Map(
    allEmployees.filter((e) => e.paycorEmployeeId != null).map((e) => [e.paycorEmployeeId as number, e])
  );
  const byName = new Map(allEmployees.map((e) => [e.fullName?.toLowerCase().trim(), e]));

  const linkedEmployeeIds: string[] = [];
  const results: ReconcileEmployeeResult[] = [];
  const matchedEmployeeIds = new Set<string>();

  function buildRow(
    matched: { id: string } | undefined,
    matchedBy: ReconcileEmployeeResult["matchedBy"],
    csvEmp: {
      employeeNumber: string;
      lastName: string;
      firstName: string;
      departmentName: string;
      hourlyRate: number | null;
      regularHours: number;
      otHours: number;
      vacationHoursCsv: number;
      holidayHoursCsv: number;
      commissionCsv: number;
      mileageCsv: number;
      otherEarningsTotalCsv: number;
    },
    missingFromCsv: boolean
  ): ReconcileEmployeeResult {
    const app = matched ? appByEmployee.get(matched.id) ?? EMPTY_APP_TOTALS : EMPTY_APP_TOTALS;
    return {
      employeeId: matched?.id ?? null,
      employeeNumber: csvEmp.employeeNumber,
      lastName: csvEmp.lastName,
      firstName: csvEmp.firstName,
      departmentName: csvEmp.departmentName,
      hourlyRate: csvEmp.hourlyRate,
      regularHours: csvEmp.regularHours,
      otHours: csvEmp.otHours,
      matchedBy,
      missingFromCsv,
      vacation: compareCategory(app.vacationHours, csvEmp.vacationHoursCsv),
      holiday: compareCategory(app.holidayHours, csvEmp.holidayHoursCsv),
      commission: compareCategory(app.commission, csvEmp.commissionCsv),
      mileage: compareCategory(app.mileageDollars, csvEmp.mileageCsv),
      bonus: compareCategory(app.christmasBonus + app.monthlyBonus, csvEmp.otherEarningsTotalCsv),
      holidayHoursExport: app.holidayHours,
      vacationHoursExport: app.vacationHours,
      christmasBonusExport: app.christmasBonus,
      monthlyIncentiveExport: app.monthlyBonus,
      commissionExport: app.commission,
      mileageExport: app.mileageDollars,
    };
  }

  for (const csvEmp of csvEmployees) {
    const empNum = parseInt(csvEmp.employeeNumber, 10);
    let matched = Number.isNaN(empNum) ? undefined : byPaycorId.get(empNum);
    let matchedBy: ReconcileEmployeeResult["matchedBy"] = matched ? "paycorId" : "unmatched";

    if (!matched) {
      const nameKey = `${csvEmp.lastName}, ${csvEmp.firstName}`.toLowerCase().trim();
      const nameMatch = byName.get(nameKey);
      if (nameMatch) {
        matched = nameMatch;
        matchedBy = "name";
        if (nameMatch.paycorEmployeeId == null && !Number.isNaN(empNum)) {
          await db
            .update(userDetails)
            .set({ paycorEmployeeId: empNum })
            .where(and(eq(userDetails.id, nameMatch.id), isNull(userDetails.paycorEmployeeId)));
          linkedEmployeeIds.push(nameMatch.id);
        }
      }
    }

    if (matched) matchedEmployeeIds.add(matched.id);
    results.push(buildRow(matched, matchedBy, csvEmp, false));
  }

  // Anyone with nonzero committed app data for this period who never showed
  // up anywhere in the uploaded CSV at all — the case most worth flagging,
  // since it means nothing for them has been keyed into Paycor yet.
  for (const [employeeId, totals] of appByEmployee) {
    if (matchedEmployeeIds.has(employeeId)) continue;
    const hasData =
      totals.vacationHours !== 0 ||
      totals.holidayHours !== 0 ||
      totals.commission !== 0 ||
      totals.mileageDollars !== 0 ||
      totals.christmasBonus !== 0 ||
      totals.monthlyBonus !== 0;
    if (!hasData) continue;
    const employee = allEmployees.find((e) => e.id === employeeId);
    const [lastName, firstName] = (employee?.fullName ?? "Unknown, Unknown").split(", ");
    results.push(
      buildRow(
        { id: employeeId },
        "unmatched",
        {
          employeeNumber: employee?.paycorEmployeeId != null ? String(employee.paycorEmployeeId) : "",
          lastName: lastName ?? "",
          firstName: firstName ?? "",
          departmentName: "",
          hourlyRate: null,
          regularHours: 0,
          otHours: 0,
          vacationHoursCsv: 0,
          holidayHoursCsv: 0,
          commissionCsv: 0,
          mileageCsv: 0,
          otherEarningsTotalCsv: 0,
        },
        true
      )
    );
  }

  return {
    payPeriodLabel: `${period.startDate} - ${period.endDate}`,
    employees: results,
    outOfRangeDates,
    linkedEmployeeIds,
  };
}
