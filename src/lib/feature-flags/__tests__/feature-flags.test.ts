// Feature flag system tests

import { FeatureFlagManager } from "../core";
import { FeatureFlagAdmin } from "../admin";
import { FEATURE_FLAGS } from "../config";

describe("FeatureFlagManager", () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    manager = new FeatureFlagManager({
      flags: {
        TEST_FLAG: {
          key: "TEST_FLAG",
          name: "Test Flag",
          description: "A test flag",
          enabled: true,
          rolloutPercentage: 50,
          environment: "all",
        },
        ROLE_FLAG: {
          key: "ROLE_FLAG",
          name: "Role Flag",
          description: "A role-based flag",
          enabled: true,
          rolloutPercentage: 100,
          targetRoles: ["admin"],
          environment: "all",
        },
        USER_FLAG: {
          key: "USER_FLAG",
          name: "User Flag",
          description: "A user-specific flag",
          enabled: true,
          rolloutPercentage: 100,
          targetUsers: ["user-123"],
          environment: "all",
        },
        DISABLED_FLAG: {
          key: "DISABLED_FLAG",
          name: "Disabled Flag",
          description: "A disabled flag",
          enabled: false,
          rolloutPercentage: 100,
          environment: "all",
        },
      },
      userId: "user-123",
      userRole: "admin",
      environment: "test",
    });
  });

  describe("isEnabled", () => {
    it("should return false for non-existent flags", () => {
      expect(manager.isEnabled("NON_EXISTENT")).toBe(false);
    });

    it("should return false for disabled flags", () => {
      expect(manager.isEnabled("DISABLED_FLAG")).toBe(false);
    });

    it("should respect role-based targeting", () => {
      expect(manager.isEnabled("ROLE_FLAG")).toBe(true);

      manager.setUserContext("user-456", "employee");
      expect(manager.isEnabled("ROLE_FLAG")).toBe(false);
    });

    it("should respect user-based targeting", () => {
      expect(manager.isEnabled("USER_FLAG")).toBe(true);

      manager.setUserContext("user-456", "admin");
      expect(manager.isEnabled("USER_FLAG")).toBe(false);
    });

    it("should handle rollout percentage consistently", () => {
      // Test with a user that should be in the 50% rollout
      manager.setUserContext("user-consistent", "admin");
      const result1 = manager.isEnabled("TEST_FLAG");
      const result2 = manager.isEnabled("TEST_FLAG");

      // Should be consistent across calls
      expect(result1).toBe(result2);
    });
  });

  describe("updateFlag", () => {
    it("should update flag properties", () => {
      manager.updateFlag("TEST_FLAG", { rolloutPercentage: 75 });
      const flag = manager.getFlag("TEST_FLAG");
      expect(flag?.rolloutPercentage).toBe(75);
    });

    it("should clear cache when flag is updated", () => {
      // Get initial result (should be cached)
      const result1 = manager.isEnabled("TEST_FLAG");

      // Update flag
      manager.updateFlag("TEST_FLAG", { enabled: false });

      // Should reflect the change
      const result2 = manager.isEnabled("TEST_FLAG");
      expect(result2).toBe(false);
    });
  });

  describe("setUserContext", () => {
    it("should update user context and clear cache", () => {
      // Initial state
      expect(manager.isEnabled("ROLE_FLAG")).toBe(true);

      // Change user role
      manager.setUserContext("user-456", "employee");
      expect(manager.isEnabled("ROLE_FLAG")).toBe(false);
    });
  });

  describe("getAnalytics", () => {
    it("should track flag usage", () => {
      manager.isEnabled("TEST_FLAG");
      manager.isEnabled("ROLE_FLAG");

      const analytics = manager.getAnalytics();
      expect(analytics.length).toBeGreaterThan(0);
      expect(analytics[0]).toHaveProperty("flagKey");
      expect(analytics[0]).toHaveProperty("userId");
      expect(analytics[0]).toHaveProperty("enabled");
    });
  });
});

