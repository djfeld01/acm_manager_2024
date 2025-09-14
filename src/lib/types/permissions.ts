import { Role } from "@/db/schema/user";

export type PermissionAction = "read" | "write" | "delete" | "admin";
export type PermissionScope = "own" | "facility" | "team" | "all";

export interface Permission {
  resource: string;
  action: PermissionAction;
  scope: PermissionScope;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  [Role.USER]: Permission[];
  [Role.MANAGER]: Permission[];
  [Role.ASSISTANT]: Permission[];
  [Role.SUPERVISOR]: Permission[];
  [Role.ADMIN]: Permission[];
  [Role.OWNER]: Permission[];
}

export interface AccessControl {
  canAccess: (
    resource: string,
    action: PermissionAction,
    context?: any
  ) => boolean;
  canAccessRoute: (route: string) => boolean;
  getPermissions: () => Permission[];
  hasRole: (role: Role | Role[]) => boolean;
}

export interface PermissionContext {
  userId: string;
  userRole: Role;
  facilityIds: string[];
  teamMemberIds?: string[];
}
