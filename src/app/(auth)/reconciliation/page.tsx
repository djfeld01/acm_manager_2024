import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MonthlyReconciliationDashboard } from "@/components/reconciliation/MonthlyReconciliationDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ReconciliationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has admin or area manager role
  const userRole = session.user.role || "";
  if (!["ADMIN", "OWNER", "SUPERVISOR"].includes(userRole)) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-primary text-primary-foreground rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
            <p className="text-primary-foreground/80 mt-0.5">
              Monthly reconciliation dashboard for all facilities
            </p>
          </div>
          {["ADMIN", "OWNER"].includes(userRole) && (
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/reconciliation/review">Director Review</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/reconciliation/discrepancies">Discrepancies</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <MonthlyReconciliationDashboard
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
      {/* Month/Year Selector Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
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

      {/* Facilities Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
