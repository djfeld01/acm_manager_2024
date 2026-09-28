"use server";
import { db } from "@/db";
import { userDetails, payPeriod, storageFacilities } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getEmployeePayrollData } from "@/lib/controllers/payrollController/getEmployeePayrollData";
import type { EmployeeTimecardSummary } from "@/lib/parseTimecardCsv";

// Paycor's "Worked Department" is a free-text label that doesn't exactly
// match any facility field in the app (name, abbreviation, or Paycor
// number) — confirmed against a real export, 17 distinct values, all but
// two an unambiguous informal match. The two exceptions were confirmed with
// the user directly rather than guessed silently.
const PAYCOR_DEPARTMENT_TO_SITELINK: Record<string, string> = {
  "A + Maumee": "30548",
  "A+ Columbus": "33884",
  "A+ Sylvania": "50552",
  "A+ Toledo": "36",
  ACM: "CORP",
  "Advantage- Miamisburg": "35",
  // Paycor's name for "Advantage Self Storage Hamilton" — its DB
  // abbreviation is "TV", confirmed with the user.
  "Advantage- Tylersville": "64",
  // "Beach Self Storage" (as distinct from "Beach- South" below) — confirmed
  // with the user.
  "Beach- Owings": "33954",
  "Beach- South": "45509",
  Breakwater: "55033",
  "Cove Point": "67",
  "Fort Security": "7973",
  "Maryland Self Storage": "43882",
  "Springfield Storage Depot": "33840",
  "Stealth- Beavercreek": "39795",
  "Stealth- Clearcreek": "43133",
  "Triskett Road": "47650",
};

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
  /** The facility this line was worked at, as Paycor labels it. */
  workedDepartment: string;
  /** False when `workedDepartment` couldn't be resolved to a facility —
   *  hours/pay still pass through to the export, but nothing here could be
   *  cross-checked against the app's committed data for this line. */
  departmentMapped: boolean;
  /** The resolved facility's Paycor department number, for the export's
   *  "Dept" column — null when `departmentMapped` is false. */
  deptNumber: number | null;
  hourlyRate: number | null;
  regularHours: number;
  otHours: number;
  matchedBy: "paycorId" | "name" | "unmatched";
  /** True for a row synthesized because the app has committed data for this
   *  employee/facility/period that never showed up anywhere in the
   *  uploaded CSV. */
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
  /** Paycor's own final computed pay for this line — only present when
   *  reconciling the Pre-Post Employee Export, purely informational. */
  grossPay: number | null;
  netPay: number | null;
}

export interface ReconcileResult {
  payPeriodLabel: string;
  employees: ReconcileEmployeeResult[];
  outOfRangeDates: string[];
  linkedEmployeeIds: string[];
  /** Distinct Worked Department strings from the upload that don't have a
   *  known facility mapping — surfaced once, not per row. */
  unmappedDepartments: string[];
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

function hasNonzeroTotals(t: AppTotals): boolean {
  return (
    t.vacationHours !== 0 ||
    t.holidayHours !== 0 ||
    t.commission !== 0 ||
    t.mileageDollars !== 0 ||
    t.christmasBonus !== 0 ||
    t.monthlyBonus !== 0
  );
}

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
  const facilityRows = finalResult as Array<{
    employeeId: string;
    facilityId: string;
    locationAbbreviation: string;
    vacationHours: number;
    holidayHours: number;
    commission: number;
    mileageDollars: number;
    christmasBonus: number;
    monthlyBonus: number;
  }>;

  // employeeId -> facilityId -> totals (the app's grain matches the CSV's
  // employee-per-worked-department grain — don't collapse across facilities).
  const appByEmployeeFacility = new Map<string, Map<string, AppTotals>>();
  for (const row of facilityRows) {
    if (!appByEmployeeFacility.has(row.employeeId)) {
      appByEmployeeFacility.set(row.employeeId, new Map());
    }
    appByEmployeeFacility.get(row.employeeId)!.set(row.facilityId, {
      vacationHours: row.vacationHours,
      holidayHours: row.holidayHours,
      commission: row.commission,
      mileageDollars: row.mileageDollars,
      christmasBonus: row.christmasBonus,
      monthlyBonus: row.monthlyBonus,
    });
  }

