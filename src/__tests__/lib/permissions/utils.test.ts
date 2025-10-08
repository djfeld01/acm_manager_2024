import { describe, it, expect } from "@jest/globals";
import { Role } from "@/db/schema/user";
import {
  hasPermission,
  canAccessRoute,
  getUserPermissions,
  hasRole,
  filterByRole,
} from "@/lib/permissions/utils";

describe("Permission Utils", () => {
  describe("hasPermission", () => {
    it("should allow ADMIN to read payroll", () => {
      const result = hasPermission(Role.ADMIN, "payroll", "read");
      expect(result).toBe(true);
    });

    it("should not allow USER to read payroll", () => {
      const result = hasPermission(Role.USER, "payroll", "read");
      expect(result).toBe(false);
    });

    it("should allow MANAGER to read their own profile", () => {
      const result = hasPermission(Role.MANAGER, "profile", "read");
      expect(result).toBe(true);
    });

    it("should allow OWNER to perform admin actions", () => {
      const result = hasPermission(Role.OWNER, "admin", "admin");
      expect(result).toBe(true);
    });
  });

  describe("canAccessRoute", () => {
    it("should allow ADMIN to access admin routes", () => {
      const result = canAccessRoute(Role.ADMIN, "/admin");
      expect(result).toBe(true);
    });

    it("should not allow MANAGER to access admin routes", () => {
      const result = canAccessRoute(Role.MANAGER, "/admin");
      expect(result).toBe(false);
    });

    it("should allow MANAGER to access dashboard", () => {
      const result = canAccessRoute(Role.MANAGER, "/dashboard");
      expect(result).toBe(true);
    });

    it("should handle nested routes correctly", () => {
      const result = canAccessRoute(Role.MANAGER, "/payroll/123");
      expect(result).toBe(true);
    });

    it("should handle query parameters", () => {
      const result = canAccessRoute(Role.SUPERVISOR, "/reports?filter=monthly");
      expect(result).toBe(true);
    });
  });

  describe("hasRole", () => {
    it("should return true for matching single role", () => {
      const result = hasRole(Role.ADMIN, Role.ADMIN);
      expect(result).toBe(true);
    });

    it("should return false for non-matching single role", () => {
      const result = hasRole(Role.USER, Role.ADMIN);
      expect(result).toBe(false);
    });

    it("should return true for matching role in array", () => {
      const result = hasRole(Role.MANAGER, [Role.MANAGER, Role.ADMIN]);
      expect(result).toBe(true);
    });

    it("should return false for non-matching role in array", () => {
      const result = hasRole(Role.USER, [Role.MANAGER, Role.ADMIN]);
      expect(result).toBe(false);
    });
  });

  describe("filterByRole", () => {
    const testItems = [
      { id: "1", name: "Admin Only", roles: [Role.ADMIN] },
      { id: "2", name: "Manager and Admin", roles: [Role.MANAGER, Role.ADMIN] },
      {
        id: "3",
        name: "All Roles",
        roles: [Role.USER, Role.MANAGER, Role.ADMIN],
      },
    ];

    it("should filter items for ADMIN role", () => {
      const result = filterByRole(testItems, Role.ADMIN);
      expect(result).toHaveLength(3);
    });

    it("should filter items for MANAGER role", () => {
      const result = filterByRole(testItems, Role.MANAGER);
      expect(result).toHaveLength(2);
      expect(result.map((item) => item.id)).toEqual(["2", "3"]);
    });

    it("should filter items for USER role", () => {
      const result = filterByRole(testItems, Role.USER);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });
  });

  describe("getUserPermissions", () => {
    it("should return permissions for ADMIN role", () => {
      const permissions = getUserPermissions(Role.ADMIN);
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions.some((p) => p.resource === "admin")).toBe(true);
    });

    it("should return permissions for MANAGER role", () => {
      const permissions = getUserPermissions(Role.MANAGER);
      expect(permissions.length).toBeGreaterThan(0);
      expect(
        permissions.some((p) => p.resource === "payroll" && p.scope === "own")
      ).toBe(true);
    });

    it("should return empty array for invalid role", () => {
      const permissions = getUserPermissions("INVALID_ROLE" as Role);
      expect(permissions).toEqual([]);
    });
  });
});
