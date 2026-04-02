import { auth } from "@/auth";
import { Protected, ROLES } from "@/contexts/AuthContext";
import { db } from "@/db";
import { storageFacilities } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { GoalsPageClient } from "./_components/GoalsPageClient";

async function GoalsPage() {
  const session = await auth();
  if (!session?.user) {
    return <div>Access denied. Please contact an administrator.</div>;
  }

  const facilities = await db.query.storageFacilities.findMany({
    where: eq(storageFacilities.currentClient, true),
    columns: {
      sitelinkId: true,
      facilityAbbreviation: true,
      facilityName: true,
    },
    orderBy: asc(storageFacilities.facilityAbbreviation),
  });

  return (
    <Protected
      roles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.MANAGER]}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg">You do not have permission to view this page.</p>
        </div>
      }
    >
      <GoalsPageClient facilities={facilities} />
    </Protected>
  );
}

export default GoalsPage;
