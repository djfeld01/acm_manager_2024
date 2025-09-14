import { describe, it, expect, jest } from "@jest/globals";
import { Role } from "@/db/schema/user";

// Mock the auth module
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Mock Next.js redirect
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock permissions
jest.mock("@/lib/permissions", () => ({
  canAccessRoute: jest.fn(),
  createAccessControl: jest.fn(),
}));

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessRoute } from "@/lib/permissions";
import {
  getCurrentUser,
  requireAuth,
  requireRole,
  getUserWithFacilities,
  canAccessFacility,
  requireRouteAccess,
} from "@/lib/auth/utils";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockCanAccessRoute = canAccessRoute as jest.MockedFunction<
  typeof canAccessRoute
>;

describe("Auth Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should return user when session exists", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.MANAGER,
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it("should return null when no session exists", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("should return user when authenticated", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.MANAGER,
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await requireAuth();
      expect(result).toEqual(mockUser);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should redirect when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      await requireAuth();
      expect(mockRedirect).toHaveBeenCalledWith("/auth/signin");
    });
  });

  describe("requireRole", () => {
    it("should return user when role matches", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.ADMIN,
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await requireRole(Role.ADMIN);
      expect(result).toEqual(mockUser);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should return user when role is in allowed array", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.MANAGER,
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await requireRole([Role.MANAGER, Role.ADMIN]);
      expect(result).toEqual(mockUser);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should redirect when role does not match", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.USER,
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      await requireRole(Role.ADMIN);
      expect(mockRedirect).toHaveBeenCalledWith("/unauthorized");
    });
  });

  describe("getUserWithFacilities", () => {
    it("should return user with facilities", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.MANAGER,
        facilities: [
          {
            sitelinkId: "FAC001",
            facilityName: "Test Facility",
            facilityAbbreviation: "TF",
          },
        ],
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await getUserWithFacilities();
      expect(result.facilities).toHaveLength(1);
      expect(result.facilities[0].id).toBe("FAC001");
    });

    it("should redirect when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      await getUserWithFacilities();
      expect(mockRedirect).toHaveBeenCalledWith("/auth/signin");
    });
  });

  describe("canAccessFacility", () => {
    it("should allow admin to access any facility", async () => {
      const mockUser = {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        role: Role.ADMIN,
        facilities: [],
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await canAccessFacility("FAC001");
      expect(result).toBe(true);
    });

    it("should allow manager to access their facility", async () => {
      const mockUser = {
        id: "1",
        name: "Manager User",
        email: "manager@example.com",
        role: Role.MANAGER,
        facilities: [
          {
            sitelinkId: "FAC001",
            facilityName: "Test Facility",
            facilityAbbreviation: "TF",
          },
        ],
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await canAccessFacility("FAC001");
      expect(result).toBe(true);
    });

    it("should deny manager access to other facilities", async () => {
      const mockUser = {
        id: "1",
        name: "Manager User",
        email: "manager@example.com",
        role: Role.MANAGER,
        facilities: [
          {
            sitelinkId: "FAC001",
            facilityName: "Test Facility",
            facilityAbbreviation: "TF",
          },
        ],
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      const result = await canAccessFacility("FAC002");
      expect(result).toBe(false);
    });
  });

  describe("requireRouteAccess", () => {
    it("should allow access when user has permission", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.ADMIN,
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      mockCanAccessRoute.mockReturnValue(true);

      const result = await requireRouteAccess("/admin");
      expect(result).toEqual(mockUser);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("should redirect when user lacks permission", async () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.USER,
      };

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: "2024-12-31",
      });

      mockCanAccessRoute.mockReturnValue(false);

      await requireRouteAccess("/admin");
      expect(mockRedirect).toHaveBeenCalledWith("/unauthorized");
    });
  });
});
