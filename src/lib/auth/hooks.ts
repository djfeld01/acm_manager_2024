"use client";

import { useSession } from "next-auth/react";
import { Role } from "@/db/schema/user";
import { User, Facility, PermissionContext } from "@/lib/types";
import {
  createAccessControl,
  hasRole,
  canAccessRoute,
} from "@/lib/permissions";
import { useMemo } from "react";

/**
 * Hook to get current user session with type safety
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();

  const user = useMemo(() => {
    if (!session?.user) return null;

    const sessionUser = session.user;
    const facilities: Facility[] = (sessionUser.facilities || []).map((f) => ({
      id: f.sitelinkId,
      sitelinkId: f.sitelinkId,
      facilityName: f.facilityName,
      facilityAbbreviation: f.facilityAbbreviation,
    }));

    return {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email!,
      role: sessionUser.role as Role,
      image: sessionUser.image,
      userDetailId: sessionUser.userDetailId,
      facilities,
    } as User;
  }, [session]);

  return {
    user,
    isLoading: status === "loading",
    isAuthenticated: !!user,
  };
}

/**
 * Hook to get user's permission context
 */
export function usePermissionContext(): PermissionContext | null {
  const { user } = useCurrentUser();

  return useMemo(() => {
    if (!user) return null;

    return {
      userId: user.id,
      userRole: user.role,
      facilityIds: user.facilities.map((f) => f.id),
      teamMemberIds: [], // TODO: Add team member logic
    };
  }, [user]);
}

/**
 * Hook to get access control utilities
 */
export function useAccessControl() {
  const context = usePermissionContext();

  return useMemo(() => {
    if (!context) {
      return {
        canAccess: () => false,
        canAccessRoute: () => false,
        getPermissions: () => [],
        hasRole: () => false,
      };
    }

    return createAccessControl(context);
  }, [context]);
}

/**
 * Hook to check if user has specific role(s)
 */
export function useHasRole(allowedRoles: Role | Role[]) {
  const { user } = useCurrentUser();

  return useMemo(() => {
    if (!user?.role) return false;
    return hasRole(user.role, allowedRoles);
  }, [user?.role, allowedRoles]);
}

/**
 * Hook to check if user can access a route
 */
export function useCanAccessRoute(route: string) {
  const { user } = useCurrentUser();

  return useMemo(() => {
    if (!user?.role) return false;
    return canAccessRoute(user.role, route);
  }, [user?.role, route]);
}

/**
 * Hook to check if user can access a resource
 */
export function useCanAccess(
  resource: string,
  action: "read" | "write" | "delete" | "admin"
) {
  const accessControl = useAccessControl();

  return useMemo(() => {
    return accessControl.canAccess(resource, action);
  }, [accessControl, resource, action]);
}

/**
 * Hook to get user's facilities
 */
export function useUserFacilities() {
  const { user } = useCurrentUser();

  return useMemo(() => {
    return user?.facilities || [];
  }, [user?.facilities]);
}

/**
 * Hook to check if user can access a specific facility
 */
export function useCanAccessFacility(facilityId: string) {
  const { user } = useCurrentUser();
  const facilities = useUserFacilities();

  return useMemo(() => {
    if (!user) return false;

    // Admins and owners can access all facilities
    if (user.role === Role.ADMIN || user.role === Role.OWNER) {
      return true;
    }

    return facilities.some((f) => f.id === facilityId);
  }, [user, facilities, facilityId]);
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleGuard(allowedRoles: Role | Role[]) {
  const hasRequiredRole = useHasRole(allowedRoles);
  const { isLoading } = useCurrentUser();

  return {
    canRender: hasRequiredRole,
    isLoading,
  };
}
