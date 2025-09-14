import {
  LayoutDashboard,
  DollarSign,
  MapPin,
  BarChart3,
  Settings,
  Users,
  FileText,
  Shield,
} from "lucide-react";
import { Role } from "@/db/schema/user";
import { NavigationItem } from "@/lib/types";

/**
 * Main navigation configuration
 * Items are filtered based on user roles
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      Role.MANAGER,
      Role.ASSISTANT,
      Role.SUPERVISOR,
      Role.ADMIN,
      Role.OWNER,
    ],
  },
  {
    id: "payroll",
    label: "Payroll",
    href: "/payroll",
    icon: DollarSign,
    roles: [
      Role.MANAGER,
      Role.ASSISTANT,
      Role.SUPERVISOR,
      Role.ADMIN,
      Role.OWNER,
    ],
  },
  {
    id: "locations",
    label: "Locations",
    href: "/locations",
    icon: MapPin,
    roles: [
      Role.MANAGER,
      Role.ASSISTANT,
      Role.SUPERVISOR,
      Role.ADMIN,
      Role.OWNER,
    ],
  },
  {
    id: "reports",
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
  },
  {
    id: "employees",
    label: "Employees",
    href: "/employees",
    icon: Users,
    roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
  },
  {
    id: "admin",
    label: "Admin",
    href: "/admin",
    icon: Shield,
    roles: [Role.ADMIN, Role.OWNER],
  },
];

/**
 * Secondary navigation items (shown in footer or separate section)
 */
export const SECONDARY_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: [
      Role.MANAGER,
      Role.ASSISTANT,
      Role.SUPERVISOR,
      Role.ADMIN,
      Role.OWNER,
    ],
  },
];

/**
 * Quick actions for dashboard and navigation
 */
export const QUICK_ACTIONS: NavigationItem[] = [
  {
    id: "new-payroll",
    label: "Process Payroll",
    href: "/payroll/new",
    icon: DollarSign,
    roles: [Role.ADMIN, Role.OWNER],
  },
  {
    id: "view-reports",
    label: "View Reports",
    href: "/reports",
    icon: FileText,
    roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
  },
  {
    id: "manage-locations",
    label: "Manage Locations",
    href: "/locations",
    icon: MapPin,
    roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
  },
];
