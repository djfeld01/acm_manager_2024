"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Role } from "@/db/schema/user";
import { useHasRole, useCanAccessRoute } from "./hooks";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Component that requires authentication
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = "/auth/signin",
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push(redirectTo);
    }
  }, [session, status, router, redirectTo]);

  if (status === "loading") {
    return fallback || <div>Loading...</div>;
  }

  if (!session?.user) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface RoleGuardProps extends AuthGuardProps {
  allowedRoles: Role | Role[];
}

/**
 * Component that requires specific roles
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = "/unauthorized",
}: RoleGuardProps) {
  const hasRequiredRole = useHasRole(allowedRoles);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (!hasRequiredRole) {
      router.push(redirectTo);
    }
  }, [session, status, hasRequiredRole, router, redirectTo]);

  if (status === "loading") {
    return fallback || <div>Loading...</div>;
  }

  if (!session?.user || !hasRequiredRole) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface RouteGuardProps extends AuthGuardProps {
  route: string;
}

/**
 * Component that checks route-based permissions
 */
export function RouteGuard({
  children,
  route,
  fallback,
  redirectTo = "/unauthorized",
}: RouteGuardProps) {
  const canAccess = useCanAccessRoute(route);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    if (!canAccess) {
      router.push(redirectTo);
    }
  }, [session, status, canAccess, router, redirectTo]);

  if (status === "loading") {
    return fallback || <div>Loading...</div>;
  }

  if (!session?.user || !canAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}

interface ConditionalRenderProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Utility component for conditional rendering based on permissions
 */
export function ConditionalRender({
  condition,
  children,
  fallback,
}: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that renders children only if user has required role
 */
export function RoleBasedRender({
  allowedRoles,
  children,
  fallback,
}: RoleGuardProps) {
  const hasRequiredRole = useHasRole(allowedRoles);
  const { status } = useSession();

  if (status === "loading") {
    return fallback || null;
  }

  return (
    <ConditionalRender condition={hasRequiredRole} fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}

/**
 * Component that renders children only if user can access route
 */
export function RouteBasedRender({
  route,
  children,
  fallback,
}: RouteGuardProps) {
  const canAccess = useCanAccessRoute(route);
  const { status } = useSession();

  if (status === "loading") {
    return fallback || null;
  }

  return (
    <ConditionalRender condition={canAccess} fallback={fallback}>
      {children}
    </ConditionalRender>
  );
}
