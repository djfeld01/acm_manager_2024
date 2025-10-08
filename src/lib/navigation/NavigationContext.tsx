"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/auth/hooks";
import {
  NavigationState,
  BreadcrumbItem,
  getNavigationState,
  saveNavigationState,
  generateBreadcrumbs,
  getNavigationItems,
  getPrimaryNavigationItems,
  getSecondaryNavigationItems,
} from "./utils";
import { NavigationItem } from "@/lib/types";

interface NavigationContextType {
  // State
  navigationState: NavigationState;
  breadcrumbs: BreadcrumbItem[];
  navigationItems: NavigationItem[];
  primaryNavItems: NavigationItem[];
  secondaryNavItems: NavigationItem[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  updateLastVisitedPath: (path: string) => void;

  // Utilities
  isActiveRoute: (href: string) => boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [navigationState, setNavigationState] = useState<NavigationState>(() =>
    getNavigationState()
  );

  // Update navigation state when pathname changes
  useEffect(() => {
    if (pathname) {
      updateLastVisitedPath(pathname);
    }
  }, [pathname]);

  // Generate navigation items based on user role
  const navigationItems = user ? getNavigationItems(user.role) : [];
  const primaryNavItems = user ? getPrimaryNavigationItems(user.role, 4) : [];
  const secondaryNavItems = user
    ? getSecondaryNavigationItems(user.role, 4)
    : [];

  // Generate breadcrumbs
  const breadcrumbs = user ? generateBreadcrumbs(pathname, user.role) : [];

  // Actions
  const toggleSidebar = useCallback(() => {
    setNavigationState((prev) => {
      const newState = {
        ...prev,
        isCollapsed: !prev.isCollapsed,
        preferences: {
          ...prev.preferences,
          sidebarCollapsed: !prev.isCollapsed,
        },
      };
      saveNavigationState(newState);
      return newState;
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setNavigationState((prev) => {
      const newState = {
        ...prev,
        isCollapsed: collapsed,
        preferences: {
          ...prev.preferences,
          sidebarCollapsed: collapsed,
        },
      };
      saveNavigationState(newState);
      return newState;
    });
  }, []);

  const setMobileMenuOpen = useCallback((open: boolean) => {
    setNavigationState((prev) => {
      const newState = {
        ...prev,
        preferences: {
          ...prev.preferences,
          mobileMenuOpen: open,
        },
      };
      saveNavigationState(newState);
      return newState;
    });
  }, []);

  const updateLastVisitedPath = useCallback((path: string) => {
    setNavigationState((prev) => {
      const newState = {
        ...prev,
        lastVisitedPath: path,
      };
      saveNavigationState(newState);
      return newState;
    });
  }, []);

  const isActiveRoute = useCallback(
    (href: string) => {
      // Handle dashboard special case
      if (href === "/dashboard") {
        return pathname === "/" || pathname === "/dashboard";
      }

      // Handle exact matches
      if (pathname === href) {
        return true;
      }

      // Handle nested routes
      return pathname.startsWith(href + "/");
    },
    [pathname]
  );

  const contextValue: NavigationContextType = {
    navigationState,
    breadcrumbs,
    navigationItems,
    primaryNavItems,
    secondaryNavItems,
    toggleSidebar,
    setSidebarCollapsed,
    setMobileMenuOpen,
    updateLastVisitedPath,
    isActiveRoute,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}
