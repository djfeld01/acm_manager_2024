import { Role } from "@/db/schema/user";

export interface LocationPermission {
  sitelinkId: string;
  canRead: boolean;
  canWrite: boolean;
  canManage: boolean;
  canViewPayroll: boolean;
  canViewReports: boolean;
}

export interface UserLocationAccess {
  userId: string;
  role: Role;
  assignedFacilities: string[]; // sitelinkIds
  permissions: LocationPermission[];
}

/**
 * Check if a user has access to a specific location
 */
export function hasLocationAccess(
  userAccess: UserLocationAccess,
  sitelinkId: string
): boolean {
  // Admins and Owners have access to all locations
  if (userAccess.role === Role.ADMIN || userAccess.role === Role.OWNER) {
    return true;
  }

  // Check if user is assigned to this facility
  return userAccess.assignedFacilities.includes(sitelinkId);
}

/**
 * Check if a user can read data from a specific location
 */
export function canReadLocation(
  userAccess: UserLocationAccess,
  sitelinkId: string
): boolean {
  if (!hasLocationAccess(userAccess, sitelinkId)) {
    return false;
  }

  const permission = userAccess.permissions.find(
    (p) => p.sitelinkId === sitelinkId
  );

  return permission?.canRead ?? true; // Default to true if permission not explicitly set
}

/**
 * Check if a user can write/modify data for a specific location
 */
export function canWriteLocation(
  userAccess: UserLocationAccess,
  sitelinkId: string
): boolean {
  if (!hasLocationAccess(userAccess, sitelinkId)) {
    return false;
  }

  // Admins and Owners can write to all locations they have access to
  if (userAccess.role === Role.ADMIN || userAccess.role === Role.OWNER) {
    return true;
  }

  const permission = userAccess.permissions.find(
    (p) => p.sitelinkId === sitelinkId
  );

  return permission?.canWrite ?? false; // Default to false for write access
}

/**
 * Check if a user can manage a specific location (staff, settings, etc.)
 */
export function canManageLocation(
  userAccess: UserLocationAccess,
  sitelinkId: string
): boolean {
  if (!hasLocationAccess(userAccess, sitelinkId)) {
    return false;
  }

  // Only Admins and Owners can manage locations
  if (userAccess.role === Role.ADMIN || userAccess.role === Role.OWNER) {
    return true;
  }

  const permission = userAccess.permissions.find(
    (p) => p.sitelinkId === sitelinkId
  );

  return permission?.canManage ?? false;
}

/**
 * Check if a user can view payroll data for a specific location
 */
export function canViewLocationPayroll(
  userAccess: UserLocationAccess,
  sitelinkId: string
): boolean {
  if (!hasLocationAccess(userAccess, sitelinkId)) {
    return false;
  }

  // Admins and Owners can view all payroll data
  if (userAccess.role === Role.ADMIN || userAccess.role === Role.OWNER) {
    return true;
  }

  // Area Managers can view payroll for their assigned locations
  if (userAccess.role === Role.SUPERVISOR) {
    return true;
  }

  const permission = userAccess.permissions.find(
    (p) => p.sitelinkId === sitelinkId
  );

  return permission?.canViewPayroll ?? false;
}

/**
 * Check if a user can view reports for a specific location
 */
export function canViewLocationReports(
  userAccess: UserLocationAccess,
  sitelinkId: string
): boolean {
  if (!hasLocationAccess(userAccess, sitelinkId)) {
    return false;
  }

  const permission = userAccess.permissions.find(
    (p) => p.sitelinkId === sitelinkId
  );

  return permission?.canViewReports ?? true; // Default to true for reports
}

/**
 * Filter locations based on user access
 */
export function filterLocationsByAccess(
  locations: Array<{ sitelinkId: string }>,
  userAccess: UserLocationAccess
): Array<{ sitelinkId: string }> {
  return locations.filter((location) =>
    hasLocationAccess(userAccess, location.sitelinkId)
  );
}

/**
 * Get all location IDs that a user has access to
 */
export function getUserAccessibleLocationIds(
  userAccess: UserLocationAccess,
  allLocationIds: string[]
): string[] {
  // Admins and Owners have access to all locations
  if (userAccess.role === Role.ADMIN || userAccess.role === Role.OWNER) {
    return allLocationIds;
  }

  // Return only assigned facilities
  return userAccess.assignedFacilities;
}

/**
 * Create default location permissions for a user role
 */
export function createDefaultLocationPermissions(
  sitelinkIds: string[],
  role: Role
): LocationPermission[] {
  return sitelinkIds.map((sitelinkId) => {
    switch (role) {
      case Role.ADMIN:
      case Role.OWNER:
        return {
          sitelinkId,
          canRead: true,
          canWrite: true,
          canManage: true,
          canViewPayroll: true,
          canViewReports: true,
        };

      case Role.SUPERVISOR: // Area Manager
        return {
          sitelinkId,
          canRead: true,
          canWrite: true,
          canManage: false,
          canViewPayroll: true,
          canViewReports: true,
        };

      case Role.MANAGER:
        return {
          sitelinkId,
          canRead: true,
          canWrite: true,
          canManage: false,
          canViewPayroll: false, // Can only view their own payroll
          canViewReports: true,
        };

      case Role.ASSISTANT:
      default:
        return {
          sitelinkId,
          canRead: true,
          canWrite: false,
          canManage: false,
          canViewPayroll: false,
          canViewReports: false,
        };
    }
  });
}

/**
 * Validate if a user can perform a specific action on multiple locations
 */
export function canPerformBulkAction(
  userAccess: UserLocationAccess,
  locationIds: string[],
  action: "read" | "write" | "manage" | "viewPayroll" | "viewReports"
): { allowed: boolean; deniedLocations: string[] } {
  const deniedLocations: string[] = [];

  for (const locationId of locationIds) {
    let hasPermission = false;

    switch (action) {
      case "read":
        hasPermission = canReadLocation(userAccess, locationId);
        break;
      case "write":
        hasPermission = canWriteLocation(userAccess, locationId);
        break;
      case "manage":
        hasPermission = canManageLocation(userAccess, locationId);
        break;
      case "viewPayroll":
        hasPermission = canViewLocationPayroll(userAccess, locationId);
        break;
      case "viewReports":
        hasPermission = canViewLocationReports(userAccess, locationId);
        break;
    }

    if (!hasPermission) {
      deniedLocations.push(locationId);
    }
  }

  return {
    allowed: deniedLocations.length === 0,
    deniedLocations,
  };
}
