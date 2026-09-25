import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { MarketingOverviewClient } from "./_components/MarketingOverviewClient";

export default function MarketingPage() {
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Analytics</h1>
          <p className="text-muted-foreground">
            Weekly inquiry volume and conversion by facility — spot a
            portfolio-wide shift versus a store-specific one before month-end.
          </p>
        </div>
        <MarketingOverviewClient />
      </div>
    </PageAuthWrapper>
  );
}
