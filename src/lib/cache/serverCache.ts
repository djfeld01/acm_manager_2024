import { unstable_cache } from "next/cache";
import { revalidateTag, revalidatePath } from "next/cache";

// Cache configuration for server-side caching
export interface ServerCacheConfig {
  tags?: string[];
  revalidate?: number | false;
}

// Cache key generator
export function createCacheKey(
  prefix: string,
  params: Record<string, any> = {}
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join("|");

  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}

// Generic cached function wrapper
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyFn: (...args: T) => string,
  config: ServerCacheConfig = {}
) {
  return unstable_cache(fn, undefined, {
    tags: config.tags,
    revalidate: config.revalidate,
  });
}

// Specific cache functions for common data types

// User data caching
export const getCachedUser = createCachedFunction(
  async (userId: string) => {
    // This would typically fetch from database
    console.log(`Fetching user: ${userId}`);

    // Simulate database call
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      id: userId,
      name: `User ${userId}`,
      email: `user${userId}@example.com`,
      role: "manager",
      lastLogin: new Date().toISOString(),
    };
  },
  (userId: string) => `user:${userId}`,
  {
    tags: ["users"],
    revalidate: 300, // 5 minutes
  }
);

// Location data caching
export const getCachedLocation = createCachedFunction(
  async (locationId: string) => {
    console.log(`Fetching location: ${locationId}`);

    // Simulate database call
    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      id: locationId,
      name: `Storage Center ${locationId}`,
      address: "123 Main St",
      city: "Austin",
      state: "TX",
      occupancyRate: 85,
      revenue: 125000,
      lastUpdated: new Date().toISOString(),
    };
  },
  (locationId: string) => `location:${locationId}`,
  {
    tags: ["locations"],
    revalidate: 180, // 3 minutes
  }
);

// Locations list caching
export const getCachedLocations = createCachedFunction(
  async (
    filters: {
      state?: string;
      active?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ) => {
    console.log("Fetching locations with filters:", filters);

    // Simulate database call
    await new Promise((resolve) => setTimeout(resolve, 200));

    const locations = Array.from({ length: filters.limit || 20 }, (_, i) => ({
      id: `loc-${(filters.offset || 0) + i + 1}`,
      name: `Storage Center ${(filters.offset || 0) + i + 1}`,
      city: "Austin",
      state: filters.state || "TX",
      active: filters.active ?? true,
      occupancyRate: 70 + Math.random() * 30,
      revenue: 50000 + Math.random() * 100000,
    }));

    return {
      locations,
      total: 1000,
      hasMore: (filters.offset || 0) + locations.length < 1000,
    };
  },
  (filters) => createCacheKey("locations", filters),
  {
    tags: ["locations", "locations-list"],
    revalidate: 120, // 2 minutes
  }
);

// Dashboard data caching
export const getCachedDashboardData = createCachedFunction(
  async (userId: string, locationIds: string[] = []) => {
    console.log(`Fetching dashboard data for user: ${userId}`);

    // Simulate aggregated data fetch
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      totalRevenue: 2500000,
      totalLocations: locationIds.length || 17,
      averageOccupancy: 82.5,
      monthlyGrowth: 5.2,
      alerts: [
        {
          id: "alert-1",
          type: "warning",
          message: "Low occupancy at Downtown Storage",
          locationId: "loc-1",
        },
        {
          id: "alert-2",
          type: "info",
          message: "Maintenance scheduled for North Austin",
          locationId: "loc-2",
        },
      ],
      recentActivity: [
        {
          id: "activity-1",
          type: "rental",
          description: "New rental at South Storage",
          timestamp: new Date().toISOString(),
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  },
  (userId, locationIds) =>
    createCacheKey("dashboard", { userId, locations: locationIds.join(",") }),
  {
    tags: ["dashboard", "users", "locations"],
    revalidate: 60, // 1 minute
  }
);

// Payroll data caching
export const getCachedPayrollData = createCachedFunction(
  async (employeeId: string, period: string) => {
    console.log(
      `Fetching payroll data for employee: ${employeeId}, period: ${period}`
    );

    // Simulate payroll calculation
    await new Promise((resolve) => setTimeout(resolve, 250));

    return {
      employeeId,
      period,
      baseSalary: 4000,
      commission: 850,
      bonus: 200,
      deductions: 150,
      netPay: 4900,
      hoursWorked: 160,
      overtimeHours: 8,
      calculatedAt: new Date().toISOString(),
    };
  },
  (employeeId, period) => `payroll:${employeeId}:${period}`,
  {
    tags: ["payroll"],
    revalidate: 3600, // 1 hour
  }
);

// Reports data caching
export const getCachedReportData = createCachedFunction(
  async (reportType: string, filters: Record<string, any>) => {
    console.log(`Generating report: ${reportType}`, filters);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      reportType,
      filters,
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        value: Math.random() * 1000,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      })),
      summary: {
        total: 100,
        average: 500,
        trend: "up",
      },
      generatedAt: new Date().toISOString(),
    };
  },
  (reportType, filters) => createCacheKey(`report:${reportType}`, filters),
  {
    tags: ["reports"],
    revalidate: 1800, // 30 minutes
  }
);

