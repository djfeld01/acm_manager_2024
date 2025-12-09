import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DiscrepancyReviewInterface } from "@/components/reconciliation/DiscrepancyReviewInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Shield } from "lucide-react";

export default async function GlobalReviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has Director of Accounting role
  const userRole = session.user.role || "";
  if (!["ADMIN", "OWNER"].includes(userRole)) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied - Director of Accounting Only
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium">Restricted Access</p>
                <p className="text-muted-foreground">
                  This review dashboard is exclusively for the Director of
                  Accounting to approve or reject discrepancies.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Your current role:</strong>{" "}
                {userRole || "No role assigned"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Required role: ADMIN or OWNER (Director of Accounting)
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">What you can do instead:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>
                  • View reconciliation status at <code>/reconciliation</code>
                </li>
                <li>• Create discrepancies for your facility</li>
                <li>• View facility-specific reconciliation details</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Please contact your administrator if you believe this is an error
              or if you need Director of Accounting access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="h-5 w-5" />
            Director of Accounting Review Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800">
            Welcome, {session.user.name || session.user.email}. This dashboard
            provides a centralized view of all discrepancies requiring your
            approval across all facilities.
          </p>
          <div className="mt-3 text-sm text-blue-700">
            <p>• Review discrepancies from all facilities in one place</p>
            <p>• Approve or reject items with detailed notes</p>
            <p>• Use bulk actions for efficient processing</p>
            <p>• Filter by priority, facility, or time period</p>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<ReviewDashboardSkeleton />}>
        <DiscrepancyReviewInterface
          userId={session.user.id}
          userRole={userRole}
        />
      </Suspense>
    </div>
  );
}

function ReviewDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Summary Stats Skeleton */}
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

      {/* Filters Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Discrepancies List Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-4 w-4 mt-1" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-4 pt-3 border-t">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
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
