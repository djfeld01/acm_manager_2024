import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { ManagementFeesClient } from "./_components/ManagementFeesClient";

export default function ManagementFeesPage() {
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Management Fees</h1>
          <p className="text-muted-foreground">
            Monthly collections by location — select a month to calculate fees
          </p>
        </div>
        <ManagementFeesClient />
      </div>
    </PageAuthWrapper>
  );
}