// Cache invalidation utilities
export const serverCacheUtils = {
  // Invalidate by tag
  invalidateTag: (tag: string) => {
    revalidateTag(tag);
  },

  // Invalidate by path
  invalidatePath: (path: string) => {
    revalidatePath(path);
  },

  // Invalidate multiple tags
  invalidateTags: (tags: string[]) => {
    tags.forEach((tag) => revalidateTag(tag));
  },

  // Invalidate user-related data
  invalidateUser: (userId: string) => {
    revalidateTag("users");
    revalidatePath(`/users/${userId}`);
    revalidatePath("/dashboard");
  },

  // Invalidate location-related data
  invalidateLocation: (locationId: string) => {
    revalidateTag("locations");
    revalidatePath(`/locations/${locationId}`);
    revalidatePath("/locations");
    revalidatePath("/dashboard");
  },

  // Invalidate all location data
  invalidateAllLocations: () => {
    revalidateTag("locations");
    revalidateTag("locations-list");
    revalidatePath("/locations");
    revalidatePath("/dashboard");
  },

  // Invalidate dashboard data
  invalidateDashboard: () => {
    revalidateTag("dashboard");
    revalidatePath("/dashboard");
  },

  // Invalidate payroll data
  invalidatePayroll: (employeeId?: string) => {
    revalidateTag("payroll");
    if (employeeId) {
      revalidatePath(`/payroll/employee/${employeeId}`);
    } else {
      revalidatePath("/payroll");
    }
  },

  // Invalidate reports
  invalidateReports: () => {
    revalidateTag("reports");
    revalidatePath("/reports");
  },

  // Bulk invalidation for data updates
  invalidateDataUpdate: (
    type: "user" | "location" | "payroll" | "all",
    id?: string
  ) => {
    switch (type) {
      case "user":
        if (id) serverCacheUtils.invalidateUser(id);
        break;
      case "location":
        if (id) serverCacheUtils.invalidateLocation(id);
        else serverCacheUtils.invalidateAllLocations();
        break;
      case "payroll":
        serverCacheUtils.invalidatePayroll(id);
        break;
      case "all":
        serverCacheUtils.invalidateTags([
          "users",
          "locations",
          "dashboard",
          "payroll",
          "reports",
        ]);
        revalidatePath("/");
        break;
    }
  },
};

// Preload utilities for prefetching
export const preloadUtils = {
  // Preload user data
  preloadUser: (userId: string) => {
    void getCachedUser(userId);
  },

  // Preload location data
  preloadLocation: (locationId: string) => {
    void getCachedLocation(locationId);
  },

  // Preload locations list
  preloadLocations: (filters?: Parameters<typeof getCachedLocations>[0]) => {
    void getCachedLocations(filters);
  },

  // Preload dashboard data
  preloadDashboard: (userId: string, locationIds?: string[]) => {
    void getCachedDashboardData(userId, locationIds);
  },

  // Preload multiple resources
  preloadAll: async (resources: {
    users?: string[];
    locations?: string[];
    dashboard?: { userId: string; locationIds?: string[] };
  }) => {
    const promises: Promise<any>[] = [];

    if (resources.users) {
      promises.push(...resources.users.map((id) => getCachedUser(id)));
    }

    if (resources.locations) {
      promises.push(...resources.locations.map((id) => getCachedLocation(id)));
    }

    if (resources.dashboard) {
      promises.push(
        getCachedDashboardData(
          resources.dashboard.userId,
          resources.dashboard.locationIds
        )
      );
    }

    await Promise.allSettled(promises);
  },
};

// Cache warming utilities
export const cacheWarmingUtils = {
  // Warm up common data
  warmUpCommonData: async () => {
    // Preload frequently accessed data
    await Promise.allSettled([
      getCachedLocations({ limit: 50 }), // First page of locations
      // Add other common data preloading here
    ]);
  },

  // Warm up user-specific data
  warmUpUserData: async (userId: string, locationIds: string[]) => {
    await Promise.allSettled([
      getCachedUser(userId),
      getCachedDashboardData(userId, locationIds),
      ...locationIds.slice(0, 5).map((id) => getCachedLocation(id)), // First 5 locations
    ]);
  },
};