describe("FeatureFlagAdmin", () => {
  let manager: FeatureFlagManager;
  let admin: FeatureFlagAdmin;

  beforeEach(() => {
    manager = new FeatureFlagManager({
      flags: {
        ADMIN_TEST_FLAG: {
          key: "ADMIN_TEST_FLAG",
          name: "Admin Test Flag",
          description: "A flag for admin testing",
          enabled: true,
          rolloutPercentage: 25,
          environment: "all",
        },
      },
      userId: "admin-123",
      userRole: "admin",
      environment: "test",
    });

    admin = new FeatureFlagAdmin({
      manager,
      allowedRoles: ["admin", "super_admin"],
    });
  });

  describe("hasAdminAccess", () => {
    it("should allow access for admin roles", () => {
      expect(admin.hasAdminAccess("admin")).toBe(true);
      expect(admin.hasAdminAccess("super_admin")).toBe(true);
    });

    it("should deny access for non-admin roles", () => {
      expect(admin.hasAdminAccess("employee")).toBe(false);
      expect(admin.hasAdminAccess("manager")).toBe(false);
    });
  });

  describe("updateFlag", () => {
    it("should update flag successfully", async () => {
      const result = await admin.updateFlag(
        "ADMIN_TEST_FLAG",
        { rolloutPercentage: 50 },
        "admin-123"
      );

      expect(result.success).toBe(true);

      const flag = manager.getFlag("ADMIN_TEST_FLAG");
      expect(flag?.rolloutPercentage).toBe(50);
    });

    it("should validate rollout percentage", async () => {
      const result = await admin.updateFlag(
        "ADMIN_TEST_FLAG",
        { rolloutPercentage: 150 },
        "admin-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("between 0 and 100");
    });
  });

  describe("emergencyDisable", () => {
    it("should disable flag immediately", async () => {
      const result = await admin.emergencyDisable(
        "ADMIN_TEST_FLAG",
        "Critical bug found",
        "admin-123"
      );

      expect(result.success).toBe(true);

      const flag = manager.getFlag("ADMIN_TEST_FLAG");
      expect(flag?.enabled).toBe(false);
      expect(flag?.rolloutPercentage).toBe(0);
    });
  });

  describe("getRolloutStats", () => {
    it("should calculate rollout statistics", () => {
      // Generate some analytics data
      manager.isEnabled("ADMIN_TEST_FLAG");

      const stats = admin.getRolloutStats("ADMIN_TEST_FLAG");

      expect(stats).toHaveProperty("totalUsers");
      expect(stats).toHaveProperty("enabledUsers");
      expect(stats).toHaveProperty("rolloutPercentage");
      expect(stats).toHaveProperty("actualPercentage");
    });
  });

  describe("exportConfig", () => {
    it("should export configuration as JSON", () => {
      const config = admin.exportConfig();
      const parsed = JSON.parse(config);

      expect(parsed).toHaveProperty("ADMIN_TEST_FLAG");
      expect(parsed.ADMIN_TEST_FLAG).toHaveProperty("name");
      expect(parsed.ADMIN_TEST_FLAG).toHaveProperty("enabled");
    });
  });

  describe("importConfig", () => {
    it("should import valid configuration", async () => {
      const config = {
        NEW_FLAG: {
          key: "NEW_FLAG",
          name: "New Flag",
          description: "Imported flag",
          enabled: true,
          rolloutPercentage: 10,
          environment: "all",
        },
      };

      const result = await admin.importConfig(
        JSON.stringify(config),
        "admin-123"
      );

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });

    it("should reject invalid configuration", async () => {
      const result = await admin.importConfig("invalid json", "admin-123");

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
    });
  });
});

describe("Feature Flag Configuration", () => {
  it("should have all required flags defined", () => {
    expect(FEATURE_FLAGS).toHaveProperty("NEW_FRONTEND");
    expect(FEATURE_FLAGS).toHaveProperty("NEW_NAVIGATION");
    expect(FEATURE_FLAGS).toHaveProperty("NEW_DASHBOARD");
    expect(FEATURE_FLAGS).toHaveProperty("NEW_PAYROLL_INTERFACE");
    expect(FEATURE_FLAGS).toHaveProperty("MOBILE_OPTIMIZATIONS");
    expect(FEATURE_FLAGS).toHaveProperty("PERFORMANCE_FEATURES");
    expect(FEATURE_FLAGS).toHaveProperty("BETA_FEATURES");
  });

  it("should have valid flag configurations", () => {
    Object.values(FEATURE_FLAGS).forEach((flag) => {
      expect(flag).toHaveProperty("key");
      expect(flag).toHaveProperty("name");
      expect(flag).toHaveProperty("description");
      expect(flag).toHaveProperty("enabled");
      expect(flag).toHaveProperty("rolloutPercentage");
      expect(typeof flag.enabled).toBe("boolean");
      expect(typeof flag.rolloutPercentage).toBe("number");
      expect(flag.rolloutPercentage).toBeGreaterThanOrEqual(0);
      expect(flag.rolloutPercentage).toBeLessThanOrEqual(100);
    });
  });
});
