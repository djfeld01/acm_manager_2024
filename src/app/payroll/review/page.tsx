import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import React from "react";
import { db } from "@/db";
import { payPeriod } from "@/db/schema";
import { gte } from "drizzle-orm";
import ReviewLocationCard from "./_components/ReviewLocationCard";

const ALLOWED_ROLES = ["SUPERVISOR", "ADMIN"];

async function page() {
  const session = await auth();

  if (!session?.user?.userDetailId) {
    return <div>Access denied. Please contact an administrator.</div>;
  }

  if (!session.user.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">You are not authorized to view this page!</p>
      </div>
    );
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

  const nextPayPeriod = nextPayPeriodArray[0];

  const locations = await getFacilityConnections(session.user.userDetailId);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Payroll Review</h1>
        {nextPayPeriod?.startDate && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Pay period: {nextPayPeriod.startDate} – {nextPayPeriod.endDate}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <ReviewLocationCard
            key={location.sitelinkId}
            sitelinkId={location.sitelinkId}
            facilityName={location.facilityName}
            payPeriodId={nextPayPeriod.payPeriodId}
          />
        ))}
      </div>
    </div>
  );
}

export default page;
