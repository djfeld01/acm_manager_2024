import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DiscrepancyReviewInterface } from "@/components/reconciliation/DiscrepancyReviewInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DiscrepanciesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has appropriate role
  const userRole = session.user.role || "";
  if (!["ADMIN", "OWNER", "SUPERVISOR", "MANAGER"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DiscrepancyReviewInterface
          userId={session.user.id}
          userRole={userRole}
        />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Skeleton */}
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

      {/* Facility Summaries Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="text-center">
                      <Skeleton className="h-4 w-8 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
