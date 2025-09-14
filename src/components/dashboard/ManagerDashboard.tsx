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
} from "lucide-react";

interface ManagerDashboardProps {
  userRole: Role;
  locationId?: string;
  locationName?: string;
  className?: string;
}

export function ManagerDashboard({
  userRole,
  locationId,
  locationName,
  className,
}: ManagerDashboardProps) {
  // Mock data - in real implementation, this would come from props or API calls
  const locationMetrics: DashboardMetric[] = [
    {
      id: "occupancy-rate",
      title: "Occupancy Rate",
      value: "87%",
      change: {
        value: 5.2,
        type: "increase",
        period: "last month",
      },
      icon: TrendingUp,
      description: "Current facility occupancy",
    },
    {
      id: "monthly-revenue",
      title: "Monthly Revenue",
      value: "$45,231",
      change: {
        value: 12.5,
        type: "increase",
        period: "last month",
      },
      icon: DollarSign,
      description: "Total revenue this month",
    },
    {
      id: "new-rentals",
      title: "New Rentals",
      value: "23",
      change: {
        value: -3.1,
        type: "decrease",
        period: "last week",
      },
      icon: Users,
      description: "New customers this month",
    },
    {
      id: "overdue-payments",
      title: "Overdue Payments",
      value: "7",
      alert: {
        level: "warning",
        message: "Follow up required on overdue accounts",
      },
      icon: AlertCircle,
      action: {
        label: "View Details",
        href: `/location/${locationId}/payments`,
      },
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: "view-payroll",
      label: "My Payroll",
      description: "View your current payroll information",
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
      id: "location-details",
      label: "Location Details",
      description: "Manage your facility information",
      href: `/location/${locationId}`,
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
      id: "daily-report",
      label: "Daily Report",
      description: "Generate today's activity report",
      href: `/location/${locationId}/reports/daily`,
      icon: FileText,
      roles: [
        Role.MANAGER,
        Role.ASSISTANT,
        Role.SUPERVISOR,
        Role.ADMIN,
        Role.OWNER,
      ],
    },
    {
      id: "schedule",
      label: "Schedule",
      description: "View and manage work schedule",
      href: `/location/${locationId}/schedule`,
      icon: Calendar,
      roles: [
        Role.MANAGER,
        Role.ASSISTANT,
        Role.SUPERVISOR,
        Role.ADMIN,
        Role.OWNER,
      ],
    },
    {
      id: "settings",
      label: "Settings",
      description: "Update your preferences",
      href: "/settings",
      icon: Settings,
      roles: [
        Role.USER,
        Role.MANAGER,
        Role.ASSISTANT,
        Role.SUPERVISOR,
        Role.ADMIN,
        Role.OWNER,
      ],
    },
  ];

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          {locationName && (
            <p className="text-muted-foreground">Managing {locationName}</p>
          )}
        </div>

        {/* Location Metrics */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Location Performance</h2>
          <MetricsGrid
            metrics={locationMetrics}
            cols={1}
            colsMd={2}
            colsLg={4}
            gap="md"
            cardVariant="compact"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <QuickActionsGrid
            actions={quickActions}
            userRole={userRole}
            cols={1}
            colsMd={2}
            colsLg={3}
            variant="default"
            title=""
            maxActions={6}
          />
        </div>

        {/* Contextual Shortcuts and Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ContextualShortcuts
            userRole={userRole}
            context={{
              locationId,
              locationName,
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
