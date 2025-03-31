import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getDateSentence(date: Date): String {
  const today = new Date();
  const todayString = today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const dateString = date.toDateString();

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (todayString === dateString) {
    return `Today at ${time}`;
  }

  if (yesterdayString === dateString) {
    return `Yesterday at ${time}`;
  }

  return `Something Else`;
}

export function parseLocalDate(dateString: string): Date | null {
  const dateParts = dateString.split(/[-T:.]/).map(Number);

  if (dateParts.length < 6) {
    // Return null if the date string is not in the expected format
    return null;
  }

  const [year, month, day, hours, minutes, seconds] = dateParts;

  // Validate the parsed numbers to ensure they make sense as a date
  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    isNaN(hours) ||
    isNaN(minutes) ||
    isNaN(seconds)
  ) {
    return null;
  }

  // Create a new Date using the parsed values as local time
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

export function calculateCommission(
  position: string,
  insurance: number,
  insuranceCommissionRate: number,
  rentals: number,
  storageCommissionRate: number
) {
  return position === "MANAGER"
    ? insurance * insuranceCommissionRate
    : insurance * insuranceCommissionRate + rentals * storageCommissionRate;
}

export function calculateRetailBonus(
  retailGoal: number,
  retailSold: number,
  daysWorked: number,
  totalDaysWorked: number
) {
  return retailSold >= retailGoal
    ? (retailSold * 0.1 * daysWorked) / totalDaysWorked
    : 0;
}

export function caluclateReceivableBonus(
  receivableGoal: number,
  actualReceivable: number,
  position: string
) {
  if (
    position !== "MANAGER" ||
    receivableGoal <= 0 ||
    actualReceivable > receivableGoal
  ) {
    return 0;
  }
  return 75;
}
export function calculateStorageBonus(
  rentalsGoal: number,
  actualRentals: number,
  occupancy: number,
  position: string
) {
  if (rentalsGoal <= 0) {
    return 0;
  }

  if (actualRentals < rentalsGoal && occupancy < 0.94) {
    return 0;
  }

  if (position === "ASSISTANT") {
    return 33.34;
  }

  let bonus = 75;

  if (actualRentals < rentalsGoal && occupancy > 0.94) {
    return bonus;
  }

  if (actualRentals === rentalsGoal) {
    return bonus;
  }

  bonus += (actualRentals - rentalsGoal) * 5;

  if (actualRentals >= rentalsGoal * 1.25) {
    bonus += 50;
  }

  return bonus;
}

export function calculateMysteryShop(
  mysteryShopScore: number,
  mysteryShopGoal: number = 0.9
) {
  if (mysteryShopScore > mysteryShopGoal) {
    return 50;
  }
  return 0;
}

export const holidays = [
  {
    display: "New Years",
    value: "newYear",
  },
  {
    display: "Memorial Day",
    value: "memorialDay",
  },
  { display: "July 4th", value: "fourthOfJuly" },
  { display: "Labor Day", value: "laborDay" },
  { display: "Thanksgiving", value: "thanksgiving" },
  { display: "Christmas", value: "christmas" },
];

export function getWorkdaysLeftInMonth(holidays = []): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Convert holiday strings to Date objects
  const holidayDates = holidays.map((dateStr) =>
    new Date(dateStr).toDateString()
  );

  // Get the last day of the current month
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  let workdays = 0;

  // Iterate from today to the last day of the month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();

    // Check if the day is a workday and not a holiday
    if (dayOfWeek !== 0 && !holidayDates.includes(date.toDateString())) {
      workdays++;
    }
  }

  return workdays;
}
