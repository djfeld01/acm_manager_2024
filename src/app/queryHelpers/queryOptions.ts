import { db } from "@/db";
import { tenantActivities } from "@/db/schema";
import {
  employeesWhoWorked,
  getCommitedBonus,
  getCommittedHolidayHours,
  getUnpaidActivitiesByEmployee,
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
  });
}
export function workingEmployees(sitelinkId: string) {
  return queryOptions({
    queryKey: ["workingEmployees", sitelinkId],
    queryFn: async () => {
      const data = await employeesWhoWorked(
        sitelinkId,
        "2024-11-01",
        "2024-11-30"
      );
      return data;
    },
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

export function commitedBonusOptions(
  sitelinkId: string,
  employeeId: string,
  payPeriodId: string
) {
  return queryOptions({
    queryKey: ["committedBonus", payPeriodId, sitelinkId, employeeId],
    queryFn: async () => {
      const data = await getCommitedBonus(sitelinkId, employeeId, payPeriodId);
      return data;
    },
  });
}
