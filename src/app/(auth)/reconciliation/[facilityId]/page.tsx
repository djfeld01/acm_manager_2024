import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TransactionMatchingWorkspace } from "@/components/reconciliation/TransactionMatchingWorkspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { storageFacilities, bankAccount } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{
    facilityId: string;
  }>;
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function FacilityReconciliationPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has appropriate role
  const userRole = session.user.role || "";
  if (!["ADMIN", "OWNER", "SUPERVISOR", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  const { facilityId } = await params;
  const resolvedSearchParams = await searchParams;
  const month = parseInt(resolvedSearchParams.month || "0");
  const year = parseInt(resolvedSearchParams.year || "0");

  if (!month || !year || month < 1 || month > 12) {
    redirect("/reconciliation");
  }

  // Get facility information
  const facility = await db
    .select({
      facilityId: storageFacilities.sitelinkId,
      facilityName: storageFacilities.facilityName,
      bankAccountId: bankAccount.bankAccountId,
      bankName: bankAccount.bankName,
    })
    .from(storageFacilities)
    .innerJoin(
      bankAccount,
      eq(storageFacilities.sitelinkId, bankAccount.sitelinkId)
    )
    .where(eq(storageFacilities.sitelinkId, facilityId))
    .limit(1);

  if (facility.length === 0) {
    redirect("/reconciliation");
  }

  const facilityInfo = facility[0];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bank Reconciliation - {facilityInfo.facilityName}
          </h1>
          <p className="text-muted-foreground">
            {new Date(year, month - 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}{" "}
            • {facilityInfo.bankName}
          </p>
        </div>
      </div>

      <Suspense fallback={<WorkspaceSkeleton />}>
        <TransactionMatchingWorkspace
          facilityId={facilityId}
          facilityName={facilityInfo.facilityName}
          bankAccountId={facilityInfo.bankAccountId}
          month={month}
          year={year}
          userId={session.user.id}
          userRole={userRole}
        />
      </Suspense>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Status Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Matching Interface Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-3 border rounded"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-3 border rounded"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
