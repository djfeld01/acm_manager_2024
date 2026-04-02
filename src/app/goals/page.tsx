import { auth } from "@/auth";
import { db } from "@/db";
import { storageFacilities } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { GoalsPageClient } from "./_components/GoalsPageClient";

const ALLOWED_ROLES = ["ADMIN", "SUPERVISOR", "MANAGER", "OWNER"];

async function GoalsPage() {
  const session = await auth();
  const role = session?.user?.role as string | null | undefined;

  if (!session?.user || !role || !ALLOWED_ROLES.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">You do not have permission to view this page.</p>
      </div>
    );
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

  return <GoalsPageClient facilities={facilities} />;
}

export default GoalsPage;
