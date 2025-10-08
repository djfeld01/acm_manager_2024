// Core feature flag functionality

import { FeatureFlag, FeatureFlagConfig, RolloutStrategy } from "./types";
import {
  FEATURE_FLAGS,
  ENVIRONMENT_OVERRIDES,
  FLAG_DEPENDENCIES,
} from "./config";

export class FeatureFlagManager {
  private config: FeatureFlagConfig;
  private cache: Map<string, boolean> = new Map();
  private analytics: Array<any> = [];

  constructor(config: Partial<FeatureFlagConfig> = {}) {
    this.config = {
      flags: { ...FEATURE_FLAGS },
      defaultEnabled: false,
      environment: process.env.NODE_ENV || "development",
      ...config,
    };

    this.applyEnvironmentOverrides();
  }

  /**
   * Check if a feature flag is enabled for the current user
   */
  isEnabled(flagKey: string): boolean {
    // Check cache first
    if (this.cache.has(flagKey)) {
      return this.cache.get(flagKey)!;
    }

    const flag = this.config.flags[flagKey];
    if (!flag) {
      console.warn(`Feature flag "${flagKey}" not found`);
      return this.config.defaultEnabled;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      this.cache.set(flagKey, false);
      this.trackUsage(flagKey, false);
      return false;
    }

    // Check dependencies
    if (!this.checkDependencies(flagKey)) {
      this.cache.set(flagKey, false);
      this.trackUsage(flagKey, false);
      return false;
    }

    // Check date range
    if (!this.isWithinDateRange(flag)) {
      this.cache.set(flagKey, false);
      this.trackUsage(flagKey, false);
      return false;
    }

    // Check environment
    if (
      flag.environment &&
      flag.environment !== "all" &&
      flag.environment !== this.config.environment
    ) {
      this.cache.set(flagKey, false);
      this.trackUsage(flagKey, false);
      return false;
    }

    // Check user-specific targeting
    if (flag.targetUsers && flag.targetUsers.length > 0) {
      const isTargetUser = Boolean(
        this.config.userId && flag.targetUsers.includes(this.config.userId)
      );
      this.cache.set(flagKey, isTargetUser);
      this.trackUsage(flagKey, isTargetUser);
      return isTargetUser;
    }

    // Check role-based targeting
    if (flag.targetRoles && flag.targetRoles.length > 0) {
      const hasTargetRole =
        this.config.userRole && flag.targetRoles.includes(this.config.userRole);
      if (!hasTargetRole) {
        this.cache.set(flagKey, false);
        this.trackUsage(flagKey, false);
        return false;
      }
    }

    // Check rollout percentage
    const isInRollout = this.isInRolloutPercentage(flag);
    this.cache.set(flagKey, isInRollout);
    this.trackUsage(flagKey, isInRollout);
    return isInRollout;
  }

  /**
   * Get a specific feature flag
   */
  getFlag(flagKey: string): FeatureFlag | null {
    return this.config.flags[flagKey] || null;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): Record<string, FeatureFlag> {
    return { ...this.config.flags };
  }

  /**
   * Update a feature flag
   */
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    if (this.config.flags[flagKey]) {
      this.config.flags[flagKey] = {
        ...this.config.flags[flagKey],
        ...updates,
      };
      this.clearCache(flagKey);
    }
  }

  /**
   * Set user context for flag evaluation
   */
  setUserContext(userId: string, userRole: string): void {
    this.config.userId = userId;
    this.config.userRole = userRole;
    this.clearCache();
  }

  /**
   * Clear cache for a specific flag or all flags
   */
  clearCache(flagKey?: string): void {
    if (flagKey) {
      this.cache.delete(flagKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get analytics data
   */
  getAnalytics(): Array<any> {
    return [...this.analytics];
  }

  /**
   * Clear analytics data
   */
  clearAnalytics(): void {
    this.analytics = [];
  }

  /**
   * Check if user is within rollout percentage
   */
  private isInRolloutPercentage(flag: FeatureFlag): boolean {
    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;

    // Use user ID for consistent rollout (same user always gets same result)
    const userId = this.config.userId || "anonymous";
    const hash = this.hashString(userId + flag.key);
    const percentage = hash % 100;

    return percentage < flag.rolloutPercentage;
  }

  /**
   * Check if current date is within flag's date range
   */
  private isWithinDateRange(flag: FeatureFlag): boolean {
    const now = new Date();

    if (flag.startDate && now < flag.startDate) {
      return false;
    }

    if (flag.endDate && now > flag.endDate) {
      return false;
    }

    return true;
  }

  /**
   * Check if all dependencies are enabled
   */
  private checkDependencies(flagKey: string): boolean {
    const dependencies = FLAG_DEPENDENCIES[flagKey] || [];
    return dependencies.every((dep) => this.isEnabled(dep));
  }

  /**
   * Apply environment-specific overrides
   */
  private applyEnvironmentOverrides(): void {
    const overrides =
      ENVIRONMENT_OVERRIDES[
        this.config.environment as keyof typeof ENVIRONMENT_OVERRIDES
      ];
    if (overrides) {
      Object.entries(overrides).forEach(([flagKey, override]) => {
        if (this.config.flags[flagKey]) {
          this.config.flags[flagKey] = {
            ...this.config.flags[flagKey],
            ...override,
          };
        }
      });
    }
  }

  /**
   * Track feature flag usage for analytics
   */
  private trackUsage(flagKey: string, enabled: boolean): void {
    this.analytics.push({
      flagKey,
      userId: this.config.userId || "anonymous",
      userRole: this.config.userRole || "unknown",
      enabled,
      timestamp: new Date(),
      sessionId: this.getSessionId(),
    });

    // Keep only last 1000 analytics entries
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
  }

  /**
   * Simple hash function for consistent rollout
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    if (typeof window !== "undefined") {
      let sessionId = sessionStorage.getItem("ff_session_id");
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem("ff_session_id", sessionId);
      }
      return sessionId;
    }
    return "server";
  }
}

// Global feature flag manager instance
let globalManager: FeatureFlagManager | null = null;

export function getFeatureFlagManager(): FeatureFlagManager {
  if (!globalManager) {
    globalManager = new FeatureFlagManager();
  }
  return globalManager;
}

export function initializeFeatureFlags(
  config?: Partial<FeatureFlagConfig>
): FeatureFlagManager {
  globalManager = new FeatureFlagManager(config);
  return globalManager;
}
