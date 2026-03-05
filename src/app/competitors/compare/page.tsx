import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { getFacilitiesWithRates } from "@/lib/controllers/rateCardController";
import { CompareClient } from "./_components/CompareClient";

async function ComparePageContent() {
  const facilities = await getFacilitiesWithRates();
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Price Comparison</h1>
        <p className="text-muted-foreground">
          Your rates vs. competitor rates by unit size
        </p>
      </div>
      <CompareClient facilities={facilities} />
    </div>
  );
}

export default function ComparePage() {
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <ComparePageContent />
    </PageAuthWrapper>
  );
}
