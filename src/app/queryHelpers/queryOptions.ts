import { db } from "@/db";
import { tenantActivities } from "@/db/schema";
import {
  employeesWhoWorked,
  getCommittedBonus,
  getCommittedChristmasBonus,
  getCommittedHolidayHours,
  getUnpaidActivitiesByEmployee,
  monthlyNumbers,
} from "@/lib/controllers/activityController";
import { getFacilityPageData } from "@/lib/controllers/facilityController";
import { queryOptions, useMutation } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";

export function facilityPageDataOptions(sitelinkId: string) {
  return queryOptions({
    queryKey: ["facilityPageData", sitelinkId],
    queryFn: async () => {
      const data = await getFacilityPageData(sitelinkId);
      return data;
    },
  });
}

export function payrollPageDataOptions(sitelinkId: string) {
  return queryOptions({
    queryKey: ["payrollPageData", sitelinkId],
    queryFn: async () => {
      const data = await getUnpaidActivitiesByEmployee(sitelinkId);
      return data;
    },
    staleTime: Infinity,
  });
}
export function workingEmployees(sitelinkId: string) {
  return queryOptions({
    queryKey: ["workingEmployees", sitelinkId],
    queryFn: async () => {
      const data = await employeesWhoWorked(
        sitelinkId,
        "2025-04-01",
        "2025-04-30"
      );
      return data;
    },
  });
}

export function getMonthlyNumbers(
  sitelinkId: string,
  lastDayOfMonthDate: string
) {
  return queryOptions({
    queryKey: ["monthlyNumbers", sitelinkId],
    queryFn: async () => {
      const data = await monthlyNumbers(sitelinkId, lastDayOfMonthDate);
      return data;
    },
    staleTime: Infinity,
  });
}
export function committedHolidayHoursOptions(
  sitelinkId: string,
  employeeId: string,
  payPeriodId: string
) {
  return queryOptions({
    queryKey: ["committedHolidayHours", payPeriodId, sitelinkId, employeeId],
    queryFn: async () => {
      const data = await getCommittedHolidayHours(
        sitelinkId,
        employeeId,
        payPeriodId
      );
      return data;
    },
  });
}

export function committedBonusOptions(
  sitelinkId: string,
  employeeId: string,
  payPeriodId: string
) {
  return queryOptions({
    queryKey: ["committedBonus", payPeriodId, sitelinkId, employeeId],
    queryFn: async () => {
      const data = await getCommittedBonus(sitelinkId, employeeId, payPeriodId);
      return data;
    },
  });
}

export function committedChristmasBonusOptions(
  sitelinkId: string,
  employeeId: string,
  payPeriodId: string
) {
  return queryOptions({
    queryKey: ["committedChristmasBonus", payPeriodId, sitelinkId, employeeId],
    queryFn: async () => {
      const data = await getCommittedChristmasBonus(
        sitelinkId,
        employeeId,
        payPeriodId
      );
      return data;
    },
  });
}
