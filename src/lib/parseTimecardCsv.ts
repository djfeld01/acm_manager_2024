import Papa from "papaparse";

export interface EmployeeTimecardSummary {
  employeeNumber: string;
  lastName: string;
  firstName: string;
  /** Their assigned home department ("Department Name" column) — constant
   *  across all of an employee's rows. */
  homeDepartmentName: string;
  /** The department this particular line was worked in ("Worked
   *  Department" column) — an employee who floats between stores gets one
   *  summary row per distinct value here. */
  workedDepartment: string;
  /** Paycor's numeric department code for this line, when the source file
   *  provides one directly (the Pre-Post Employee Export embeds it right
   *  in "Department", e.g. "416-Fort Security" — the Time Card export
   *  doesn't give a number at all, only the free-text name). Preferred
   *  over name-based lookup when present, since it's unambiguous. */
  departmentNumber: string | null;
  hourlyRate: number | null;
  regularHours: number;
  otHours: number;
  vacationHoursCsv: number;
  holidayHoursCsv: number;
  commissionCsv: number;
  mileageCsv: number;
  otherEarningsCsv: { code: string; amount: number }[];
  otherEarningsTotalCsv: number;
  /** Only populated when parsed from the Pre-Post Employee Export — Paycor's
   *  own final computed gross/net pay for this employee at this department.
   *  Purely informational (nothing in the app computes taxes to compare
   *  against), shown as-is on the "final check" upload. */
  grossPay: number | null;
  netPay: number | null;
}

/** Store opening time, in minutes after midnight. Per-store hours aren't
 *  stored in the app yet, so every store is assumed to open at 9:00 AM. */
export const DEFAULT_STORE_OPEN_MINUTES = 9 * 60;

export interface EarlyClockIn {
  employeeNumber: string;
  lastName: string;
  firstName: string;
  workedDepartment: string;
  /** As Paycor writes it in the "Date" column. */
  date: string;
  /** As Paycor writes it in the "In Punch" column, e.g. "8:42 AM". */
  inPunch: string;
  minutesEarly: number;
}

export interface MissedPunch {
  employeeNumber: string;
  lastName: string;
  firstName: string;
  workedDepartment: string;
  date: string;
  inPunch: string;
  outPunch: string;
  /** Which side of the pair is blank. */
  missing: "in" | "out";
}

export interface ParsedTimecard {
  employees: EmployeeTimecardSummary[];
  /** Every distinct punch date seen in the file (MM/DD/YYYY, as Paycor
   *  writes it), including dates outside `range` — so the page can say which
   *  were ignored. */
  allDates: string[];
  /** Punches with an "In Punch" before the store opens, in file order. */
  earlyClockIns: EarlyClockIn[];
  /** Rows with an In Punch but no Out Punch (or vice versa), in file
   *  order. Paycor's "Missed Punch" exception isn't used — it flags the
   *  same rows, so it only duplicated these. */
  missedPunches: MissedPunch[];
}

