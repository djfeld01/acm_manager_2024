"use client";

import { Role } from "@/db/schema/user";
import { ManagerDashboard } from "./ManagerDashboard";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";

interface RoleDashboardProps {
  userRole: Role;
  locationId?: string;
  locationName?: string;
  managedLocations?: Array<{
    id: string;
    name: string;
    occupancyRate: number;
    revenue: number;
  }>;
  systemStats?: {
    totalLocations: number;
    totalUsers: number;
    totalRevenue: number;
    systemHealth: "good" | "warning" | "critical";
  };
  className?: string;
}

export function RoleDashboard({
  userRole,
  locationId,
  locationName,
  managedLocations,
  systemStats,
  className,
}: RoleDashboardProps) {
  const renderDashboard = () => {
    switch (userRole) {
      case Role.MANAGER:
      case Role.ASSISTANT:
        return (
          <ManagerDashboard
            userRole={userRole}
            locationId={locationId}
            locationName={locationName}
            className={className}
          />
        );

      case Role.SUPERVISOR:
        return (
          <SupervisorDashboard
            userRole={userRole}
            managedLocations={managedLocations}
            className={className}
          />
        );

      case Role.ADMIN:
      case Role.OWNER:
        return (
          <AdminDashboard
            userRole={userRole}
            systemStats={systemStats}
            className={className}
          />
        );

      case Role.USER:
      default:
        // For basic users, show a simplified manager-style dashboard
        return (
          <ManagerDashboard
            userRole={userRole}
            locationId={locationId}
            locationName={locationName}
            className={className}
          />
        );
    }
  };

  return <ComponentErrorBoundary>{renderDashboard()}</ComponentErrorBoundary>;
}

// Export individual dashboard components for direct use if needed
export { ManagerDashboard, SupervisorDashboard, AdminDashboard };
