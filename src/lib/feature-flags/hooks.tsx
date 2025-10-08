"use client";

// React hooks for feature flags

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { FeatureFlagManager, getFeatureFlagManager } from "./core";
import { FeatureFlag } from "./types";

// Feature flag context
const FeatureFlagContext = createContext<FeatureFlagManager | null>(null);

interface FeatureFlagProviderProps {
  children: ReactNode;
  userId?: string;
  userRole?: string;
  manager?: FeatureFlagManager;
}

export function FeatureFlagProvider({
  children,
  userId,
  userRole,
  manager,
}: FeatureFlagProviderProps) {
  const [flagManager] = useState(() => {
    const mgr = manager || getFeatureFlagManager();
    if (userId && userRole) {
      mgr.setUserContext(userId, userRole);
    }
    return mgr;
  });

  useEffect(() => {
    if (userId && userRole) {
      flagManager.setUserContext(userId, userRole);
    }
  }, [userId, userRole, flagManager]);

  return (
    <FeatureFlagContext.Provider value={flagManager}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(flagKey: string): boolean {
  const manager = useContext(FeatureFlagContext);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (manager) {
      const enabled = manager.isEnabled(flagKey);
      setIsEnabled(enabled);
    }
  }, [manager, flagKey]);

  if (!manager) {
    console.warn("useFeatureFlag must be used within a FeatureFlagProvider");
    return false;
  }

  return isEnabled;
}

/**
 * Hook to get a specific feature flag object
 */
export function useFeatureFlagDetails(flagKey: string): FeatureFlag | null {
  const manager = useContext(FeatureFlagContext);
  const [flag, setFlag] = useState<FeatureFlag | null>(null);

  useEffect(() => {
    if (manager) {
      const flagDetails = manager.getFlag(flagKey);
      setFlag(flagDetails);
    }
  }, [manager, flagKey]);

  return flag;
}

/**
 * Hook to get all feature flags
 */
export function useAllFeatureFlags(): Record<string, FeatureFlag> {
  const manager = useContext(FeatureFlagContext);
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});

  useEffect(() => {
    if (manager) {
      const allFlags = manager.getAllFlags();
      setFlags(allFlags);
    }
  }, [manager]);

  return flags;
}

/**
 * Hook for feature flag manager instance
 */
export function useFeatureFlagManager(): FeatureFlagManager | null {
  return useContext(FeatureFlagContext);
}

/**
 * Hook to check multiple feature flags at once
 */
export function useFeatureFlags(flagKeys: string[]): Record<string, boolean> {
  const manager = useContext(FeatureFlagContext);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (manager) {
      const flagStates = flagKeys.reduce((acc, key) => {
        acc[key] = manager.isEnabled(key);
        return acc;
      }, {} as Record<string, boolean>);
      setFlags(flagStates);
    }
  }, [manager, flagKeys]);

  return flags;
}

/**
 * Higher-order component for feature flag gating
 */
export function withFeatureFlag<P extends object>(
  flagKey: string,
  fallback?: ReactNode
) {
  return function FeatureFlagGate(Component: React.ComponentType<P>) {
    return function WrappedComponent(props: P) {
      const isEnabled = useFeatureFlag(flagKey);

      if (!isEnabled) {
        return <>{fallback}</>;
      }

      return <Component {...props} />;
    };
  };
}

/**
 * Component for conditional rendering based on feature flags
 */
interface FeatureFlagGateProps {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FeatureFlagGate({
  flag,
  fallback,
  children,
}: FeatureFlagGateProps) {
  const isEnabled = useFeatureFlag(flag);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component for rendering different content based on multiple flags
 */
interface MultiFeatureFlagGateProps {
  flags: Record<string, ReactNode>;
  fallback?: ReactNode;
  mode?: "any" | "all"; // 'any' = render if any flag is enabled, 'all' = render only if all flags are enabled
}

export function MultiFeatureFlagGate({
  flags,
  fallback,
  mode = "any",
}: MultiFeatureFlagGateProps) {
  const flagKeys = Object.keys(flags);
  const flagStates = useFeatureFlags(flagKeys);

  const enabledFlags = flagKeys.filter((key) => flagStates[key]);

  if (mode === "all" && enabledFlags.length !== flagKeys.length) {
    return <>{fallback}</>;
  }

  if (mode === "any" && enabledFlags.length === 0) {
    return <>{fallback}</>;
  }

  // Render content for the first enabled flag
  const firstEnabledFlag = enabledFlags[0];
  return <>{flags[firstEnabledFlag]}</>;
}
