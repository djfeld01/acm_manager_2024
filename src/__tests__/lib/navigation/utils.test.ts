import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { Role } from "@/db/schema/user";
import {
  getNavigationItems,
  getPrimaryNavigationItems,
  getSecondaryNavigationItems,
  findNavigationItem,
  isActiveRoute,
  generateBreadcrumbs,
  getNavigationState,
  saveNavigationState,
  clearNavigationState,
} from "@/lib/navigation/utils";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Navigation Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearNavigationState();
  });

  describe("getNavigationItems", () => {
    it("should return filtered navigation items for MANAGER role", () => {
      const items = getNavigationItems(Role.MANAGER);

      expect(items.length).toBeGreaterThan(0);
      expect(items.some((item) => item.id === "dashboard")).toBe(true);
      expect(items.some((item) => item.id === "payroll")).toBe(true);
      expect(items.some((item) => item.id === "locations")).toBe(true);
      expect(items.some((item) => item.id === "admin")).toBe(false); // Manager shouldn't see admin
    });

    it("should return more items for ADMIN role", () => {
      const managerItems = getNavigationItems(Role.MANAGER);
      const adminItems = getNavigationItems(Role.ADMIN);

      expect(adminItems.length).toBeGreaterThanOrEqual(managerItems.length);
      expect(adminItems.some((item) => item.id === "admin")).toBe(true);
    });
  });

  describe("getPrimaryNavigationItems", () => {
    it("should limit items to specified maximum", () => {
      const items = getPrimaryNavigationItems(Role.ADMIN, 3);

      expect(items.length).toBeLessThanOrEqual(3);
    });

    it("should return first items in order", () => {
      const allItems = getNavigationItems(Role.ADMIN);
      const primaryItems = getPrimaryNavigationItems(Role.ADMIN, 2);

      expect(primaryItems[0]).toEqual(allItems[0]);
      expect(primaryItems[1]).toEqual(allItems[1]);
    });
  });

  describe("getSecondaryNavigationItems", () => {
    it("should return items after the skip count", () => {
      const allItems = getNavigationItems(Role.ADMIN);
      const secondaryItems = getSecondaryNavigationItems(Role.ADMIN, 2);

      expect(secondaryItems).toEqual(allItems.slice(2));
    });
  });

  describe("findNavigationItem", () => {
    it("should find item by exact href match", () => {
      const item = findNavigationItem("/dashboard", Role.MANAGER);

      expect(item).toBeTruthy();
      expect(item?.href).toBe("/dashboard");
    });

    it("should find parent item for nested route", () => {
      const item = findNavigationItem("/payroll/123", Role.MANAGER);

      expect(item).toBeTruthy();
      expect(item?.href).toBe("/payroll");
    });

    it("should return null for non-existent route", () => {
      const item = findNavigationItem("/non-existent", Role.MANAGER);

      expect(item).toBeNull();
    });
  });

  describe("isActiveRoute", () => {
    it("should return true for exact match", () => {
      expect(isActiveRoute("/payroll", "/payroll")).toBe(true);
    });

    it("should return true for nested route", () => {
      expect(isActiveRoute("/payroll/123", "/payroll")).toBe(true);
    });

    it("should handle dashboard special case", () => {
      expect(isActiveRoute("/", "/dashboard")).toBe(true);
      expect(isActiveRoute("/dashboard", "/dashboard")).toBe(true);
    });

    it("should return false for non-matching routes", () => {
      expect(isActiveRoute("/locations", "/payroll")).toBe(false);
    });
  });

  describe("generateBreadcrumbs", () => {
    it("should generate breadcrumbs for dashboard", () => {
      const breadcrumbs = generateBreadcrumbs("/dashboard", Role.MANAGER);

      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].label).toBe("Dashboard");
      expect(breadcrumbs[0].isActive).toBe(true);
    });

    it("should generate breadcrumbs for nested route", () => {
      const breadcrumbs = generateBreadcrumbs("/payroll", Role.MANAGER);

      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0].label).toBe("Dashboard");
      expect(breadcrumbs[0].isActive).toBe(false);
      expect(breadcrumbs[1].label).toBe("Payroll");
      expect(breadcrumbs[1].isActive).toBe(true);
    });

    it("should handle unknown routes gracefully", () => {
      const breadcrumbs = generateBreadcrumbs("/unknown-route", Role.MANAGER);

      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0].label).toBe("Dashboard");
      expect(breadcrumbs[1].label).toBe("Unknown-route");
    });
  });

  describe("Navigation State Management", () => {
    it("should return default state when localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const state = getNavigationState();

      expect(state.isCollapsed).toBe(false);
      expect(state.lastVisitedPath).toBe("/dashboard");
      expect(state.preferences.sidebarCollapsed).toBe(false);
    });

    it("should parse stored state from localStorage", () => {
      const storedState = {
        isCollapsed: true,
        lastVisitedPath: "/payroll",
        preferences: {
          sidebarCollapsed: true,
          mobileMenuOpen: false,
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedState));

      const state = getNavigationState();

      expect(state).toEqual(storedState);
    });

    it("should save state to localStorage", () => {
      const newState = {
        isCollapsed: true,
        lastVisitedPath: "/locations",
      };

      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          isCollapsed: false,
          lastVisitedPath: "/dashboard",
          preferences: {
            sidebarCollapsed: false,
            mobileMenuOpen: false,
          },
        })
      );

      saveNavigationState(newState);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "navigation-state",
        expect.stringContaining('"isCollapsed":true')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "navigation-state",
        expect.stringContaining('"/locations"')
      );
    });

    it("should clear navigation state", () => {
      clearNavigationState();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "navigation-state"
      );
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });

      const state = getNavigationState();

      expect(state.isCollapsed).toBe(false); // Should return default state
    });
  });
});
