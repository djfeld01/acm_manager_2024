import GoalChart from "@/components/GoalChart";
import { db } from "@/db";
import {
  dailyManagementOccupancy,
  monthlyGoals,
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
  const sevenDaysAgoString = sevenDaysAgo.toDateString();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const thirtyDaysAgoString = thirtyDaysAgo.toDateString();
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

  const latestOccupancy = await db.query.dailyManagementOccupancy.findFirst({
    where: (dailyManagementOccupancy, { eq }) =>
      eq(dailyManagementOccupancy.facilityId, sitelinkId),
  });

  const facilityData = await db.query.storageFacilities.findFirst({
    where: (storageFacilities, { eq }) =>
      eq(storageFacilities.sitelinkId, sitelinkId),
    with: {
      monthlyGoals: {
        where: (monthlyGoals, { eq }) => eq(monthlyGoals.month, goalsDate),
      },
      dailyManagementOccupancy: {
        where: (dailyManagementOccupancy, { eq, or }) =>
          or(
            eq(dailyManagementOccupancy.date, sevenDaysAgoString),
            eq(dailyManagementOccupancy.date, thirtyDaysAgoString)
          ),
      },
    },
  });
  const historicOccupancies = facilityData?.dailyManagementOccupancy || [];
  const occupancies = [latestOccupancy, ...historicOccupancies];
  const monthlyRentals = thisMonthsRentals[0].monthlyRentals;
  const rentalGoal = facilityData?.monthlyGoals[0]?.rentalGoal || 0;
  return { facility: facilityData, monthlyRentals, rentalGoal, occupancies };
}
export default async function Page({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;

  const { facility, monthlyRentals, rentalGoal, occupancies } =
    await getPageData(sitelinkId);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-blue-600 text-white p-6 rounded-lg mb-8 text-center">
        <h1 className="text-2xl font-bold">{facility?.facilityName}</h1>
        <p>{facility?.streetAddress}</p>
        <p>{facility?.city}</p>
        <p>{facility?.state}</p>
        <p>
          Email: {facility?.email} | Phone: {facility?.phoneNumber}
        </p>
      </div>
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          <GoalChart
            facilityName={facility?.facilityName || ""}
            monthlyRentals={monthlyRentals}
            rentalGoal={rentalGoal}
          />
        </div>
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          <div>
            Current Unit Occupancy:{" "}
            {(occupancies[0]?.unitOccupancy
              ? occupancies[0].unitOccupancy * 100
              : 0
            ).toFixed(1)}
            %
          </div>
          <div>
            7 Days Ago Unit Occupancy:{" "}
            {(occupancies[1]?.unitOccupancy
              ? occupancies[1].unitOccupancy * 100
              : 0
            ).toFixed(1)}
            %
          </div>
          <div>
            30 Days Ago Unit Occupancy:{" "}
            {(occupancies[2]?.unitOccupancy
              ? occupancies[2].unitOccupancy * 100
              : 0
            ).toFixed(1)}
            %
          </div>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          <div>
            Current Occupied Units: {occupancies[0]?.occupiedUnits || 0}
          </div>
          <div>
            7 Day Change:{" "}
            {(occupancies[0]?.occupiedUnits ?? 0) -
              (occupancies[1]?.occupiedUnits ?? 0)}
          </div>
          <div>
            30 Day Change:{" "}
            {(occupancies[0]?.occupiedUnits ?? 0) -
              (occupancies[2]?.occupiedUnits ?? 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
