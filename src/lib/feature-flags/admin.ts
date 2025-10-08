// Admin interface for managing feature flags

import { FeatureFlagManager } from "./core";
import { FeatureFlag, FeatureFlagAnalytics } from "./types";

export interface FeatureFlagAdminConfig {
  manager: FeatureFlagManager;
  allowedRoles: string[];
  apiEndpoint?: string;
}

export class FeatureFlagAdmin {
  private manager: FeatureFlagManager;
  private allowedRoles: string[];
  private apiEndpoint?: string;

  constructor(config: FeatureFlagAdminConfig) {
    this.manager = config.manager;
    this.allowedRoles = config.allowedRoles;
    this.apiEndpoint = config.apiEndpoint;
  }

  /**
   * Check if user has admin access
   */
  hasAdminAccess(userRole: string): boolean {
    return this.allowedRoles.includes(userRole);
  }

  /**
   * Get all feature flags with their current status
   */
  getAllFlagsWithStatus(
    userId: string
  ): Array<FeatureFlag & { currentlyEnabled: boolean }> {
    const flags = this.manager.getAllFlags();

    return Object.values(flags).map((flag) => ({
      ...flag,
      currentlyEnabled: this.manager.isEnabled(flag.key),
    }));
  }

  /**
   * Update a feature flag
   */
  async updateFlag(
    flagKey: string,
    updates: Partial<FeatureFlag>,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate updates
      if (updates.rolloutPercentage !== undefined) {
        if (updates.rolloutPercentage < 0 || updates.rolloutPercentage > 100) {
          return {
            success: false,
            error: "Rollout percentage must be between 0 and 100",
          };
        }
      }

      // Apply updates
      this.manager.updateFlag(flagKey, updates);

      // Log the change
      await this.logFlagChange(flagKey, updates, adminUserId);

      // Sync with API if configured
      if (this.apiEndpoint) {
        await this.syncWithAPI(flagKey, updates);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Gradually increase rollout percentage
   */
  async gradualRollout(
    flagKey: string,
    targetPercentage: number,
    incrementPercentage: number = 10,
    intervalMinutes: number = 30,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const flag = this.manager.getFlag(flagKey);
      if (!flag) {
        return { success: false, error: "Feature flag not found" };
      }

      const currentPercentage = flag.rolloutPercentage;

      if (currentPercentage >= targetPercentage) {
        return {
          success: false,
          error: "Current rollout is already at or above target",
        };
      }

      // Schedule gradual increases
      let nextPercentage = Math.min(
        currentPercentage + incrementPercentage,
        targetPercentage
      );

      const scheduleNext = async () => {
        await this.updateFlag(
          flagKey,
          { rolloutPercentage: nextPercentage },
          adminUserId
        );

        if (nextPercentage < targetPercentage) {
          nextPercentage = Math.min(
            nextPercentage + incrementPercentage,
            targetPercentage
          );
          setTimeout(scheduleNext, intervalMinutes * 60 * 1000);
        }
      };

      // Start the rollout
      setTimeout(scheduleNext, intervalMinutes * 60 * 1000);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Emergency disable a feature flag
   */
  async emergencyDisable(
    flagKey: string,
    reason: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateFlag(
        flagKey,
        {
          enabled: false,
          rolloutPercentage: 0,
          metadata: {
            emergencyDisabled: true,
            disableReason: reason,
            disabledBy: adminUserId,
            disabledAt: new Date().toISOString(),
          },
        },
        adminUserId
      );

      // Send alert notification
      await this.sendEmergencyAlert(flagKey, reason, adminUserId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get feature flag analytics
   */
  getAnalytics(flagKey?: string): FeatureFlagAnalytics[] {
    const analytics = this.manager.getAnalytics();

    if (flagKey) {
      return analytics.filter((entry) => entry.flagKey === flagKey);
    }

    return analytics;
  }

  /**
   * Get rollout statistics
   */
  getRolloutStats(flagKey: string): {
    totalUsers: number;
    enabledUsers: number;
    rolloutPercentage: number;
    actualPercentage: number;
  } {
    const analytics = this.getAnalytics(flagKey);
    const totalUsers = new Set(analytics.map((entry) => entry.userId)).size;
    const enabledUsers = new Set(
      analytics.filter((entry) => entry.enabled).map((entry) => entry.userId)
    ).size;

    const flag = this.manager.getFlag(flagKey);
    const rolloutPercentage = flag?.rolloutPercentage || 0;
    const actualPercentage =
      totalUsers > 0 ? (enabledUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      enabledUsers,
      rolloutPercentage,
      actualPercentage,
    };
  }

  /**
   * Export feature flag configuration
   */
  exportConfig(): string {
    const flags = this.manager.getAllFlags();
    return JSON.stringify(flags, null, 2);
  }

  /**
   * Import feature flag configuration
   */
  async importConfig(
    configJson: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string; imported: number }> {
    try {
      const config = JSON.parse(configJson);
      let imported = 0;

      for (const [flagKey, flagData] of Object.entries(config)) {
        if (this.isValidFlag(flagData)) {
          this.manager.updateFlag(flagKey, flagData as Partial<FeatureFlag>);
          imported++;
        }
      }

      await this.logFlagChange("BULK_IMPORT", { imported }, adminUserId);

      return { success: true, imported };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Invalid JSON configuration",
        imported: 0,
      };
    }
  }

  /**
   * Validate flag data
   */
  private isValidFlag(flagData: any): boolean {
    return (
      typeof flagData === "object" &&
      typeof flagData.key === "string" &&
      typeof flagData.name === "string" &&
      typeof flagData.enabled === "boolean" &&
      typeof flagData.rolloutPercentage === "number" &&
      flagData.rolloutPercentage >= 0 &&
      flagData.rolloutPercentage <= 100
    );
  }

  /**
   * Log feature flag changes
   */
  private async logFlagChange(
    flagKey: string,
    changes: any,
    adminUserId: string
  ): Promise<void> {
    const logEntry = {
      flagKey,
      changes,
      adminUserId,
      timestamp: new Date().toISOString(),
    };

    // In a real implementation, this would send to a logging service
    console.log("Feature flag change:", logEntry);

    // Store in localStorage for demo purposes
    if (typeof window !== "undefined") {
      const logs = JSON.parse(localStorage.getItem("ff_admin_logs") || "[]");
      logs.push(logEntry);
      localStorage.setItem("ff_admin_logs", JSON.stringify(logs.slice(-100))); // Keep last 100 logs
    }
  }

  /**
   * Send emergency alert
   */
  private async sendEmergencyAlert(
    flagKey: string,
    reason: string,
    adminUserId: string
  ): Promise<void> {
    // In a real implementation, this would send alerts via email, Slack, etc.
    console.warn(
      `EMERGENCY: Feature flag ${flagKey} disabled by ${adminUserId}. Reason: ${reason}`
    );
  }

  /**
   * Sync with external API
   */
  private async syncWithAPI(
    flagKey: string,
    updates: Partial<FeatureFlag>
  ): Promise<void> {
    if (!this.apiEndpoint) return;

    try {
      await fetch(`${this.apiEndpoint}/flags/${flagKey}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to sync with API:", error);
      // Don't throw - local changes should still work even if API sync fails
    }
  }
}
