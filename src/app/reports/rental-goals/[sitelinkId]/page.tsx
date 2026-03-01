import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { FacilityRentalDetailClient } from "./_components/FacilityRentalDetailClient";

interface Props {
  params: Promise<{ sitelinkId: string }>;
}

export default async function FacilityRentalDetailPage({ params }: Props) {
  const { sitelinkId } = await params;
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <div className="container mx-auto p-6 space-y-6">
        <FacilityRentalDetailClient sitelinkId={sitelinkId} />
      </div>
    </PageAuthWrapper>
  );
}
