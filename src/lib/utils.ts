import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// given a date Find if it was today, or yesterday, otherwise day of the week.

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
