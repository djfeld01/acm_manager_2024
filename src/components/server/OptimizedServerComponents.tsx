import React, { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCachedUser,
  getCachedLocation,
  getCachedLocations,
  getCachedDashboardData,
} from "@/lib/cache/serverCache";
import { Building2, Users, TrendingUp, DollarSign } from "lucide-react";

// Loading skeletons
export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LocationListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Server Components with optimized data loading

// Dashboard metrics component
export async function DashboardMetrics({
  userId,
  locationIds,
}: {
  userId: string;
  locationIds?: string[];
}) {
  const dashboardData = await getCachedDashboardData(userId, locationIds);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">
                ${dashboardData.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-green-600">
                +{dashboardData.monthlyGrowth}% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Locations</p>
              <p className="text-2xl font-bold">
                {dashboardData.totalLocations}
              </p>
              <p className="text-xs text-muted-foreground">Active facilities</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Occupancy</p>
              <p className="text-2xl font-bold">
                {dashboardData.averageOccupancy}%
              </p>
              <p className="text-xs text-muted-foreground">
                Across all locations
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold">
                {dashboardData.alerts.length}
              </p>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-bold">
                {dashboardData.alerts.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Location list component
export async function LocationsList({
  filters = {},
  limit = 20,
}: {
  filters?: { state?: string; active?: boolean };
  limit?: number;
}) {
  const { locations } = await getCachedLocations({ ...filters, limit });

  return (
    <div className="space-y-4">
      {locations.map((location) => (
        <Card key={location.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{location.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {location.city}, {location.state}
                </p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={location.active ? "default" : "secondary"}>
                  {location.occupancyRate.toFixed(1)}%
                </Badge>
                <p className="text-sm font-mono text-green-600">
                  ${location.revenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// User profile component
export async function UserProfile({ userId }: { userId: string }) {
  const user = await getCachedUser(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Login:</span>
              <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Optimized page layout with parallel data loading
export async function OptimizedDashboardLayout({
  userId,
  locationIds,
}: {
  userId: string;
  locationIds: string[];
}) {
  // Parallel data loading - all requests start simultaneously
  const [dashboardDataPromise, userPromise, locationsPromise] = [
    getCachedDashboardData(userId, locationIds),
    getCachedUser(userId),
    getCachedLocations({ limit: 5 }),
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard metrics with suspense boundary */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardMetrics userId={userId} locationIds={locationIds} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User profile */}
        <Suspense fallback={<Skeleton className="h-48" />}>
          <UserProfile userId={userId} />
        </Suspense>

        {/* Recent locations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LocationListSkeleton />}>
              <LocationsList limit={5} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Streaming component for progressive loading
export function StreamingLocationDetails({
  locationId,
}: {
  locationId: string;
}) {
  return (
    <div className="space-y-6">
      {/* Basic info loads first */}
      <Suspense fallback={<Skeleton className="h-32" />}>
        <LocationBasicInfo locationId={locationId} />
      </Suspense>

      {/* Metrics load second */}
      <Suspense fallback={<Skeleton className="h-48" />}>
        <LocationMetrics locationId={locationId} />
      </Suspense>

      {/* Activity loads last */}
      <Suspense fallback={<Skeleton className="h-64" />}>
        <LocationActivity locationId={locationId} />
      </Suspense>
    </div>
  );
}

// Individual components for streaming
async function LocationBasicInfo({ locationId }: { locationId: string }) {
  const location = await getCachedLocation(locationId);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{location.name}</h2>
            <p className="text-muted-foreground">{location.address}</p>
            <p className="text-sm text-muted-foreground">
              {location.city}, {location.state}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function LocationMetrics({ locationId }: { locationId: string }) {
  const location = await getCachedLocation(locationId);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Occupancy Rate</p>
            <p className="text-2xl font-bold">{location.occupancyRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${location.occupancyRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-2xl font-bold">
              ${location.revenue.toLocaleString()}
            </p>
            <p className="text-xs text-green-600">
              Updated {new Date(location.lastUpdated).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function LocationActivity({ locationId }: { locationId: string }) {
  // Simulate slower loading for activity data
  await new Promise((resolve) => setTimeout(resolve, 500));

  const activities = [
    {
      id: 1,
      type: "rental",
      description: "New rental - Unit A123",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "payment",
      description: "Payment received - $150",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "inquiry",
      description: "Phone inquiry about pricing",
      time: "6 hours ago",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-2 border rounded"
            >
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
