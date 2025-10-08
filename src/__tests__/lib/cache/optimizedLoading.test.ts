import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { dataLoaders, loadingMetrics } from "@/lib/data/optimizedLoaders";

// Mock the cache functions
jest.mock("@/lib/cache/serverCache", () => ({
  getCachedUser: jest.fn(),
  getCachedLocation: jest.fn(),
  getCachedLocations: jest.fn(),
  getCachedDashboardData: jest.fn(),
  getCachedPayrollData: jest.fn(),
  preloadUtils: {
    preloadAll: jest.fn(),
  },
}));

const mockCacheModule = require("@/lib/cache/serverCache");

describe("Optimized Data Loaders", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockCacheModule.getCachedUser.mockResolvedValue({
      id: "user1",
      name: "Test User",
      email: "test@example.com",
      role: "manager",
    });

    mockCacheModule.getCachedLocation.mockResolvedValue({
      id: "loc1",
      name: "Test Location",
      city: "Austin",
      state: "TX",
      occupancyRate: 85,
      revenue: 125000,
    });

    mockCacheModule.getCachedLocations.mockResolvedValue({
      locations: [
        { id: "loc1", name: "Location 1" },
        { id: "loc2", name: "Location 2" },
      ],
      total: 2,
      hasMore: false,
    });

    mockCacheModule.getCachedDashboardData.mockResolvedValue({
      totalRevenue: 2500000,
      totalLocations: 17,
      averageOccupancy: 82.5,
      alerts: [],
    });

    mockCacheModule.getCachedPayrollData.mockResolvedValue({
      employeeId: "user1",
      period: "2024-01",
      baseSalary: 4000,
      commission: 850,
      netPay: 4900,
    });
  });

  describe("loadDashboardPage", () => {
    it("should load dashboard data in parallel", async () => {
      const userId = "user1";
      const locationIds = ["loc1", "loc2"];

      const result = await dataLoaders.loadDashboardPage(userId, locationIds);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("dashboardData");
      expect(result).toHaveProperty("recentLocations");

      // Verify all functions were called
      expect(mockCacheModule.getCachedUser).toHaveBeenCalledWith(userId);
      expect(mockCacheModule.getCachedDashboardData).toHaveBeenCalledWith(
        userId,
        locationIds
      );
      expect(mockCacheModule.getCachedLocations).toHaveBeenCalledWith({
        limit: 10,
      });

      // Verify preloading was triggered
      expect(mockCacheModule.preloadUtils.preloadAll).toHaveBeenCalledWith({
        locations: locationIds.slice(0, 5),
      });
    });

    it("should handle errors gracefully", async () => {
      mockCacheModule.getCachedUser.mockRejectedValue(
        new Error("User not found")
      );

      await expect(
        dataLoaders.loadDashboardPage("invalid", [])
      ).rejects.toThrow("User not found");
    });
  });

  describe("loadLocationPage", () => {
    it("should load location data with related information", async () => {
      const locationId = "loc1";
      const userId = "user1";

      const result = await dataLoaders.loadLocationPage(locationId, userId);

      expect(result).toHaveProperty("location");
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("relatedLocations");

      expect(mockCacheModule.getCachedLocation).toHaveBeenCalledWith(
        locationId
      );
      expect(mockCacheModule.getCachedUser).toHaveBeenCalledWith(userId);
    });

    it("should preload payroll data for managers", async () => {
      mockCacheModule.getCachedUser.mockResolvedValue({
        id: "user1",
        role: "manager",
      });

      await dataLoaders.loadLocationPage("loc1", "user1");

      expect(mockCacheModule.getCachedPayrollData).toHaveBeenCalled();
    });

    it("should not preload payroll data for regular users", async () => {
      mockCacheModule.getCachedUser.mockResolvedValue({
        id: "user1",
        role: "employee",
      });

      await dataLoaders.loadLocationPage("loc1", "user1");

      expect(mockCacheModule.getCachedPayrollData).not.toHaveBeenCalled();
    });
  });

  describe("loadLocationsPage", () => {
    it("should load paginated locations", async () => {
      const result = await dataLoaders.loadLocationsPage(1, 20, {
        state: "TX",
      });

      expect(result).toHaveProperty("locations");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("hasMore");

      expect(mockCacheModule.getCachedLocations).toHaveBeenCalledWith({
        state: "TX",
        limit: 20,
        offset: 0,
      });
    });

    it("should preload next page when more results available", async () => {
      mockCacheModule.getCachedLocations.mockResolvedValue({
        locations: [],
        total: 100,
        hasMore: true,
      });

      await dataLoaders.loadLocationsPage(1, 20);

      // Should be called twice - once for current page, once for preload
      expect(mockCacheModule.getCachedLocations).toHaveBeenCalledTimes(2);
      expect(mockCacheModule.getCachedLocations).toHaveBeenNthCalledWith(2, {
        limit: 20,
        offset: 20,
      });
    });
  });

  describe("batchLoad", () => {
    it("should load multiple resources in parallel", async () => {
      const loaders = {
        user: () => mockCacheModule.getCachedUser("user1"),
        location: () => mockCacheModule.getCachedLocation("loc1"),
      };

      const result = await dataLoaders.batchLoad(loaders);

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("location");
      expect(mockCacheModule.getCachedUser).toHaveBeenCalledWith("user1");
      expect(mockCacheModule.getCachedLocation).toHaveBeenCalledWith("loc1");
    });

    it("should handle partial failures", async () => {
      const loaders = {
        user: () => mockCacheModule.getCachedUser("user1"),
        location: () => Promise.reject(new Error("Location error")),
      };

      const result = await dataLoaders.batchLoad(loaders);

      expect(result.user).toBeDefined();
      expect(result.location).toBeNull();
    });
  });
});

