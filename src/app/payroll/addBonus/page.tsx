import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import React from "react";
import LocationCard from "./_components/LocationCard";
import { db } from "@/db";
import { payPeriod } from "@/db/schema";
import { gte } from "drizzle-orm";
import { Protected, ROLES } from "@/contexts/AuthContext";

async function page() {
  const session = await auth();

  if (!session?.user?.userDetailId) {
    return <div>Access denied. Please contact an administrator.</div>;
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const nextPayPeriodArray = await db
    .select()
    .from(payPeriod)
    .where(gte(payPeriod.processingDate, yesterday.toDateString()))
    .limit(1)
    .orderBy(payPeriod.processingDate);

  const nextPayPeriodId = nextPayPeriodArray[0].payPeriodId;
  console.log(nextPayPeriodArray[0].processingDate);

  const locations = await getFacilityConnections(
    session?.user?.userDetailId || ""
  );

  return (
    <Protected
      roles={[ROLES.ADMIN]}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg">You are not authorized to view this page!</p>
        </div>
      }
    >
      <div className="grid grid-cols-2">
        {locations.map((location) => (
          <LocationCard
            nextPayPeriodId={nextPayPeriodId}
            sitelinkId={location.sitelinkId}
            facilityName={location.facilityName}
            key={location.sitelinkId}
          />
        ))}
      </div>
    </Protected>
  );
}

export default page;
