"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle } from "lucide-react";

export type PayrollRole =
  | "USER"
  | "MANAGER"
  | "ASSISTANT"
  | "SUPERVISOR"
  | "ADMIN"
  | "OWNER";

export interface PayrollPermissions {
  canViewOwnPayroll: boolean;
  canViewTeamPayroll: boolean;
  canViewAllPayroll: boolean;
  canEditPayroll: boolean;
  canProcessPayroll: boolean;
  canApprovePayroll: boolean;
  canExportPayroll: boolean;
  canManagePayPeriods: boolean;
  canViewReports: boolean;
  canAccessAdminTools: boolean;
}

interface PayrollAccessControlProps {
  userRole: PayrollRole;
  userId: string;
  targetEmployeeId?: string;
  targetLocationIds?: string[];
  userLocationIds?: string[];
  requiredPermission: keyof PayrollPermissions;
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

// Define role-based permissions
const ROLE_PERMISSIONS: Record<PayrollRole, PayrollPermissions> = {
  USER: {
    canViewOwnPayroll: true,
    canViewTeamPayroll: false,
    canViewAllPayroll: false,
    canEditPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canExportPayroll: false,
    canManagePayPeriods: false,
    canViewReports: false,
    canAccessAdminTools: false,
  },
  MANAGER: {
    canViewOwnPayroll: true,
    canViewTeamPayroll: true,
    canViewAllPayroll: false,
    canEditPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canExportPayroll: true,
    canManagePayPeriods: false,
    canViewReports: true,
    canAccessAdminTools: false,
  },
  ASSISTANT: {
    canViewOwnPayroll: true,
    canViewTeamPayroll: false,
    canViewAllPayroll: false,
    canEditPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canExportPayroll: false,
    canManagePayPeriods: false,
    canViewReports: false,
    canAccessAdminTools: false,
  },
  SUPERVISOR: {
    canViewOwnPayroll: true,
    canViewTeamPayroll: true,
    canViewAllPayroll: true,
    canEditPayroll: true,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canExportPayroll: true,
    canManagePayPeriods: false,
    canViewReports: true,
    canAccessAdminTools: false,
  },
  ADMIN: {
    canViewOwnPayroll: true,
    canViewTeamPayroll: true,
    canViewAllPayroll: true,
    canEditPayroll: true,
    canProcessPayroll: true,
    canApprovePayroll: true,
    canExportPayroll: true,
    canManagePayPeriods: true,
    canViewReports: true,
    canAccessAdminTools: true,
  },
  OWNER: {
    canViewOwnPayroll: true,
    canViewTeamPayroll: true,
    canViewAllPayroll: true,
    canEditPayroll: true,
    canProcessPayroll: true,
    canApprovePayroll: true,
    canExportPayroll: true,
    canManagePayPeriods: true,
    canViewReports: true,
    canAccessAdminTools: true,
  },
};

export function PayrollAccessControl({
  userRole,
  userId,
  targetEmployeeId,
  targetLocationIds,
  userLocationIds,
  requiredPermission,
  children,
  fallback,
  showError = true,
}: PayrollAccessControlProps) {
  const permissions = ROLE_PERMISSIONS[userRole];
  const hasPermission = permissions[requiredPermission];

  // Additional checks for specific scenarios
  const hasAccess = () => {
    // If no permission, deny access
    if (!hasPermission) {
      return false;
    }

    // If viewing own payroll, check if it's the same user
    if (requiredPermission === "canViewOwnPayroll" && targetEmployeeId) {
      return userId === targetEmployeeId;
    }

    // If viewing team payroll, check location access
    if (
      requiredPermission === "canViewTeamPayroll" &&
      targetLocationIds &&
      userLocationIds
    ) {
      return targetLocationIds.some((locationId) =>
        userLocationIds.includes(locationId)
      );
    }

    // For other permissions, rely on role-based access
    return hasPermission;
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  // Return fallback or error message
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showError) {
    return null;
  }

  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view this payroll information.
          </p>
          <p className="text-xs text-muted-foreground">
            Required permission:{" "}
            {requiredPermission
              .replace("can", "")
              .replace(/([A-Z])/g, " $1")
              .toLowerCase()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to check permissions
export function usePayrollPermissions(userRole: PayrollRole) {
  const permissions = ROLE_PERMISSIONS[userRole];

  const checkPermission = (
    permission: keyof PayrollPermissions,
    context?: {
      userId?: string;
      targetEmployeeId?: string;
      targetLocationIds?: string[];
      userLocationIds?: string[];
    }
  ): boolean => {
    const hasPermission = permissions[permission];

    if (!hasPermission) {
      return false;
    }

    // Additional context-based checks
    if (context) {
      if (permission === "canViewOwnPayroll" && context.targetEmployeeId) {
        return context.userId === context.targetEmployeeId;
      }

      if (
        permission === "canViewTeamPayroll" &&
        context.targetLocationIds &&
        context.userLocationIds
      ) {
        return context.targetLocationIds.some((locationId) =>
          context.userLocationIds!.includes(locationId)
        );
      }
    }

    return hasPermission;
  };

  const getAccessibleActions = () => {
    const actions: string[] = [];

    if (permissions.canViewOwnPayroll) actions.push("View Own Payroll");
    if (permissions.canViewTeamPayroll) actions.push("View Team Payroll");
    if (permissions.canViewAllPayroll) actions.push("View All Payroll");
    if (permissions.canEditPayroll) actions.push("Edit Payroll");
    if (permissions.canProcessPayroll) actions.push("Process Payroll");
    if (permissions.canApprovePayroll) actions.push("Approve Payroll");
    if (permissions.canExportPayroll) actions.push("Export Payroll");
    if (permissions.canManagePayPeriods) actions.push("Manage Pay Periods");
    if (permissions.canViewReports) actions.push("View Reports");
    if (permissions.canAccessAdminTools) actions.push("Access Admin Tools");

    return actions;
  };

  return {
    permissions,
    checkPermission,
    getAccessibleActions,
  };
}

// Component to display user's payroll permissions
export function PayrollPermissionsDisplay({
  userRole,
}: {
  userRole: PayrollRole;
}) {
  const { permissions, getAccessibleActions } = usePayrollPermissions(userRole);
  const actions = getAccessibleActions();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h4 className="font-medium">Payroll Permissions</h4>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Role:</span>
            <span className="font-medium">{userRole}</span>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Accessible Actions:</span>
            <div className="mt-1 space-y-1">
              {actions.length > 0 ? (
                actions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span>{action}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>No payroll permissions</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
