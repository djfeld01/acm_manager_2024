import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { RateIncreasesClient } from "./_components/RateIncreasesClient";
import { PILOT_FACILITY_IDS } from "./_lib/config";

export default function RateIncreasesPage() {
  return (
    <PageAuthWrapper requireAuthentication={true} allowedRoles={[Role.ADMIN, Role.OWNER]}>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rate Increases</h1>
          <p className="text-muted-foreground">
            Street-rate position, length of stay, expected move-outs, and marketing demand for
            the rate-increase pilot — everything needed to decide how big a batch can safely be.
          </p>
        </div>
        <RateIncreasesClient sitelinkId={PILOT_FACILITY_IDS[0]} />
      </div>
    </PageAuthWrapper>
  );
}
