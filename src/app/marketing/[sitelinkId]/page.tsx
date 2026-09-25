import { PageAuthWrapper } from "@/lib/auth/PageAuthWrapper";
import { Role } from "@/db/schema/user";
import { FacilityMarketingDetailClient } from "./_components/FacilityMarketingDetailClient";

interface Props {
  params: Promise<{ sitelinkId: string }>;
}

export default async function FacilityMarketingDetailPage({ params }: Props) {
  const { sitelinkId } = await params;
  return (
    <PageAuthWrapper
      requireAuthentication={true}
      allowedRoles={[Role.ADMIN, Role.OWNER]}
    >
      <div className="container mx-auto p-6 space-y-6">
        <FacilityMarketingDetailClient sitelinkId={sitelinkId} />
      </div>
    </PageAuthWrapper>
  );
}
