import { db } from "@/db";
import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { TimecardReconcileClient } from "./_components/TimecardReconcileClient";

export default async function TimecardCheckPage() {
  const payPeriods = await db.query.payPeriod.findMany({
    orderBy: (payPeriod, { desc }) => [desc(payPeriod.startDate)],
  });

  return (
    <PageAuthWrapper requireAuthentication={true} allowedRoles={[Role.ADMIN, Role.OWNER]}>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timecard Check</h1>
          <p className="text-muted-foreground">
            Upload a Paycor timecard export for a pay period to see what&apos;s
            missing or mismatched against commissions, vacation, holiday,
            bonuses, and mileage already committed in the app.
          </p>
        </div>
        <TimecardReconcileClient payPeriods={payPeriods} />
      </div>
    </PageAuthWrapper>
  );
}
