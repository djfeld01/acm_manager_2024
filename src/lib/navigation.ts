import {
  LayoutDashboard,
  Users,
  DollarSign,
  Building2,
  Activity,
  Target,
  Settings,
  CreditCard,
  BarChart3,
  UserCheck,
  Palette,
} from "lucide-react";

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: any;
  description?: string;
  badge?: string | number;
  roles: string[]; // Roles that can access this item
  requiresLocations?: boolean; // Whether this item requires facility access
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
  roles: string[];
}

/**
 * Define navigation structure based on user roles
 * Roles: USER, ASSISTANT, MANAGER, SUPERVISOR, ADMIN
 */
export const navigationConfig: NavigationSection[] = [
  {
    id: "main",
    label: "Main Navigation",
    roles: ["USER", "ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Overview and key metrics",
        roles: ["USER", "ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
      },
      {
        id: "deposits",
        label: "Deposits",
        href: "/deposits",
        icon: CreditCard,
        description: "Daily payment tracking",
        roles: ["ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
        requiresLocations: true,
      },
      {
        id: "payroll",
        label: "Payroll",
        href: "/payroll",
        icon: DollarSign,
        description: "Payroll management and tracking",
        roles: ["ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
        requiresLocations: true,
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    roles: ["MANAGER", "SUPERVISOR", "ADMIN"],
    items: [
      {
        id: "employees",
        label: "Employees",
        href: "/employees",
        icon: Users,
        description: "Staff management and performance",
        roles: ["MANAGER", "SUPERVISOR", "ADMIN"],
      },
      {
        id: "activity",
        label: "Activity",
        href: "/activity",
        icon: Activity,
        description: "Recent activity and logs",
        roles: ["MANAGER", "SUPERVISOR", "ADMIN"],
      },
      {
        id: "goals",
        label: "Goals",
        href: "/goals",
        icon: Target,
        description: "Performance goals and tracking",
        roles: ["MANAGER", "SUPERVISOR", "ADMIN"],
      },
    ],
  },
  {
    id: "reporting",
    label: "Reports & Analytics",
    roles: ["SUPERVISOR", "ADMIN"],
    items: [
      {
        id: "reports",
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        description: "Business intelligence and reporting",
        roles: ["SUPERVISOR", "ADMIN"],
      },
      {
        id: "locations",
        label: "Locations",
        href: "/locations",
        icon: Building2,
        description: "Multi-location management",
        roles: ["SUPERVISOR", "ADMIN"],
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    roles: ["ADMIN"],
    items: [
      {
        id: "users",
        label: "User Management",
        href: "/admin/users",
        icon: UserCheck,
        description: "Manage user accounts and permissions",
        roles: ["ADMIN"],
      },
      {
        id: "settings",
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        description: "System configuration",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    id: "system",
    label: "System",
    roles: ["USER", "ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
    items: [
      {
        id: "design-system",
        label: "Design System",
        href: "/design-system",
        icon: Palette,
        roles: ["USER", "ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
      },
      {
        id: "navigation-demo",
        label: "Navigation Demo",
        href: "/navigation-demo",
        icon: Activity,
        roles: ["USER", "ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
      },
      {
        id: "business-components",
        label: "Business Components",
        href: "/business-components-demo",
        icon: Building2,
        roles: ["USER", "ASSISTANT", "MANAGER", "SUPERVISOR", "ADMIN"],
      },
    ],
  },
];

/**
 * Get navigation items filtered by user role and facility access
 */
export function getNavigationForUser(
  userRole: string = "USER",
  hasLocations: boolean = false
): NavigationSection[] {
  return navigationConfig
    .filter((section) => section.roles.includes(userRole))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Check if user role can access this item
        if (!item.roles.includes(userRole)) return false;

        // Check if item requires locations and user has them
        if (item.requiresLocations && !hasLocations) return false;

        return true;
      }),
    }))
    .filter((section) => section.items.length > 0); // Remove empty sections
}

/**
 * Get flat list of navigation items for mobile/simple navigation
 */
export function getFlatNavigationItems(
  userRole: string = "USER",
  hasLocations: boolean = false
): NavigationItem[] {
  const sections = getNavigationForUser(userRole, hasLocations);
  return sections.flatMap((section) => section.items);
}

/**
 * Get primary navigation items (for mobile bottom tabs)
 */
export function getPrimaryNavigationItems(
  userRole: string = "USER",
  hasLocations: boolean = false,
  maxItems: number = 4
): NavigationItem[] {
  const allItems = getFlatNavigationItems(userRole, hasLocations);

  // Prioritize main navigation items
  const priorityOrder = [
    "dashboard",
    "deposits",
    "payroll",
    "employees",
    "activity",
    "goals",
  ];

  const sortedItems = allItems.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.id);
    const bIndex = priorityOrder.indexOf(b.id);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  return sortedItems.slice(0, maxItems);
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(
  route: string,
  userRole: string = "USER",
  hasLocations: boolean = false
): boolean {
  const allItems = getFlatNavigationItems(userRole, hasLocations);
  return allItems.some((item) => route.startsWith(item.href));
}
