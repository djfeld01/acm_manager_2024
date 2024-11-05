import GoalChart from "@/components/GoalChart";
import { db } from "@/db";
import {
  dailyManagementOccupancy,
  sitelinkLogons,
  sitelinkLogonsRelations,
  storageFacilities,
  tenantActivities,
} from "@/db/schema";
import { and, count, eq, gte, lte } from "drizzle-orm";

async function getPageData(sitelinkId: string) {
  const date = new Date();
  const goalsDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const today = new Date();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const thisMonthsRentals = await db
    .select({ monthlyRentals: count() })
    .from(tenantActivities)
    .where(
      and(
        eq(tenantActivities.facilityId, sitelinkId),
        eq(tenantActivities.activityType, "MoveIn"),
        lte(tenantActivities.date, today),
        gte(tenantActivities.date, goalsDate)
      )
    )
    .limit(1);

  const thisMonthsGoal = await db.query.monthlyGoals.findFirst({
    where: (monthlyGoals, { and, eq, gt }) =>
      and(
        eq(monthlyGoals.month, goalsDate),
        eq(monthlyGoals.sitelinkId, sitelinkId)
      ),
  });

  // const pageData = await db.query.storageFacilities.findFirst({
  //   where: (storageFacilities, { eq }) =>
  //     eq(storageFacilities.sitelinkId, sitelinkId),
  //   with: {
  //     tenantActivities: {
  //       where: (tenantActivity, { lte, eq, gte, and }) =>
  //         and(
  //           eq(tenantActivity.activityType, "MoveIn"),
  //           lte(tenantActivity.date, today),
  //           gte(tenantActivity.date, goalsDate)
  //         ),
  //     },
  //     monthlyGoals: {
  //       where: (monthlyGoals, { and, eq, gt }) =>
  //         and(
  //           eq(monthlyGoals.month, goalsDate),
  //           eq(monthlyGoals.sitelinkId, sitelinkId)
  //         ),
  //     },
  //     dailyManagementOccupancy: {
  //       where: (dailyManagementOccupancy, { or, eq }) =>
  //         or(
  //           eq(dailyManagementOccupancy.date, today.toDateString()),
  //           eq(dailyManagementOccupancy.date, sevenDaysAgo.toDateString()),
  //           eq(dailyManagementOccupancy.date, thirtyDaysAgo.toDateString())
  //         ),
  //       orderBy: (dailyManagementOccupancy, { desc }) => [
  //         desc(dailyManagementOccupancy.date),
  //       ],
  //     },
  //   },
  // });

  const monthlyRentals = thisMonthsRentals[0].monthlyRentals;
  const rentalGoal = thisMonthsGoal?.rentalGoal || 0;
  return { monthlyRentals, rentalGoal };
}
export default async function Page({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;
  const facility = await db.query.storageFacilities.findFirst({
    where: (storageFacilities, { eq }) =>
      eq(storageFacilities.sitelinkId, sitelinkId),
  });
  const { monthlyRentals, rentalGoal } = await getPageData(sitelinkId);

  return (
    <div className="">
      {/* <GoalChart
        facilityName={facility?.facilityName || ""}
        monthlyRentals={monthlyRentals}
        rentalGoal={rentalGoal}
      /> */}

      <GoalChart
        facilityName={facility?.facilityName || ""}
        monthlyRentals={monthlyRentals}
        rentalGoal={rentalGoal}
      />
      {/* <div>{pageData?.facilityName}</div> */}
      {/* <div>Rental Goal: {goals?.rentalGoal}</div>
      <div>Retail Goal: ${goals?.retailGoal}</div>
      <div>Collections Goal: ${goals?.collectionsGoal}</div> */}
    </div>
  );
}
