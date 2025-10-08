// Feature flag types and interfaces

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetUsers?: string[]; // Specific user IDs
  targetRoles?: string[]; // Specific roles
  environment?: "development" | "staging" | "production" | "all";
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  defaultEnabled: boolean;
  userId?: string;
  userRole?: string;
  environment: string;
}

export interface FeatureFlagContext {
  isEnabled: (flagKey: string) => boolean;
  getFlag: (flagKey: string) => FeatureFlag | null;
  getAllFlags: () => Record<string, FeatureFlag>;
  refresh: () => Promise<void>;
}

export interface RolloutStrategy {
  type: "percentage" | "user_list" | "role_based" | "date_range";
  config: {
    percentage?: number;
    userIds?: string[];
    roles?: string[];
    startDate?: Date;
    endDate?: Date;
  };
}

export interface FeatureFlagAnalytics {
  flagKey: string;
  userId: string;
  userRole: string;
  enabled: boolean;
  timestamp: Date;
  sessionId: string;
  metadata?: Record<string, any>;
}
