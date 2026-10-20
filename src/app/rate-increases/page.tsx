import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { db } from "@/db";
import { storageFacilities } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { RateIncreasesClient } from "./_components/RateIncreasesClient";
import { RATE_INCREASE_FACILITY_IDS } from "./_lib/config";

/** Looks up store names. A separate component so it only runs once the
 *  wrapper above has let the visitor in. */
async function Workspace({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const rows = await db
    .select({ id: storageFacilities.sitelinkId, name: storageFacilities.facilityName })
    .from(storageFacilities)
    .where(inArray(storageFacilities.sitelinkId, [...RATE_INCREASE_FACILITY_IDS]));
  const facilities = RATE_INCREASE_FACILITY_IDS.map((id) => ({
    id,
    name: rows.find((r) => r.id === id)?.name ?? id,
  }));
  const initial = facilities.find((f) => f.id === site)?.id ?? facilities[0]!.id;
  return <RateIncreasesClient facilities={facilities} initialSitelinkId={initial} />;
}

export default function RateIncreasesPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  return (
    <PageAuthWrapper requireAuthentication={true} allowedRoles={[Role.ADMIN, Role.OWNER]}>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rate Increases</h1>
          <p className="text-muted-foreground">
            Street-rate position, length of stay, expected move-outs, and marketing demand for each store —
            everything needed to decide how big a batch can safely be.
          </p>
        </div>
        <Workspace searchParams={searchParams} />
      </div>
    </PageAuthWrapper>
  );
}
