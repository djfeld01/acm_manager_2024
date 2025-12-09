/**
 * Utility functions for date handling in bank reconciliation
 */

/**
 * Get the first day of a month
 */
export function getMonthStart(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, "0")}-01`;
}

/**
 * Get the last day of a month
 */
export function getMonthEnd(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${month.toString().padStart(2, "0")}-${lastDay
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Get month and year from a date string
 */
export function getMonthYear(dateString: string): {
  month: number;
  year: number;
} {
  const date = new Date(dateString);
  return {
    month: date.getMonth() + 1, // JavaScript months are 0-indexed
    year: date.getFullYear(),
  };
}

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[month - 1] || "Unknown";
}

/**
 * Check if a date is within a month
 */
export function isDateInMonth(
  dateString: string,
  month: number,
  year: number
): boolean {
  const date = new Date(dateString);
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

/**
 * Get all dates in a month
 */
export function getDatesInMonth(month: number, year: number): string[] {
  const dates: string[] = [];
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const dateString = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    dates.push(dateString);
  }

  return dates;
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if two dates are the same
 */
export function isSameDate(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Get the current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

/**
 * Get the previous month and year
 */
export function getPreviousMonthYear(
  month: number,
  year: number
): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Get the next month and year
 */
export function getNextMonthYear(
  month: number,
  year: number
): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }
  return { month: month + 1, year };
}
