import { db } from "@/db";
import { tenantActivities } from "@/db/schema";
import { getUnpaidActivitiesByEmployee } from "@/lib/controllers/activityController";
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
