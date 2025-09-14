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
} from "lucide-react";

interface SupervisorDashboardProps {
  userRole: Role;
  managedLocations?: Array<{
    id: string;
    name: string;
    occupancyRate: number;
    revenue: number;
  }>;
  className?: string;
}

export function SupervisorDashboard({
  userRole,
  managedLocations = [],
  className,
}: SupervisorDashboardProps) {
  // Calculate aggregate metrics from managed locations
  const totalRevenue = managedLocations.reduce(
    (sum, loc) => sum + loc.revenue,
    0
  );
  const avgOccupancy =
    managedLocations.length > 0
      ? managedLocations.reduce((sum, loc) => sum + loc.occupancyRate, 0) /
        managedLocations.length
      : 0;

  const multiLocationMetrics: DashboardMetric[] = [
    {
      id: "total-locations",
      title: "Managed Locations",
      value: managedLocations.length.toString(),
      icon: Building,
      description: "Facilities under your management",
    },
    {
      id: "avg-occupancy",
      title: "Average Occupancy",
      value: `${Math.round(avgOccupancy)}%`,
      change: {
        value: 3.8,
        type: "increase",
        period: "last month",
      },
      icon: TrendingUp,
      description: "Across all managed locations",
    },
    {
      id: "total-revenue",
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      change: {
        value: 8.2,
        type: "increase",
        period: "last month",
      },
      icon: DollarSign,
      description: "Combined monthly revenue",
    },
    {
      id: "team-size",
      title: "Team Members",
      value: "24",
      change: {
        value: 2,
        type: "increase",
        period: "this quarter",
      },
      icon: Users,
      description: "Direct reports across locations",
    },
    {
      id: "performance-alerts",
      title: "Performance Alerts",
      value: "3",
      alert: {
        level: "warning",
        message: "Some locations need attention",
      },
      icon: AlertCircle,
      action: {
        label: "Review Alerts",
        href: "/locations/alerts",
      },
    },
    {
      id: "monthly-target",
      title: "Monthly Target",
      value: "92%",
      change: {
        value: -5.2,
        type: "decrease",
        period: "vs target",
      },
      icon: Target,
      description: "Progress toward monthly goals",
    },
  ];

  const supervisorQuickActions: QuickAction[] = [
    {
      id: "team-payroll",
      label: "Team Payroll",
      description: "Manage payroll for your direct reports",
      href: "/payroll/team",
      icon: DollarSign,
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
    },
    {
      id: "locations-overview",
      label: "Locations Overview",
      description: "View all managed facilities",
      href: "/locations",
      icon: MapPin,
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
    },
    {
      id: "team-reports",
      label: "Team Reports",
      description: "Generate reports for your locations",
      href: "/reports/team",
      icon: FileText,
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
    },
    {
      id: "performance-dashboard",
      label: "Performance Dashboard",
      description: "Detailed analytics and insights",
      href: "/reports/performance",
      icon: BarChart3,
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
    },
    {
      id: "team-schedule",
      label: "Team Schedule",
      description: "Manage schedules across locations",
      href: "/schedule/team",
      icon: Calendar,
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
    },
    {
      id: "staff-management",
      label: "Staff Management",
      description: "Manage team members and assignments",
      href: "/team/management",
      icon: UserCheck,
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
    },
  ];

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Area Manager Dashboard
          </h1>
          <p className="text-muted-foreground">
            Managing {managedLocations.length} locations with comprehensive
            oversight
          </p>
        </div>

        {/* Multi-Location Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Multi-Location Overview</h2>
          <MetricsGrid
            metrics={multiLocationMetrics}
            cols={1}
            colsMd={2}
            colsLg={3}
            gap="md"
            cardVariant="default"
          />
        </div>

        {/* Location Performance Summary */}
        {managedLocations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Location Performance</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {managedLocations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{location.name}</h3>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Occupancy:</span>
                      <span className="font-medium">
                        {location.occupancyRate}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-medium">
                        ${location.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Management Shortcuts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Team Management</h2>
          <QuickActionsGrid
            actions={supervisorQuickActions}
            userRole={userRole}
            cols={1}
            colsMd={2}
            colsLg={3}
            variant="default"
            title=""
          />
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