  const facilities = await db
    .select({ sitelinkId: storageFacilities.sitelinkId, paycorNumber: storageFacilities.paycorNumber })
    .from(storageFacilities);
  const paycorNumberBySitelinkId = new Map(facilities.map((f) => [f.sitelinkId, f.paycorNumber]));
  const sitelinkIdByPaycorNumber = new Map(facilities.map((f) => [f.paycorNumber, f.sitelinkId]));

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
  const coveredPairs = new Set<string>(); // `${employeeId}|${facilityId}`
  const unmappedDepartments = new Set<string>();

  function buildRow(
    matched: { id: string } | undefined,
    matchedBy: ReconcileEmployeeResult["matchedBy"],
    facilityId: string | undefined,
    departmentMapped: boolean,
    csvEmp: {
      employeeNumber: string;
      lastName: string;
      firstName: string;
      workedDepartment: string;
      hourlyRate: number | null;
      regularHours: number;
      otHours: number;
      vacationHoursCsv: number;
      holidayHoursCsv: number;
      commissionCsv: number;
      mileageCsv: number;
      otherEarningsTotalCsv: number;
      grossPay?: number | null;
      netPay?: number | null;
    },
    missingFromCsv: boolean
  ): ReconcileEmployeeResult {
    const app =
      matched && facilityId
        ? appByEmployeeFacility.get(matched.id)?.get(facilityId) ?? EMPTY_APP_TOTALS
        : EMPTY_APP_TOTALS;
    const deptNumber = facilityId ? paycorNumberBySitelinkId.get(facilityId) ?? null : null;
    return {
      employeeId: matched?.id ?? null,
      employeeNumber: csvEmp.employeeNumber,
      lastName: csvEmp.lastName,
      firstName: csvEmp.firstName,
      workedDepartment: csvEmp.workedDepartment,
      departmentMapped,
      deptNumber,
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
      grossPay: csvEmp.grossPay ?? null,
      netPay: csvEmp.netPay ?? null,
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

    // Prefer a numeric department code straight from the file (the
    // Pre-Post Employee Export embeds one, unambiguous) over the free-text
    // name lookup (the Time Card export's only option).
    const numericDeptId = csvEmp.departmentNumber ? parseInt(csvEmp.departmentNumber, 10) : NaN;
    const facilityId = !Number.isNaN(numericDeptId)
      ? sitelinkIdByPaycorNumber.get(numericDeptId)
      : PAYCOR_DEPARTMENT_TO_SITELINK[csvEmp.workedDepartment];
    const departmentMapped = facilityId != null;
    if (!departmentMapped && csvEmp.workedDepartment) {
      unmappedDepartments.add(csvEmp.workedDepartment);
    }

    if (matched && facilityId) coveredPairs.add(`${matched.id}|${facilityId}`);
    results.push(buildRow(matched, matchedBy, facilityId, departmentMapped, csvEmp, false));
  }

  // Anyone with nonzero committed app data for a specific employee+facility
  // this period that never showed up anywhere in the uploaded CSV — the
  // case most worth flagging, since it means nothing for them at that
  // facility has been keyed into Paycor yet.
  for (const row of facilityRows) {
    const pairKey = `${row.employeeId}|${row.facilityId}`;
    if (coveredPairs.has(pairKey)) continue;
    const totals: AppTotals = {
      vacationHours: row.vacationHours,
      holidayHours: row.holidayHours,
      commission: row.commission,
      mileageDollars: row.mileageDollars,
      christmasBonus: row.christmasBonus,
      monthlyBonus: row.monthlyBonus,
    };
    if (!hasNonzeroTotals(totals)) continue;
    const employee = allEmployees.find((e) => e.id === row.employeeId);
    const [lastName, firstName] = (employee?.fullName ?? "Unknown, Unknown").split(", ");
    results.push(
      buildRow(
        { id: row.employeeId },
        "unmatched",
        row.facilityId,
        true,
        {
          employeeNumber: employee?.paycorEmployeeId != null ? String(employee.paycorEmployeeId) : "",
          lastName: lastName ?? "",
          firstName: firstName ?? "",
          workedDepartment: row.locationAbbreviation,
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
    unmappedDepartments: Array.from(unmappedDepartments),
  };
}
