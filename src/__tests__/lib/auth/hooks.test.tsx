import { describe, it, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { Role } from "@/db/schema/user";
import {
  useCurrentUser,
  useHasRole,
  useCanAccessRoute,
  useCanAccessFacility,
} from "@/lib/auth/hooks";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock permissions
jest.mock("@/lib/permissions", () => ({
  hasRole: jest.fn(),
  canAccessRoute: jest.fn(),
  createAccessControl: jest.fn(),
}));

import { hasRole, canAccessRoute } from "@/lib/permissions";

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockHasRole = hasRole as jest.MockedFunction<typeof hasRole>;
const mockCanAccessRoute = canAccessRoute as jest.MockedFunction<
  typeof canAccessRoute
>;

describe("Auth Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useCurrentUser", () => {
    it("should return user when session exists", () => {
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

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.user).toBeDefined();
      expect(result.current.user?.id).toBe("1");
      expect(result.current.user?.facilities).toHaveLength(1);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("should return null when no session exists", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("should return loading state", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCurrentUser());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("useHasRole", () => {
    it("should return true when user has required role", () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.ADMIN,
        facilities: [],
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      mockHasRole.mockReturnValue(true);

      const { result } = renderHook(() => useHasRole(Role.ADMIN));

      expect(result.current).toBe(true);
      expect(mockHasRole).toHaveBeenCalledWith(Role.ADMIN, Role.ADMIN);
    });

    it("should return false when user lacks required role", () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.USER,
        facilities: [],
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      mockHasRole.mockReturnValue(false);

      const { result } = renderHook(() => useHasRole(Role.ADMIN));

      expect(result.current).toBe(false);
    });

    it("should return false when no user", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useHasRole(Role.ADMIN));

      expect(result.current).toBe(false);
    });
  });

  describe("useCanAccessRoute", () => {
    it("should return true when user can access route", () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.ADMIN,
        facilities: [],
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      mockCanAccessRoute.mockReturnValue(true);

      const { result } = renderHook(() => useCanAccessRoute("/admin"));

      expect(result.current).toBe(true);
      expect(mockCanAccessRoute).toHaveBeenCalledWith(Role.ADMIN, "/admin");
    });

    it("should return false when user cannot access route", () => {
      const mockUser = {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: Role.USER,
        facilities: [],
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      mockCanAccessRoute.mockReturnValue(false);

      const { result } = renderHook(() => useCanAccessRoute("/admin"));

      expect(result.current).toBe(false);
    });
  });

  describe("useCanAccessFacility", () => {
    it("should return true for admin accessing any facility", () => {
      const mockUser = {
        id: "1",
        name: "Admin User",
        email: "admin@example.com",
        role: Role.ADMIN,
        facilities: [],
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCanAccessFacility("FAC001"));

      expect(result.current).toBe(true);
    });

    it("should return true for manager accessing their facility", () => {
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

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCanAccessFacility("FAC001"));

      expect(result.current).toBe(true);
    });

    it("should return false for manager accessing other facility", () => {
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

      mockUseSession.mockReturnValue({
        data: { user: mockUser, expires: "2024-12-31" },
        status: "authenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCanAccessFacility("FAC002"));

      expect(result.current).toBe(false);
    });

    it("should return false when no user", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCanAccessFacility("FAC001"));

      expect(result.current).toBe(false);
    });
  });
});
