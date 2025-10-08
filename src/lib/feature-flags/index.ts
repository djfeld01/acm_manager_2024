// Feature flags main export file

export * from "./types";
export * from "./config";
export * from "./core";
export * from "./hooks";
export * from "./admin";

// Convenience exports
export { getFeatureFlagManager, initializeFeatureFlags } from "./core";
export {
  useFeatureFlag,
  useFeatureFlagDetails,
  useAllFeatureFlags,
  useFeatureFlagManager,
  FeatureFlagProvider,
  FeatureFlagGate,
  MultiFeatureFlagGate,
  withFeatureFlag,
} from "./hooks";
export { FeatureFlagAdmin } from "./admin";

// Common feature flag keys for easy import
export const FEATURE_FLAG_KEYS = {
  NEW_FRONTEND: "NEW_FRONTEND",
  NEW_NAVIGATION: "NEW_NAVIGATION",
  NEW_DASHBOARD: "NEW_DASHBOARD",
  NEW_PAYROLL_INTERFACE: "NEW_PAYROLL_INTERFACE",
  MOBILE_OPTIMIZATIONS: "MOBILE_OPTIMIZATIONS",
  PERFORMANCE_FEATURES: "PERFORMANCE_FEATURES",
  BETA_FEATURES: "BETA_FEATURES",
} as const;
