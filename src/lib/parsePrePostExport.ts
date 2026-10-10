import Papa from "papaparse";
import type { EmployeeTimecardSummary } from "./parseTimecardCsv";

export interface ParsedPrePostExport {
  employees: EmployeeTimecardSummary[];
}

function emptySummary(
  employeeNumber: string,
  lastName: string,
  firstName: string,
  departmentName: string,
  departmentNumber: string | null
): EmployeeTimecardSummary {
  return {
    employeeNumber,
    lastName,
    firstName,
    homeDepartmentName: departmentName,
    workedDepartment: departmentName,
    departmentNumber,
    hourlyRate: null,
    regularHours: 0,
    otHours: 0,
    vacationHoursCsv: 0,
    holidayHoursCsv: 0,
    commissionCsv: 0,
    mileageCsv: 0,
    otherEarningsCsv: [],
    otherEarningsTotalCsv: 0,
    grossPay: null,
    netPay: null,
  };
}

/**
 * Parses Paycor's "Pre - Post Employee Export" — the final payroll register
 * right before submission. One row per (employee, department, earning OR
 * tax code); "Department" embeds the Paycor number directly (e.g.
 * "416-Fort Security"), and a separate row per (employee, department) with
 * a blank Earning Code carries the final "Gross (By Department)"/
 * "Net (By Department)" totals. Tax rows (Tax Code populated, Earning Code
 * blank) are ignored — nothing in the app tracks withholding to compare
 * against.
 */
export async function parsePrePostExport(file: File): Promise<ParsedPrePostExport> {
  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^﻿/, "").trim(),
  });

  const byEmployeeDept = new Map<string, EmployeeTimecardSummary>();

  for (const row of data) {
    const employeeNumber = (row["Employee Number"] ?? "").trim();
    if (!employeeNumber) continue;

    const deptRaw = (row["Department"] ?? "").trim();
    const dashIdx = deptRaw.indexOf("-");
    const departmentNumber = dashIdx > 0 ? deptRaw.slice(0, dashIdx).trim() : null;
    const key = `${employeeNumber}|${deptRaw}`;

    if (!byEmployeeDept.has(key)) {
      byEmployeeDept.set(
        key,
        emptySummary(
          employeeNumber,
          (row["Last Name"] ?? "").trim(),
          (row["First Name"] ?? "").trim(),
          deptRaw,
          departmentNumber
        )
      );
    }
    const emp = byEmployeeDept.get(key)!;

    const code = (row["Earning Code"] ?? "").trim();
    const hours = row["Earning Hours"] ? parseFloat(row["Earning Hours"]) : 0;
    const amount = row["Earning Amount"] ? parseFloat(row["Earning Amount"]) : 0;
    const rate = row["Earning Rate"] ? parseFloat(row["Earning Rate"]) : 0;
    if (rate > 0) emp.hourlyRate = rate;

    if (code === "Reg") emp.regularHours += hours;
    else if (code === "OT") emp.otHours += hours;
    else if (code === "Vac") emp.vacationHoursCsv += hours;
    // Same defensive guess as the timecard parser.
    else if (/^hol/i.test(code)) emp.holidayHoursCsv += hours;
    else if (code === "Storage") emp.commissionCsv += amount;
    else if (code === "Mileage") emp.mileageCsv += amount;
    else if (code) {
      const existing = emp.otherEarningsCsv.find((o) => o.code === code);
      if (existing) existing.amount += amount;
      else emp.otherEarningsCsv.push({ code, amount });
      emp.otherEarningsTotalCsv += amount;
    }

    const gross = row["Gross (By Department)"] ? parseFloat(row["Gross (By Department)"]) : 0;
    const net = row["Net (By Department)"] ? parseFloat(row["Net (By Department)"]) : 0;
    if (gross) emp.grossPay = gross;
    if (net) emp.netPay = net;
  }

  return { employees: Array.from(byEmployeeDept.values()) };
}
