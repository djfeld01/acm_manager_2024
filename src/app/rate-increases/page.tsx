import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { RateIncreasesClient } from "./_components/RateIncreasesClient";
import { loadRateIncreaseFacilities } from "./_lib/server/facilities";

/** Looks up store names. A separate component so it only runs once the
 *  wrapper above has let the visitor in. */
async function Workspace({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const facilities = (await loadRateIncreaseFacilities()).map((f) => ({
    id: f.id,
    name: f.name,
    code: f.code,
    place: `${f.city}, ${f.state}`,
    state: f.state,
  }));
  if (!facilities.length) return <p className="text-sm text-muted-foreground">No stores found.</p>;
  // Without a ?site= in the address, open on Columbus (where the first batch was built), else the first store.
  const initial = (facilities.find((f) => f.id === site) ?? facilities.find((f) => f.id === "33884") ?? facilities[0]!).id;
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
