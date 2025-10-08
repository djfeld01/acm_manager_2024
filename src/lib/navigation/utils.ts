import { Role } from "@/db/schema/user";
import { NavigationItem } from "@/lib/types";
import { NAVIGATION_ITEMS, SECONDARY_NAVIGATION_ITEMS } from "./config";
import { filterByRole } from "@/lib/permissions";

/**
 * Get navigation items filtered by user role
 */
export function getNavigationItems(userRole: Role): NavigationItem[] {
  const allItems = [...NAVIGATION_ITEMS, ...SECONDARY_NAVIGATION_ITEMS];
  return filterByRole(allItems, userRole);
}

/**
 * Get primary navigation items (for mobile bottom tabs)
 */
export function getPrimaryNavigationItems(
  userRole: Role,
  maxItems: number = 4
): NavigationItem[] {
  const items = getNavigationItems(userRole);
  return items.slice(0, maxItems);
}

/**
 * Get secondary navigation items (for hamburger menu)
 */
export function getSecondaryNavigationItems(
  userRole: Role,
  skipItems: number = 4
): NavigationItem[] {
  const items = getNavigationItems(userRole);
  return items.slice(skipItems);
}

/**
 * Find navigation item by href
 */
export function findNavigationItem(
  href: string,
  userRole: Role
): NavigationItem | null {
  const items = getNavigationItems(userRole);

  // First try exact match
  let item = items.find((item) => item.href === href);
  if (item) return item;

  // Then try to find parent route
  const pathParts = href.split("/").filter(Boolean);
  for (let i = pathParts.length; i > 0; i--) {
    const parentPath = "/" + pathParts.slice(0, i).join("/");
    item = items.find((item) => item.href === parentPath);
    if (item) return item;
  }

  return null;
}

/**
 * Check if a route is active
 */
export function isActiveRoute(currentPath: string, itemHref: string): boolean {
  // Handle dashboard special case
  if (itemHref === "/dashboard") {
    return currentPath === "/" || currentPath === "/dashboard";
  }

  // Handle exact matches
  if (currentPath === itemHref) {
    return true;
  }

  // Handle nested routes
  return currentPath.startsWith(itemHref + "/");
}

/**
 * Generate breadcrumb items for current path
 */
export function generateBreadcrumbs(
  currentPath: string,
  userRole: Role
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with Dashboard
  breadcrumbs.push({
    label: "Dashboard",
    href: "/dashboard",
    isActive: currentPath === "/" || currentPath === "/dashboard",
  });

  // If we're not on dashboard, add the current section
  if (currentPath !== "/" && currentPath !== "/dashboard") {
    const currentItem = findNavigationItem(currentPath, userRole);

    if (currentItem) {
      breadcrumbs.push({
        label: currentItem.label,
        href: currentItem.href,
        isActive: true,
      });
    } else {
      // Handle dynamic routes or unknown paths
      const pathParts = currentPath.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const sectionName =
          pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
        breadcrumbs.push({
          label: sectionName,
          href: currentPath,
          isActive: true,
        });
      }
    }
  }

  return breadcrumbs;
}

/**
 * Get navigation state from localStorage
 */
export function getNavigationState(): NavigationState {
  if (typeof window === "undefined") {
    return {
      isCollapsed: false,
      lastVisitedPath: "/dashboard",
      preferences: {
        sidebarCollapsed: false,
        mobileMenuOpen: false,
      },
    };
  }

  try {
    const stored = localStorage.getItem("navigation-state");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to parse navigation state from localStorage:", error);
  }

  return {
    isCollapsed: false,
    lastVisitedPath: "/dashboard",
    preferences: {
      sidebarCollapsed: false,
      mobileMenuOpen: false,
    },
  };
}

/**
 * Save navigation state to localStorage
 */
export function saveNavigationState(state: Partial<NavigationState>): void {
  if (typeof window === "undefined") return;

  try {
    const currentState = getNavigationState();
    const newState = { ...currentState, ...state };
    localStorage.setItem("navigation-state", JSON.stringify(newState));
  } catch (error) {
    console.warn("Failed to save navigation state to localStorage:", error);
  }
}

/**
 * Clear navigation state
 */
export function clearNavigationState(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("navigation-state");
  } catch (error) {
    console.warn("Failed to clear navigation state:", error);
  }
}

// Types
export interface BreadcrumbItem {
  label: string;
  href: string;
  isActive: boolean;
}

export interface NavigationState {
  isCollapsed: boolean;
  lastVisitedPath: string;
  preferences: {
    sidebarCollapsed: boolean;
    mobileMenuOpen: boolean;
  };
}
