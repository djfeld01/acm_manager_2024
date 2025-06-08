import GoalChart from "@/components/GoalChart";
import { db } from "@/db";
import {
  dailyManagementOccupancy,
  monthlyGoals,
  sitelinkLogons,
  sitelinkLogonsRelations,
  storageFacilities,
  tenantActivities,
  userDetails,
  usersToFacilities,
} from "@/db/schema";
import logonWithFacilityUserView from "@/db/schema/views/logonWithFacityUserView";
import { and, count, eq, gte, lte, desc } from "drizzle-orm";
import {
  getDateSentence,
  getLastMonthDateRange,
  parseLocalDate,
} from "@/lib/utils";
import EmployeeContainer from "@/components/EmployeeContainer";
import { auth } from "@/auth";
import { getFacilityPageData } from "@/lib/controllers/facilityController";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import MainPayroll from "../Component/MainPayroll";
import {
  facilityPageDataOptions,
  getMonthlyNumbers,
  payrollPageDataOptions,
} from "@/app/queryHelpers/queryOptions";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";
import MainPayroll2 from "../Component/MainPayroll2";

export default async function Page({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(facilityPageDataOptions(sitelinkId));
  await queryClient.prefetchQuery(payrollPageDataOptions(sitelinkId));

  return (
    <main>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <MainPayroll sitelinkId={sitelinkId} />
      </HydrationBoundary>
    </main>
  );
}
