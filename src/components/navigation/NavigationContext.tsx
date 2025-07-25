"use client";

import React, { createContext, useContext, useMemo } from "react";
import { Session } from "next-auth";
import { 
  LayoutDashboard, 
  Receipt, 
  MapPin, 
  BarChart3, 
  Users, 
  Settings,
  User,
  Building2
} from "lucide-react";

// Navigation item type
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  children?: NavItem[];
}

// User roles from your system
export type UserRole = "ADMIN" | "SUPERVISOR" | "MANAGER" | "ASSISTANT" | "USER";

interface NavigationContextType {
  navItems: NavItem[];
  userRole: UserRole | null;
  userName: string | null;
  userImage: string | null;
  facilities: any[] | null;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Role-based navigation configuration
const getNavigationForRole = (role: UserRole | null, facilities: any[] = []): NavItem[] => {
  const baseNavItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
  ];

  // Role-specific navigation
  switch (role) {
    case "ADMIN":
      return [
        ...baseNavItems,
        {
          id: "payroll",
          label: "Payroll",
          href: "/payroll",
          icon: Receipt,
          children: facilities.length > 0 ? facilities.map(facility => ({
            id: `payroll-${facility.sitelinkId}`,
            label: facility.facilityAbbreviation,
            href: `/payroll/${facility.sitelinkId}`,
            icon: Building2,
          })) : [],
        },
        {
          id: "locations",
          label: "Locations",
          href: "/locations",
          icon: MapPin,
          children: facilities.length > 0 ? facilities.map(facility => ({
            id: `location-${facility.sitelinkId}`,
            label: facility.facilityAbbreviation,
            href: `/location/${facility.sitelinkId}`,
            icon: Building2,
          })) : [],
        },
        {
          id: "reports",
          label: "Reports",
          href: "/reports",
          icon: BarChart3,
        },
        {
          id: "employees",
          label: "Employees",
          href: "/employees",
          icon: Users,
        },
        {
          id: "admin",
          label: "Admin",
          href: "/admin",
          icon: Settings,
        },
      ];

    case "SUPERVISOR":
      return [
        ...baseNavItems,
        {
          id: "team-payroll",
          label: "Team Payroll",
          href: "/payroll",
          icon: Receipt,
          children: facilities.length > 0 ? facilities.map(facility => ({
            id: `payroll-${facility.sitelinkId}`,
            label: facility.facilityAbbreviation,
            href: `/payroll/${facility.sitelinkId}`,
            icon: Building2,
          })) : [],
        },
        {
          id: "locations",
          label: "Locations",
          href: "/locations",
          icon: MapPin,
          children: facilities.length > 0 ? facilities.map(facility => ({
            id: `location-${facility.sitelinkId}`,
            label: facility.facilityAbbreviation,
            href: `/location/${facility.sitelinkId}`,
            icon: Building2,
          })) : [],
        },
        {
          id: "reports",
          label: "Reports",
          href: "/reports",
          icon: BarChart3,
        },
      ];

    case "MANAGER":
    case "ASSISTANT":
      return [
        ...baseNavItems,
        {
          id: "my-payroll",
          label: "My Payroll",
          href: "/my-payroll",
          icon: User,
        },
        {
          id: "my-location",
          label: "My Location",
          href: facilities.length > 0 ? `/location/${facilities[0]?.sitelinkId}` : "/locations",
          icon: MapPin,
        },
      ];

    default:
      return baseNavItems;
  }
};

export function NavigationProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode;
  session: Session | null;
}) {
  const navItems = useMemo(() => {
    const userRole = session?.user?.role as UserRole | null;
    const facilities = session?.user?.facilities || [];
    return getNavigationForRole(userRole, facilities);
  }, [session]);

  const contextValue: NavigationContextType = {
    navItems,
    userRole: session?.user?.role as UserRole | null,
    userName: session?.user?.name || null,
    userImage: session?.user?.image || null,
    facilities: session?.user?.facilities || null,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
