import { Role } from "@/db/schema/user";
import {
  Permission,
  PermissionAction,
  PermissionScope,
  PermissionContext,
  AccessControl,
} from "@/lib/types/permissions";
import { ROLE_PERMISSIONS, ROUTE_PERMISSIONS } from "./config";

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  userRole: Role,
  resource: string,
  action: PermissionAction,
  context?: PermissionContext
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

  return rolePermissions.some((permission) => {
    // Check if resource and action match
    if (permission.resource !== resource || permission.action !== action) {
      return false;
    }

    // Check scope-based access
    return checkScopeAccess(permission, context);
  });
}

/**
 * Check if scope-based access is allowed
 */
function checkScopeAccess(
  permission: Permission,
  context?: PermissionContext
): boolean {
  if (!context) return permission.scope === "all";

  switch (permission.scope) {
    case "all":
      return true;
    case "own":
      return true; // Context validation handled at component level
    case "facility":
      return context.facilityIds.length > 0;
    case "team":
      return !!(context.teamMemberIds && context.teamMemberIds.length > 0);
    default:
      return false;
  }
}

/**
 * Check if a user can access a specific route
 */
export function canAccessRoute(userRole: Role, route: string): boolean {
  // Remove query parameters and hash
  const cleanRoute = route.split("?")[0].split("#")[0];

  // Check exact route match first
  if (ROUTE_PERMISSIONS[cleanRoute]) {
    return ROUTE_PERMISSIONS[cleanRoute].roles.includes(userRole);
  }

  // Check parent routes (e.g., /payroll/123 -> /payroll)
  const routeParts = cleanRoute.split("/").filter(Boolean);
  for (let i = routeParts.length; i > 0; i--) {
    const parentRoute = "/" + routeParts.slice(0, i).join("/");
    if (ROUTE_PERMISSIONS[parentRoute]) {
      return ROUTE_PERMISSIONS[parentRoute].roles.includes(userRole);
    }
  }

  // Default to allowing access if no specific route permissions defined
  return true;
}

/**
 * Get all permissions for a user role
 */
export function getUserPermissions(userRole: Role): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRole: Role, allowedRoles: Role | Role[]): boolean {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(userRole);
}

/**
 * Create an access control object for a user
 */
export function createAccessControl(context: PermissionContext): AccessControl {
  return {
    canAccess: (
      resource: string,
      action: PermissionAction,
      additionalContext?: any
    ) => {
      return hasPermission(context.userRole, resource, action, {
        ...context,
        ...additionalContext,
      });
    },
    canAccessRoute: (route: string) => {
      return canAccessRoute(context.userRole, route);
    },
    getPermissions: () => {
      return getUserPermissions(context.userRole);
    },
    hasRole: (role: Role | Role[]) => {
      return hasRole(context.userRole, role);
    },
  };
}

/**
 * Filter items based on user role permissions
 */
export function filterByRole<T extends { roles: Role[] }>(
  items: T[],
  userRole: Role
): T[] {
  return items.filter((item) => item.roles.includes(userRole));
}
