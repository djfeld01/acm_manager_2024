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
import { getDateSentence, parseLocalDate } from "@/lib/utils";
import EmployeeContainer from "@/components/EmployeeContainer";
import { auth } from "@/auth";
import { getFacilityPageData } from "@/lib/controllers/facilityController";

export default async function Page({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;

  const { facility, monthlyRentals, rentalGoal, occupancies, latestLogons } =
    await getFacilityPageData(sitelinkId);
  const latestLogonDate = latestLogons[0].logonDate;
  const latestLogonFormatted = getDateSentence(
    latestLogonDate || new Date(2024, 1, 1)
  );
  return (
    <div className="container mx-auto p-4">
      <div className="bg-blue-600 text-white p-6 rounded-lg mb-1 text-center">
        <h1 className="text-2xl font-bold">{facility?.facilityName}</h1>
        <p>{facility?.streetAddress}</p>
        <p>
          {facility?.city}, {facility?.state}
        </p>
        <p>
          Email: {facility?.email} | Phone: {facility?.phoneNumber}
        </p>
        <p>
          Last Logon: {latestLogonFormatted} - {latestLogons[0].firstName}{" "}
          {latestLogons[0].lastName}
        </p>
      </div>
      <div className="flex flex-col lg:flex-row justify-between gap-2 mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex-1 text-center">
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
      <EmployeeContainer sitelinkId={sitelinkId} />
    </div>
  );
}
