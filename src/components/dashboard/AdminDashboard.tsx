"use client";

import { DashboardMetric } from "./DashboardCard";
import { QuickAction } from "./QuickActions";
import { MetricsGrid, QuickActionsGrid } from "./index";
import { RecentActivity, generateMockActivities } from "./RecentActivity";
import { ContextualShortcuts, getPageContext } from "./ContextualShortcuts";
import { Role } from "@/db/schema/user";
import {
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  FileText,
  Settings,
  MapPin,
  Calendar,
  Building,
  UserCheck,
  BarChart3,
  Target,
  Shield,
  Database,
  Cog,
  Activity,
  PieChart,
  Briefcase,
} from "lucide-react";

interface AdminDashboardProps {
  userRole: Role;
  systemStats?: {
    totalLocations: number;
    totalUsers: number;
    totalRevenue: number;
    systemHealth: "good" | "warning" | "critical";
  };
  className?: string;
}

export function AdminDashboard({
  userRole,
  systemStats = {
    totalLocations: 19,
    totalUsers: 45,
    totalRevenue: 892450,
    systemHealth: "good",
  },
  className,
}: AdminDashboardProps) {
  const systemMetrics: DashboardMetric[] = [
    {
      id: "total-locations",
      title: "Total Locations",
      value: systemStats.totalLocations.toString(),
      change: {
        value: 5.3,
        type: "increase",
        period: "this year",
      },
      icon: Building,
      description: "All facilities in the system",
    },
    {
      id: "total-revenue",
      title: "System Revenue",
      value: `$${(systemStats.totalRevenue / 1000).toFixed(0)}K`,
      change: {
        value: 15.2,
        type: "increase",
        period: "last month",
      },
      icon: DollarSign,
      description: "Total revenue across all locations",
    },
    {
      id: "active-users",
      title: "Active Users",
      value: systemStats.totalUsers.toString(),
      change: {
        value: 8.7,
        type: "increase",
        period: "this quarter",
      },
      icon: Users,
      description: "Total system users",
    },
    {
      id: "system-health",
      title: "System Health",
      value:
        systemStats.systemHealth === "good"
          ? "Excellent"
          : systemStats.systemHealth === "warning"
          ? "Warning"
          : "Critical",
      alert:
        systemStats.systemHealth !== "good"
          ? {
              level:
                systemStats.systemHealth === "warning" ? "warning" : "error",
              message: "System requires attention",
            }
          : undefined,
      icon: Activity,
      action: {
        label: "View Details",
        href: "/admin/system-health",
      },
    },
    {
      id: "avg-occupancy",
      title: "Average Occupancy",
      value: "84%",
      change: {
        value: 2.1,
        type: "increase",
        period: "last month",
      },
      icon: TrendingUp,
      description: "Across all facilities",
    },
    {
      id: "monthly-target",
      title: "Company Target",
      value: "96%",
      change: {
        value: -4.2,
        type: "decrease",
        period: "vs target",
      },
      icon: Target,
      description: "Progress toward company goals",
    },
  ];

  const adminQuickActions: QuickAction[] = [
    {
      id: "payroll-management",
      label: "Payroll Management",
      description: "Comprehensive payroll processing and oversight",
      href: "/admin/payroll",
      icon: DollarSign,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "user-management",
      label: "User Management",
      description: "Manage users, roles, and permissions",
      href: "/admin/users",
      icon: UserCheck,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "location-management",
      label: "Location Management",
      description: "Manage all facilities and their settings",
      href: "/admin/locations",
      icon: MapPin,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "system-reports",
      label: "System Reports",
      description: "Generate comprehensive system reports",
      href: "/admin/reports",
      icon: FileText,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "analytics-dashboard",
      label: "Analytics Dashboard",
      description: "Advanced analytics and business intelligence",
      href: "/admin/analytics",
      icon: BarChart3,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "financial-overview",
      label: "Financial Overview",
      description: "Company-wide financial metrics and trends",
      href: "/admin/financial",
      icon: PieChart,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "system-settings",
      label: "System Settings",
      description: "Configure system-wide settings and preferences",
      href: "/admin/settings",
      icon: Cog,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "security-center",
      label: "Security Center",
      description: "Monitor security and access controls",
      href: "/admin/security",
      icon: Shield,
      roles: [Role.ADMIN, Role.OWNER],
    },
    {
      id: "database-tools",
      label: "Database Tools",
      description: "Database management and maintenance tools",
      href: "/admin/database",
      icon: Database,
      roles: [Role.ADMIN, Role.OWNER],
    },
  ];

  const recentAlerts: DashboardMetric[] = [
    {
      id: "low-occupancy-alert",
      title: "Low Occupancy Alert",
      value: "",
      alert: {
        level: "warning",
        message: "Location ABC has occupancy below 70%",
      },
      action: {
        label: "Investigate",
        href: "/admin/locations/abc",
      },
    },
    {
      id: "payment-processing",
      title: "Payment Processing",
      value: "",
      alert: {
        level: "info",
        message: "Monthly payment processing completed successfully",
      },
    },
  ];

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive system oversight and management tools
          </p>
        </div>

        {/* System Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">System Overview</h2>
          <MetricsGrid
            metrics={systemMetrics}
            cols={1}
            colsMd={2}
            colsLg={3}
            gap="md"
            cardVariant="default"
          />
        </div>

        {/* Recent Alerts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">System Alerts</h2>
          <MetricsGrid
            metrics={recentAlerts}
            cols={1}
            colsMd={1}
            colsLg={2}
            gap="md"
            cardVariant="default"
          />
        </div>

        {/* Admin Tools */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Administration Tools</h2>
          <QuickActionsGrid
            actions={adminQuickActions}
            userRole={userRole}
            cols={1}
            colsMd={2}
            colsLg={3}
            variant="default"
            title=""
          />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Statistics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">19</div>
              <div className="text-sm text-muted-foreground">
                Active Locations
              </div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">45</div>
              <div className="text-sm text-muted-foreground">System Users</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">84%</div>
              <div className="text-sm text-muted-foreground">Avg Occupancy</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <DollarSign className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">$892K</div>
              <div className="text-sm text-muted-foreground">
                Monthly Revenue
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Shortcuts and Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ContextualShortcuts
            userRole={userRole}
            context={{
              currentPage: "dashboard",
              ...getPageContext("/dashboard"),
            }}
          />

          <RecentActivity
            activities={generateMockActivities()}
            userRole={userRole}
            maxItems={8}
          />
        </div>
      </div>
    </div>
  );
}
