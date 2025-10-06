import { cache } from "react";
import {
  getCachedUser,
  getCachedLocation,
  getCachedLocations,
  getCachedDashboardData,
  getCachedPayrollData,
  preloadUtils,
} from "@/lib/cache/serverCache";

// React cache wrapper for request deduplication
export const getUser = cache(async (userId: string) => {
  return getCachedUser(userId);
});

export const getLocation = cache(async (locationId: string) => {
  return getCachedLocation(locationId);
});

export const getLocations = cache(
  async (filters: Parameters<typeof getCachedLocations>[0] = {}) => {
    return getCachedLocations(filters);
  }
);

export const getDashboardData = cache(
  async (userId: string, locationIds: string[] = []) => {
    return getCachedDashboardData(userId, locationIds);
  }
);

export const getPayrollData = cache(
  async (employeeId: string, period: string) => {
    return getCachedPayrollData(employeeId, period);
  }
);

// Optimized data loaders with parallel fetching
export const dataLoaders = {
  // Load dashboard with all related data in parallel
  loadDashboardPage: async (userId: string, locationIds: string[]) => {
    // Start all requests in parallel
    const [user, dashboardData, locations] = await Promise.all([
      getUser(userId),
      getDashboardData(userId, locationIds),
      getLocations({ limit: 10 }), // Recent locations
    ]);

    // Preload additional data in background
    void preloadUtils.preloadAll({
      locations: locationIds.slice(0, 5), // First 5 locations
    });

    return {
      user,
      dashboardData,
      recentLocations: locations.locations,
    };
  },

  // Load location page with related data
  loadLocationPage: async (locationId: string, userId: string) => {
    // Primary data - load in parallel
    const [location, user] = await Promise.all([
      getLocation(locationId),
      getUser(userId),
    ]);

    // Secondary data - can load after primary
    const relatedLocations = await getLocations({
      state: location.state,
      limit: 5,
    });

    // Preload payroll data if user has access
    if (user.role === "manager" || user.role === "admin") {
      void getPayrollData(userId, new Date().toISOString().slice(0, 7)); // Current month
    }

    return {
      location,
      user,
      relatedLocations: relatedLocations.locations,
    };
  },

  // Load locations list with pagination
  loadLocationsPage: async (
    page: number = 1,
    pageSize: number = 20,
    filters: Record<string, any> = {}
  ) => {
    const offset = (page - 1) * pageSize;

    const locationsData = await getLocations({
      ...filters,
      limit: pageSize,
      offset,
    });

    // Preload next page if there are more results
    if (locationsData.hasMore) {
      void getLocations({
        ...filters,
        limit: pageSize,
        offset: offset + pageSize,
      });
    }

    return locationsData;
  },

  // Load payroll page with employee data
  loadPayrollPage: async (employeeId: string, period: string) => {
    const [user, payrollData] = await Promise.all([
      getUser(employeeId),
      getPayrollData(employeeId, period),
    ]);

    // Preload previous period data
    const prevDate = new Date(period);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevPeriod = prevDate.toISOString().slice(0, 7);

    void getPayrollData(employeeId, prevPeriod);

    return {
      user,
      payrollData,
    };
  },

  // Batch load multiple resources efficiently
  batchLoad: async <T extends Record<string, () => Promise<any>>>(
    loaders: T
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> => {
    const entries = Object.entries(loaders);
    const results = await Promise.allSettled(
      entries.map(([_, loader]) => loader())
    );

    const data = {} as any;
    entries.forEach(([key], index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        data[key] = result.value;
      } else {
        console.error(`Failed to load ${key}:`, result.reason);
        data[key] = null;
      }
    });

    return data;
  },
};

// Streaming data loader for progressive enhancement
export const streamingLoaders = {
  // Stream dashboard data in chunks
  streamDashboard: async function* (userId: string, locationIds: string[]) {
    // First chunk - critical data
    yield {
      type: "critical",
      data: await getUser(userId),
    };

    // Second chunk - dashboard metrics
    yield {
      type: "metrics",
      data: await getDashboardData(userId, locationIds),
    };

    // Third chunk - locations
    yield {
      type: "locations",
      data: await getLocations({ limit: 10 }),
    };

    // Final chunk - additional data
    const additionalData = await Promise.allSettled([
      getPayrollData(userId, new Date().toISOString().slice(0, 7)),
      getLocations({ active: false, limit: 5 }), // Inactive locations
    ]);

    yield {
      type: "additional",
      data: {
        payroll:
          additionalData[0].status === "fulfilled"
            ? additionalData[0].value
            : null,
        inactiveLocations:
          additionalData[1].status === "fulfilled"
            ? additionalData[1].value
            : null,
      },
    };
  },

  // Stream location details progressively
  streamLocationDetails: async function* (locationId: string) {
    // Basic info first
    yield {
      type: "basic",
      data: await getLocation(locationId),
    };

    // Related data
    const location = await getLocation(locationId);
    const relatedData = await Promise.allSettled([
      getLocations({ state: location.state, limit: 5 }),
      // Add more related data fetching here
    ]);

    yield {
      type: "related",
      data: {
        relatedLocations:
          relatedData[0].status === "fulfilled" ? relatedData[0].value : null,
      },
    };
  },
};

// Performance monitoring for data loading
export const loadingMetrics = {
  measureLoadTime: async <T>(
    name: string,
    loader: () => Promise<T>
  ): Promise<{ data: T; duration: number }> => {
    const start = performance.now();

    try {
      const data = await loader();
      const duration = performance.now() - start;

      // Log performance metrics (in production, send to analytics)
      console.log(`Data loading metric - ${name}: ${duration.toFixed(2)}ms`);

      return { data, duration };
    } catch (error) {
      const duration = performance.now() - start;
      console.error(
        `Data loading failed - ${name}: ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  },

  // Batch measure multiple loaders
  measureBatch: async <T extends Record<string, () => Promise<any>>>(
    loaders: T
  ): Promise<{
    data: { [K in keyof T]: Awaited<ReturnType<T[K]>> };
    metrics: Record<string, number>;
  }> => {
    const start = performance.now();
    const metrics: Record<string, number> = {};

    const results = await Promise.allSettled(
      Object.entries(loaders).map(async ([key, loader]) => {
        const loaderStart = performance.now();
        try {
          const result = await loader();
          metrics[key] = performance.now() - loaderStart;
          return { key, result, success: true };
        } catch (error) {
          metrics[key] = performance.now() - loaderStart;
          return { key, error, success: false };
        }
      })
    );

    const data = {} as any;
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { key, result: loaderResult, success } = result.value;
        if (success) {
          data[key] = loaderResult;
        } else {
          data[key] = null;
        }
      }
    });

    const totalDuration = performance.now() - start;
    console.log(
      `Batch loading completed in ${totalDuration.toFixed(2)}ms`,
      metrics
    );

    return { data, metrics };
  },
};
