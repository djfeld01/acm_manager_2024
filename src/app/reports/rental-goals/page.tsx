import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { RentalGoalsOverviewClient } from "./_components/RentalGoalsOverviewClient";

export default function RentalGoalsPage() {
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rental Goals Prediction</h1>
          <p className="text-muted-foreground">
            AI-assisted rental goal recommendations using statistical modeling and historical trends
          </p>
        </div>
        <RentalGoalsOverviewClient />
      </div>
    </PageAuthWrapper>
  );
}
