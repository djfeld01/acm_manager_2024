import { ReactNode } from "react";
import { Role } from "@/db/schema/user";
import { requireAuth, requireRole, requireRouteAccess } from "./utils";

interface PageAuthWrapperProps {
  children: ReactNode;
  requireAuthentication?: boolean;
  allowedRoles?: Role | Role[];
  route?: string;
}

/**
 * Server-side authentication wrapper for pages
 * Use this in page components to enforce authentication and authorization
 */
export async function PageAuthWrapper({
  children,
  requireAuthentication = true,
  allowedRoles,
  route,
}: PageAuthWrapperProps) {
  // Check authentication
  if (requireAuthentication) {
    await requireAuth();
  }

  // Check role-based access
  if (allowedRoles) {
    await requireRole(allowedRoles);
  }

  // Check route-based access
  if (route) {
    await requireRouteAccess(route);
  }

  return <>{children}</>;
}

/**
 * Higher-order function to create authenticated page components
 */
export function withAuth<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options: Omit<PageAuthWrapperProps, "children"> = {}
) {
  return async function AuthenticatedPage(props: T) {
    return (
      <PageAuthWrapper {...options}>
        <Component {...props} />
      </PageAuthWrapper>
    );
  };
}

/**
 * Higher-order function to create role-protected page components
 */
export function withRole<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  allowedRoles: Role | Role[]
) {
  return withAuth(Component, { allowedRoles });
}

/**
 * Higher-order function to create route-protected page components
 */
export function withRouteAuth<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  route: string
) {
  return withAuth(Component, { route });
}