/** "10/08/2026" or "10/8/26" → "2026-10-08". */
export function paycorDateToIso(value: string): string | null {
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** "8:42 AM" / "08:42:00 PM" / "20:42" → minutes after midnight. */
function parsePunchMinutes(value: string): number | null {
  const m =
    value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP])\.?M?\.?$/i) ??
    value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === "P" && hours !== 12) hours += 12;
  if (meridiem === "A" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function emptySummary(
  employeeNumber: string,
  lastName: string,
  firstName: string,
  homeDepartmentName: string,
  workedDepartment: string,
  hourlyRate: number | null
): EmployeeTimecardSummary {
  return {
    employeeNumber,
    lastName,
    firstName,
    homeDepartmentName,
    workedDepartment,
    departmentNumber: null,
    hourlyRate,
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
 * Parses a Paycor "Time Card and Approval Customizable" export into one
 * summary row per (employee, worked department) — an employee who worked
 * shifts at more than one facility this period gets a separate row per
 * facility, matching how the app's own payroll data is tracked per
 * employee-facility pair. Each CSV row is either hours-based (`Hours`
 * populated, `Pay Item` blank — Reg/OT/Vac/a holiday code) or dollar-based
 * (`Pay Item` populated, `Hours` blank — Storage/Mileage/bonus-type codes).
 * Reg/OT have no counterpart in the app (it doesn't track worked hours) and
 * pass straight through; everything else feeds the reconciliation compare.
 */
export async function parseTimecardCsv(
  file: File,
  /** Pay period bounds (YYYY-MM-DD, inclusive). The export is usually pulled
   *  for a rolling window wider than the pay period, so rows dated outside
   *  it are left out of every summary. */
  range?: { start: string; end: string | null },
): Promise<ParsedTimecard> {
  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^﻿/, "").trim(),
  });

  const byEmployeeDept = new Map<string, EmployeeTimecardSummary>();
  const allDatesSet = new Set<string>();
  const earlyClockIns: EarlyClockIn[] = [];
  // One punch can be split across several rows (e.g. Reg + OT), so only
  // flag each employee/date/punch once.
  const seenPunches = new Set<string>();
  const missedPunches: MissedPunch[] = [];
  const seenMissed = new Set<string>();

  for (const row of data) {
    const employeeNumber = (row["Employee Number"] ?? "").trim();
    if (!employeeNumber) continue;

    const date = (row["Date"] ?? "").trim();
    if (date) allDatesSet.add(date);

    const iso = paycorDateToIso(date);
    if (
      range &&
      iso &&
      (iso < range.start || (range.end != null && iso > range.end))
    ) {
      continue;
    }

    const workedDepartment = (row["Worked Department"] ?? "").trim();

    const inPunch = (row["In Punch"] ?? "").trim();
    const punchMinutes = inPunch ? parsePunchMinutes(inPunch) : null;
    const punchKey = `${employeeNumber}|${date}|${inPunch}`;
    if (
      punchMinutes != null &&
      punchMinutes < DEFAULT_STORE_OPEN_MINUTES &&
      !seenPunches.has(punchKey)
    ) {
      seenPunches.add(punchKey);
      earlyClockIns.push({
        employeeNumber,
        lastName: (row["Last Name"] ?? "").trim(),
        firstName: (row["First Name"] ?? "").trim(),
        workedDepartment,
        date,
        inPunch,
        minutesEarly: DEFAULT_STORE_OPEN_MINUTES - punchMinutes,
      });
    }

    const outPunch = (row["Out Punch"] ?? "").trim();
    const missing = inPunch && !outPunch ? "out" : !inPunch && outPunch ? "in" : null;
    const missedKey = `${employeeNumber}|${date}|${inPunch}|${outPunch}`;
    if (missing && !seenMissed.has(missedKey)) {
      seenMissed.add(missedKey);
      missedPunches.push({
        employeeNumber,
        lastName: (row["Last Name"] ?? "").trim(),
        firstName: (row["First Name"] ?? "").trim(),
        workedDepartment,
        date,
        inPunch,
        outPunch,
        missing,
      });
    }

    // Paycor adds a placeholder row for each missed punch — no punches,
    // hours, or pay, and a blank Worked Department. The unpaired punch
    // itself is already flagged above; summarizing the placeholder would
    // only create an empty, unmapped reconciliation line.
    if (
      !inPunch &&
      !outPunch &&
      !(row["Hours"] ?? "").trim() &&
      !(row["Pay Item"] ?? "").trim()
    ) {
      continue;
    }

    const key = `${employeeNumber}|${workedDepartment}`;

    if (!byEmployeeDept.has(key)) {
      byEmployeeDept.set(
        key,
        emptySummary(
          employeeNumber,
          (row["Last Name"] ?? "").trim(),
          (row["First Name"] ?? "").trim(),
          (row["Department Name"] ?? "").trim(),
          workedDepartment,
          row["Hourly Rate"] ? parseFloat(row["Hourly Rate"]) : null
        )
      );
    }
    const emp = byEmployeeDept.get(key)!;

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
    employees: Array.from(byEmployeeDept.values()),
    allDates: Array.from(allDatesSet),
    earlyClockIns,
    missedPunches,
  };
}
