"use server";

// Server actions for feature flag management

import { revalidatePath } from "next/cache";
import { FeatureFlagAdmin } from "./admin";
import { getFeatureFlagManager } from "./core";
import { FeatureFlag } from "./types";

export interface UpdateFlagResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to update a feature flag
 */
export async function updateFeatureFlagAction(
  flagKey: string,
  updates: Partial<FeatureFlag>,
  adminUserId: string,
  adminUserRole: string
): Promise<UpdateFlagResult> {
  try {
    const manager = getFeatureFlagManager();
    const admin = new FeatureFlagAdmin({
      manager,
      allowedRoles: ["admin", "super_admin"],
    });

    // Check admin permissions
    if (!admin.hasAdminAccess(adminUserRole)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Update the flag
    const result = await admin.updateFlag(flagKey, updates, adminUserId);

    if (result.success) {
      // Revalidate relevant pages
      revalidatePath("/feature-flags-demo");
      revalidatePath("/admin");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server action to emergency disable a feature flag
 */
export async function emergencyDisableFlagAction(
  flagKey: string,
  reason: string,
  adminUserId: string,
  adminUserRole: string
): Promise<UpdateFlagResult> {
  try {
    const manager = getFeatureFlagManager();
    const admin = new FeatureFlagAdmin({
      manager,
      allowedRoles: ["admin", "super_admin"],
    });

    // Check admin permissions
    if (!admin.hasAdminAccess(adminUserRole)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Emergency disable
    const result = await admin.emergencyDisable(flagKey, reason, adminUserId);

    if (result.success) {
      // Revalidate all pages since this is an emergency action
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server action to start gradual rollout
 */
export async function startGradualRolloutAction(
  flagKey: string,
  targetPercentage: number,
  incrementPercentage: number,
  intervalMinutes: number,
  adminUserId: string,
  adminUserRole: string
): Promise<UpdateFlagResult> {
  try {
    const manager = getFeatureFlagManager();
    const admin = new FeatureFlagAdmin({
      manager,
      allowedRoles: ["admin", "super_admin"],
    });

    // Check admin permissions
    if (!admin.hasAdminAccess(adminUserRole)) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Start gradual rollout
    const result = await admin.gradualRollout(
      flagKey,
      targetPercentage,
      incrementPercentage,
      intervalMinutes,
      adminUserId
    );

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server action to get feature flag analytics
 */
export async function getFeatureFlagAnalyticsAction(
  adminUserRole: string,
  flagKey?: string
) {
  try {
    const manager = getFeatureFlagManager();
    const admin = new FeatureFlagAdmin({
      manager,
      allowedRoles: ["admin", "super_admin"],
    });

    // Check admin permissions
    if (!admin.hasAdminAccess(adminUserRole)) {
      return { success: false, error: "Insufficient permissions", data: [] };
    }

    const analytics = admin.getAnalytics(flagKey);
    return { success: true, data: analytics };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [],
    };
  }
}
