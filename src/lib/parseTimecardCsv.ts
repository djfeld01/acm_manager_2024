import Papa from "papaparse";

export interface EmployeeTimecardSummary {
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
  otherEarningsCsv: { code: string; amount: number }[];
  otherEarningsTotalCsv: number;
}

export interface ParsedTimecard {
  employees: EmployeeTimecardSummary[];
  /** Every distinct punch date seen in the file (MM/DD/YYYY, as Paycor
   *  writes it), for validating against the selected pay period's range. */
  allDates: string[];
}

function emptySummary(
  employeeNumber: string,
  lastName: string,
  firstName: string,
  departmentName: string,
  hourlyRate: number | null
): EmployeeTimecardSummary {
  return {
    employeeNumber,
    lastName,
    firstName,
    departmentName,
    hourlyRate,
    regularHours: 0,
    otHours: 0,
    vacationHoursCsv: 0,
    holidayHoursCsv: 0,
    commissionCsv: 0,
    mileageCsv: 0,
    otherEarningsCsv: [],
    otherEarningsTotalCsv: 0,
  };
}

/**
 * Parses a Paycor "Time Card and Approval Customizable" export into one
 * summary row per employee. Each CSV row is either hours-based (`Hours`
 * populated, `Pay Item` blank — Reg/OT/Vac/a holiday code) or dollar-based
 * (`Pay Item` populated, `Hours` blank — Storage/Mileage/bonus-type codes).
 * Reg/OT have no counterpart in the app (it doesn't track worked hours) and
 * pass straight through; everything else feeds the reconciliation compare.
 */
export async function parseTimecardCsv(file: File): Promise<ParsedTimecard> {
  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^﻿/, "").trim(),
  });

  const byEmployee = new Map<string, EmployeeTimecardSummary>();
  const allDatesSet = new Set<string>();

  for (const row of data) {
    const employeeNumber = (row["Employee Number"] ?? "").trim();
    if (!employeeNumber) continue;

    const date = (row["Date"] ?? "").trim();
    if (date) allDatesSet.add(date);

    if (!byEmployee.has(employeeNumber)) {
      byEmployee.set(
        employeeNumber,
        emptySummary(
          employeeNumber,
          (row["Last Name"] ?? "").trim(),
          (row["First Name"] ?? "").trim(),
          (row["Department Name"] ?? "").trim(),
          row["Hourly Rate"] ? parseFloat(row["Hourly Rate"]) : null
        )
      );
    }
    const emp = byEmployee.get(employeeNumber)!;

    const code = (row["Earnings Code"] ?? "").trim();
    const hoursRaw = (row["Hours"] ?? "").trim();
    const payItemRaw = (row["Pay Item"] ?? "").trim();
    const hours = hoursRaw ? parseFloat(hoursRaw) : null;
    const payItem = payItemRaw ? parseFloat(payItemRaw) : null;

    if (hours != null && !Number.isNaN(hours)) {
      if (code === "Reg") emp.regularHours += hours;
      else if (code === "OT") emp.otHours += hours;
      else if (code === "Vac") emp.vacationHoursCsv += hours;
      // Defensive guess: no holiday code was observed in the sample this
      // was built against, but Paycor's convention elsewhere is short
      // 3-letter codes — catch anything starting "Hol".
      else if (/^hol/i.test(code)) emp.holidayHoursCsv += hours;
    }

    if (payItem != null && !Number.isNaN(payItem)) {
      if (code === "Storage") emp.commissionCsv += payItem;
      else if (code === "Mileage") emp.mileageCsv += payItem;
      else {
        const existing = emp.otherEarningsCsv.find((o) => o.code === code);
        if (existing) existing.amount += payItem;
        else emp.otherEarningsCsv.push({ code, amount: payItem });
        emp.otherEarningsTotalCsv += payItem;
      }
    }
  }

  return {
    employees: Array.from(byEmployee.values()),
    allDates: Array.from(allDatesSet),
  };
}
