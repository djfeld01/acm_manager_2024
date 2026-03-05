import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { getFacilitiesWithCompetitors } from "@/lib/controllers/competitorController";
import { CompetitorsClient } from "./_components/CompetitorsClient";

async function CompetitorsPageContent() {
  const facilities = await getFacilitiesWithCompetitors();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Competitor Pricing
        </h1>
        <p className="text-muted-foreground">
          Manage competitor facilities and pricing scrapes per location
        </p>
      </div>
      <CompetitorsClient facilities={facilities} />
    </div>
  );
}

export default function CompetitorsPage() {
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <CompetitorsPageContent />
    </PageAuthWrapper>
  );
}
