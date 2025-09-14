import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/db/schema/user";
import { canAccessRoute, createAccessControl } from "@/lib/permissions";
import { User, Facility, PermissionContext } from "@/lib/types";

/**
 * Get the current user session with type safety
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Get the current session with full type safety
 */
export async function getCurrentSession() {
  const session = await auth();
  return session;
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }
  return user;
}

/**
 * Require specific role - redirect to unauthorized if insufficient permissions
 */
export async function requireRole(allowedRoles: Role | Role[]) {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user.role || !roles.includes(user.role as Role)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Check route access and redirect if unauthorized
 */
export async function requireRouteAccess(route: string) {
  const user = await requireAuth();

  if (!canAccessRoute(user.role as Role, route)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Get user with facilities - integrates with existing facility system
 */
export async function getUserWithFacilities(): Promise<User> {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;

  // Convert session facilities to our Facility type
  const facilities: Facility[] = (user.facilities || []).map((f) => ({
    id: f.sitelinkId,
    sitelinkId: f.sitelinkId,
    facilityName: f.facilityName,
    facilityAbbreviation: f.facilityAbbreviation,
  }));

  return {
    id: user.id,
    name: user.name || null,
    email: user.email!,
    role: user.role as Role,
    image: user.image || null,
    userDetailId: user.userDetailId || null,
    facilities,
  };
}

/**
 * Create permission context for the current user
 */
export async function createUserPermissionContext(): Promise<PermissionContext> {
  const user = await getUserWithFacilities();

  return {
    userId: user.id,
    userRole: user.role,
    facilityIds: user.facilities.map((f) => f.id),
    // TODO: Add team member IDs for supervisors
    teamMemberIds: [],
  };
}

/**
 * Get access control object for the current user
 */
export async function getUserAccessControl() {
  const context = await createUserPermissionContext();
  return createAccessControl(context);
}

/**
 * Check if current user can access a resource
 */
export async function canUserAccess(
  resource: string,
  action: "read" | "write" | "delete" | "admin"
) {
  const accessControl = await getUserAccessControl();
  return accessControl.canAccess(resource, action);
}

/**
 * Get user's facility IDs for data filtering
 */
export async function getUserFacilityIds(): Promise<string[]> {
  const user = await getUserWithFacilities();
  return user.facilities.map((f) => f.id);
}

/**
 * Check if user has access to a specific facility
 */
export async function canAccessFacility(facilityId: string): Promise<boolean> {
  const facilityIds = await getUserFacilityIds();
  const user = await getCurrentUser();

  // Admins and owners can access all facilities
  if (user?.role === Role.ADMIN || user?.role === Role.OWNER) {
    return true;
  }

  return facilityIds.includes(facilityId);
}