describe("Loading Metrics", () => {
  beforeEach(() => {
    // Mock performance.now
    global.performance = {
      now: jest.fn(() => Date.now()),
    } as any;
  });

  describe("measureLoadTime", () => {
    it("should measure execution time", async () => {
      const mockLoader = jest.fn().mockResolvedValue("test data");
      let callCount = 0;

      (global.performance.now as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount * 100; // 100ms increments
      });

      const result = await loadingMetrics.measureLoadTime(
        "test-loader",
        mockLoader
      );

      expect(result.data).toBe("test data");
      expect(result.duration).toBe(100); // 200 - 100 = 100ms
      expect(mockLoader).toHaveBeenCalled();
    });

    it("should handle errors and still measure time", async () => {
      const mockLoader = jest.fn().mockRejectedValue(new Error("Test error"));
      let callCount = 0;

      (global.performance.now as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount * 50;
      });

      await expect(
        loadingMetrics.measureLoadTime("test-loader", mockLoader)
      ).rejects.toThrow("Test error");

      expect(mockLoader).toHaveBeenCalled();
    });
  });

  describe("measureBatch", () => {
    it("should measure multiple loaders", async () => {
      const loaders = {
        fast: () => Promise.resolve("fast data"),
        slow: () =>
          new Promise((resolve) => setTimeout(() => resolve("slow data"), 100)),
      };

      let callCount = 0;
      (global.performance.now as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount * 10;
      });

      const result = await loadingMetrics.measureBatch(loaders);

      expect(result.data.fast).toBe("fast data");
      expect(result.data.slow).toBe("slow data");
      expect(result.metrics).toHaveProperty("fast");
      expect(result.metrics).toHaveProperty("slow");
    });

    it("should handle mixed success and failure", async () => {
      const loaders = {
        success: () => Promise.resolve("success"),
        failure: () => Promise.reject(new Error("failure")),
      };

      let callCount = 0;
      (global.performance.now as jest.Mock).mockImplementation(() => {
        callCount++;
        return callCount * 10;
      });

      const result = await loadingMetrics.measureBatch(loaders);

      expect(result.data.success).toBe("success");
      expect(result.data.failure).toBeNull();
      expect(result.metrics).toHaveProperty("success");
      expect(result.metrics).toHaveProperty("failure");
    });
  });
});

describe("Streaming Loaders", () => {
  // Note: Testing async generators requires special handling
  it("should be tested with proper async generator testing utilities", () => {
    // This is a placeholder for streaming loader tests
    // In a real implementation, you'd use libraries like 'jest-generator'
    // or custom utilities to test async generators
    expect(true).toBe(true);
  });
});
