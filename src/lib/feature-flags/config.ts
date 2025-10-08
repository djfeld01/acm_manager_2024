// Feature flag configuration

import { FeatureFlag } from "./types";

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Main frontend rebuild flag
  NEW_FRONTEND: {
    key: "NEW_FRONTEND",
    name: "New Frontend Interface",
    description: "Enable the rebuilt React frontend with modern UI components",
    enabled: true,
    rolloutPercentage: 0, // Start with 0% rollout
    targetUsers: [], // Can add specific beta users
    targetRoles: ["admin"], // Start with admins only
    environment: "all",
    metadata: {
      version: "2.0.0",
      priority: "high",
      team: "frontend",
    },
  },

  // Navigation system flag
  NEW_NAVIGATION: {
    key: "NEW_NAVIGATION",
    name: "New Navigation System",
    description: "Enable the new responsive navigation with role-based menus",
    enabled: true,
    rolloutPercentage: 10, // 10% rollout
    environment: "all",
    metadata: {
      component: "navigation",
      dependencies: ["NEW_FRONTEND"],
    },
  },

  // Dashboard system flag
  NEW_DASHBOARD: {
    key: "NEW_DASHBOARD",
    name: "New Dashboard System",
    description: "Enable the new role-based dashboard with enhanced metrics",
    enabled: true,
    rolloutPercentage: 5, // 5% rollout
    targetRoles: ["admin", "area_manager"],
    environment: "all",
    metadata: {
      component: "dashboard",
      dependencies: ["NEW_FRONTEND", "NEW_NAVIGATION"],
    },
  },

  // Payroll interface flag
  NEW_PAYROLL_INTERFACE: {
    key: "NEW_PAYROLL_INTERFACE",
    name: "New Payroll Interface",
    description: "Enable the enhanced payroll management interface",
    enabled: true,
    rolloutPercentage: 0, // Not rolled out yet
    targetRoles: ["admin", "area_manager"],
    environment: "all",
    metadata: {
      component: "payroll",
      dependencies: ["NEW_FRONTEND"],
      sensitive: true, // Mark as sensitive feature
    },
  },

  // Mobile optimizations flag
  MOBILE_OPTIMIZATIONS: {
    key: "MOBILE_OPTIMIZATIONS",
    name: "Mobile Optimizations",
    description: "Enable mobile-specific UI improvements and PWA features",
    enabled: true,
    rolloutPercentage: 25, // 25% rollout
    environment: "all",
    metadata: {
      component: "mobile",
      dependencies: ["NEW_FRONTEND"],
    },
  },

  // Performance features flag
  PERFORMANCE_FEATURES: {
    key: "PERFORMANCE_FEATURES",
    name: "Performance Features",
    description:
      "Enable advanced caching, prefetching, and optimization features",
    enabled: true,
    rolloutPercentage: 50, // 50% rollout
    environment: "all",
    metadata: {
      component: "performance",
      experimental: true,
    },
  },

  // Beta testing flag
  BETA_FEATURES: {
    key: "BETA_FEATURES",
    name: "Beta Features",
    description: "Enable experimental features for beta testing",
    enabled: false, // Disabled by default
    rolloutPercentage: 0,
    targetUsers: [], // Add specific beta testers
    environment: "all",
    metadata: {
      experimental: true,
      requiresOptIn: true,
    },
  },
};

// Environment-specific overrides
export const ENVIRONMENT_OVERRIDES = {
  development: {
    // Enable all features in development
    NEW_FRONTEND: { rolloutPercentage: 100 },
    NEW_NAVIGATION: { rolloutPercentage: 100 },
    NEW_DASHBOARD: { rolloutPercentage: 100 },
    NEW_PAYROLL_INTERFACE: { rolloutPercentage: 100 },
    MOBILE_OPTIMIZATIONS: { rolloutPercentage: 100 },
    PERFORMANCE_FEATURES: { rolloutPercentage: 100 },
    BETA_FEATURES: { enabled: true, rolloutPercentage: 100 },
  },
  staging: {
    // More conservative rollout in staging
    NEW_FRONTEND: { rolloutPercentage: 50 },
    NEW_NAVIGATION: { rolloutPercentage: 50 },
    NEW_DASHBOARD: { rolloutPercentage: 30 },
    NEW_PAYROLL_INTERFACE: { rolloutPercentage: 20 },
    MOBILE_OPTIMIZATIONS: { rolloutPercentage: 40 },
    PERFORMANCE_FEATURES: { rolloutPercentage: 60 },
    BETA_FEATURES: { enabled: true, rolloutPercentage: 10 },
  },
  production: {
    // Use configured rollout percentages in production
    // These can be overridden via admin interface or environment variables
  },
};

// Feature flag dependencies
export const FLAG_DEPENDENCIES: Record<string, string[]> = {
  NEW_NAVIGATION: ["NEW_FRONTEND"],
  NEW_DASHBOARD: ["NEW_FRONTEND", "NEW_NAVIGATION"],
  NEW_PAYROLL_INTERFACE: ["NEW_FRONTEND"],
  MOBILE_OPTIMIZATIONS: ["NEW_FRONTEND"],
  PERFORMANCE_FEATURES: [],
  BETA_FEATURES: ["NEW_FRONTEND"],
};
