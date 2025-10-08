// Next.js middleware integration for feature flags

import { NextRequest, NextResponse } from "next/server";
import { getFeatureFlagManager } from "./core";

export interface FeatureFlagMiddlewareConfig {
  flags: Array<{
    key: string;
    redirectTo?: string;
    allowedRoles?: string[];
    requiredFlags?: string[];
  }>;
  getUserContext?: (request: NextRequest) => Promise<{
    userId: string;
    userRole: string;
  } | null>;
}

/**
 * Middleware to handle feature flag-based routing
 */
export function createFeatureFlagMiddleware(
  config: FeatureFlagMiddlewareConfig
) {
  return async function featureFlagMiddleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Get user context
    const userContext = config.getUserContext
      ? await config.getUserContext(request)
      : null;

    if (!userContext) {
      // If no user context, allow request to continue
      return NextResponse.next();
    }

    // Initialize feature flag manager with user context
    const manager = getFeatureFlagManager();
    manager.setUserContext(userContext.userId, userContext.userRole);

    // Check each configured flag
    for (const flagConfig of config.flags) {
      const shouldApplyToPath = pathname.startsWith(
        `/${flagConfig.key.toLowerCase()}`
      );

      if (shouldApplyToPath) {
        // Check if user has required role
        if (
          flagConfig.allowedRoles &&
          !flagConfig.allowedRoles.includes(userContext.userRole)
        ) {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }

        // Check if required flags are enabled
        if (flagConfig.requiredFlags) {
          const allFlagsEnabled = flagConfig.requiredFlags.every((flag) =>
            manager.isEnabled(flag)
          );

          if (!allFlagsEnabled) {
            const redirectUrl = flagConfig.redirectTo || "/";
            return NextResponse.redirect(new URL(redirectUrl, request.url));
          }
        }

        // Check if main flag is enabled
        if (!manager.isEnabled(flagConfig.key)) {
          const redirectUrl = flagConfig.redirectTo || "/";
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      }
    }

    return NextResponse.next();
  };
}

/**
 * Server-side feature flag checking
 */
export async function checkFeatureFlagOnServer(
  flagKey: string,
  userContext: { userId: string; userRole: string }
): Promise<boolean> {
  const manager = getFeatureFlagManager();
  manager.setUserContext(userContext.userId, userContext.userRole);
  return manager.isEnabled(flagKey);
}

/**
 * Add feature flag headers to response
 */
export function addFeatureFlagHeaders(
  response: NextResponse,
  enabledFlags: string[]
): NextResponse {
  response.headers.set("X-Feature-Flags", enabledFlags.join(","));
  return response;
}
