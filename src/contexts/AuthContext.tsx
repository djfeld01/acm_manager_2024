"use client";

import { createContext, useContext, ReactNode } from "react";
import { Session } from "next-auth";
import { useSession } from "next-auth/react";

// Define roles and permissions
export const ROLES = {
  USER: "USER",
  ASSISTANT: "ASSISTANT",
  MANAGER: "MANAGER",
  SUPERVISOR: "SUPERVISOR",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Define permission levels
export const PERMISSIONS = {
  READ_BASIC: "READ_BASIC",
  READ_REPORTS: "READ_REPORTS",
  MANAGE_EMPLOYEES: "MANAGE_EMPLOYEES",
  MANAGE_PAYROLL: "MANAGE_PAYROLL",
  MANAGE_GOALS: "MANAGE_GOALS",
  MANAGE_FINANCES: "MANAGE_FINANCES",
  FULL_ACCESS: "FULL_ACCESS",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: [PERMISSIONS.READ_BASIC],
  [ROLES.ASSISTANT]: [PERMISSIONS.READ_BASIC, PERMISSIONS.READ_REPORTS],
  [ROLES.MANAGER]: [
    PERMISSIONS.READ_BASIC,
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.MANAGE_GOALS,
  ],
  [ROLES.SUPERVISOR]: [
    PERMISSIONS.READ_BASIC,
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.MANAGE_GOALS,
    PERMISSIONS.MANAGE_FINANCES,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.READ_BASIC,
    PERMISSIONS.READ_REPORTS,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.MANAGE_GOALS,
    PERMISSIONS.MANAGE_FINANCES,
    PERMISSIONS.FULL_ACCESS,
  ],
};

interface AuthContextType {
  session: Session | null;
  user: Session["user"] | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isManager: boolean;
  canManageEmployees: boolean;
  canManagePayroll: boolean;
  canManageFinances: boolean;
  // Facility-related methods
  userFacilities: Array<{
    sitelinkId: string;
    facilityName: string;
    facilityAbbreviation: string;
    position: string | null;
    primarySite: boolean | null;
    rentsUnits: boolean | null;
  }>;
  hasAccessToFacility: (sitelinkId: string) => boolean;
  getUserFacilityIds: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user && !!session.user.userDetailId;
  const userRole = session?.user?.role as Role;

  const hasRole = (role: Role): boolean => {
    return userRole === role;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const isAdmin = hasRole(ROLES.ADMIN);
  const isSupervisor = hasAnyRole([ROLES.SUPERVISOR, ROLES.ADMIN]);
  const isManager = hasAnyRole([ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.ADMIN]);
  const canManageEmployees = hasPermission(PERMISSIONS.MANAGE_EMPLOYEES);
  const canManagePayroll = hasPermission(PERMISSIONS.MANAGE_PAYROLL);
  const canManageFinances = hasPermission(PERMISSIONS.MANAGE_FINANCES);

  // Facility-related methods
  const userFacilities = session?.user?.facilities || [];

  const hasAccessToFacility = (sitelinkId: string): boolean => {
    // Admins have access to all facilities
    if (isAdmin) return true;
    // Other users only have access to their assigned facilities
    return userFacilities.some(
      (facility) => facility.sitelinkId === sitelinkId
    );
  };

  const getUserFacilityIds = (): string[] => {
    // Admins get access to all facilities (we'll handle this in the component)
    if (isAdmin) return [];
    return userFacilities.map((facility) => facility.sitelinkId);
  };

  const value: AuthContextType = {
    session,
    user: session?.user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
    isAdmin,
    isSupervisor,
    isManager,
    canManageEmployees,
    canManagePayroll,
    canManageFinances,
    userFacilities,
    hasAccessToFacility,
    getUserFacilityIds,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Utility components for conditional rendering
interface ProtectedProps {
  children: ReactNode;
  roles?: Role[];
  permissions?: Permission[];
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles/permissions, not just one
}

export function Protected({
  children,
  roles = [],
  permissions = [],
  fallback = null,
  requireAll = false,
}: ProtectedProps) {
  const {
    isLoading,
    isAuthenticated,
    hasAnyRole,
    hasAnyPermission,
    hasRole,
    hasPermission,
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check roles
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    hasRequiredRoles = requireAll
      ? roles.every((role) => hasRole(role))
      : hasAnyRole(roles);
  }

  // Check permissions
  let hasRequiredPermissions = true;
  if (permissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? permissions.every((permission) => hasPermission(permission))
      : hasAnyPermission(permissions);
  }

  if (hasRequiredRoles && hasRequiredPermissions) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Specific role components for convenience
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Protected roles={[ROLES.ADMIN]} fallback={fallback}>
      {children}
    </Protected>
  );
}

export function SupervisorOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Protected roles={[ROLES.SUPERVISOR, ROLES.ADMIN]} fallback={fallback}>
      {children}
    </Protected>
  );
}

export function ManagerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Protected
      roles={[ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.ADMIN]}
      fallback={fallback}
    >
      {children}
    </Protected>
  );
}
