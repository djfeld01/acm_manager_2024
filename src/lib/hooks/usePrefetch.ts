"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { prefetch, globalCache } from "@/lib/cache/clientCache";

// Prefetch configuration
export interface PrefetchConfig {
  enabled?: boolean;
  delay?: number;
  priority?: "high" | "low";
  cache?: boolean;
}

// Hook for prefetching data on hover/focus
export function usePrefetchOnHover<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  config: PrefetchConfig = {}
) {
  const {
    enabled = true,
    delay = 100,
    priority = "low",
    cache: useCache = true,
  } = config;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const prefetchedRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (!enabled || prefetchedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      if (useCache) {
        prefetch(cacheKey, fetcher);
      } else {
        fetcher();
      }
      prefetchedRef.current = true;
    }, delay);
  }, [enabled, delay, cacheKey, fetcher, useCache]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (!enabled || prefetchedRef.current) return;

    if (useCache) {
      prefetch(cacheKey, fetcher);
    } else {
      fetcher();
    }
    prefetchedRef.current = true;
  }, [enabled, cacheKey, fetcher, useCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
  };
}

// Hook for prefetching routes
export function usePrefetchRoute(href: string, config: PrefetchConfig = {}) {
  const router = useRouter();
  const { enabled = true, delay = 100 } = config;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prefetchedRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (!enabled || prefetchedRef.current) return;

    timeoutRef.current = setTimeout(() => {
      router.prefetch(href);
      prefetchedRef.current = true;
    }, delay);
  }, [enabled, delay, href, router]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

// Hook for intersection-based prefetching
export function usePrefetchOnVisible<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  config: PrefetchConfig & { threshold?: number; rootMargin?: string } = {}
) {
  const {
    enabled = true,
    threshold = 0.1,
    rootMargin = "50px",
    cache: useCache = true,
  } = config;

  const elementRef = useRef<HTMLElement>(null);
  const prefetchedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !prefetchedRef.current) {
          if (useCache) {
            prefetch(cacheKey, fetcher);
          } else {
            fetcher();
          }
          prefetchedRef.current = true;
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, threshold, rootMargin, cacheKey, fetcher, useCache]);

  return elementRef;
}

// Hook for prefetching based on user behavior patterns
export function useSmartPrefetch() {
  const router = useRouter();
  const interactionHistory = useRef<string[]>([]);
  const prefetchQueue = useRef<Set<string>>(new Set());

  // Track user interactions
  const trackInteraction = useCallback(
    (path: string) => {
      interactionHistory.current.push(path);

      // Keep only last 10 interactions
      if (interactionHistory.current.length > 10) {
        interactionHistory.current.shift();
      }

      // Predict next likely routes based on patterns
      const predictions = predictNextRoutes(interactionHistory.current);

      // Prefetch predicted routes
      predictions.forEach((route) => {
        if (!prefetchQueue.current.has(route)) {
          prefetchQueue.current.add(route);
          router.prefetch(route);

          // Remove from queue after some time
          setTimeout(() => {
            prefetchQueue.current.delete(route);
          }, 30000); // 30 seconds
        }
      });
    },
    [router]
  );

  // Simple pattern prediction (can be enhanced with ML)
  const predictNextRoutes = (history: string[]): string[] => {
    const predictions: string[] = [];

    // Common patterns
    const patterns = [
      { from: "/dashboard", to: ["/locations", "/payroll"] },
      { from: "/locations", to: ["/locations/[id]"] },
      { from: "/payroll", to: ["/payroll/employee/[id]"] },
    ];

    const lastRoute = history[history.length - 1];

    patterns.forEach((pattern) => {
      if (lastRoute?.startsWith(pattern.from)) {
        predictions.push(...pattern.to);
      }
    });

    return predictions;
  };

  return { trackInteraction };
}

// Hook for prefetching critical resources
export function useCriticalResourcePrefetch() {
  const prefetchedResources = useRef<Set<string>>(new Set());

  const prefetchCriticalData = useCallback(
    async (resources: {
      userProfile?: string;
      locations?: string[];
      dashboard?: boolean;
    }) => {
      const promises: Promise<any>[] = [];

      // Prefetch user profile
      if (
        resources.userProfile &&
        !prefetchedResources.current.has(`user:${resources.userProfile}`)
      ) {
        promises.push(
          prefetch(`user:${resources.userProfile}`, async () => {
            // This would typically call your API
            const response = await fetch(`/api/users/${resources.userProfile}`);
            return response.json();
          })
        );
        prefetchedResources.current.add(`user:${resources.userProfile}`);
      }

      // Prefetch locations
      if (resources.locations) {
        resources.locations.forEach((locationId) => {
          if (!prefetchedResources.current.has(`location:${locationId}`)) {
            promises.push(
              prefetch(`location:${locationId}`, async () => {
                const response = await fetch(`/api/locations/${locationId}`);
                return response.json();
              })
            );
            prefetchedResources.current.add(`location:${locationId}`);
          }
        });
      }

      // Prefetch dashboard data
      if (
        resources.dashboard &&
        !prefetchedResources.current.has("dashboard")
      ) {
        promises.push(
          prefetch("dashboard", async () => {
            const response = await fetch("/api/dashboard");
            return response.json();
          })
        );
        prefetchedResources.current.add("dashboard");
      }

      await Promise.allSettled(promises);
    },
    []
  );

  return { prefetchCriticalData };
}

// Hook for background data refresh
export function useBackgroundRefresh<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  interval: number = 60000 // 1 minute default
) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  const startBackgroundRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (!isActiveRef.current) return;

      try {
        // Only refresh if data exists in cache (user is actively using it)
        const cached = globalCache.get(cacheKey);
        if (cached) {
          const freshData = await fetcher();
          globalCache.set(cacheKey, freshData);
        }
      } catch (error) {
        console.warn("Background refresh failed:", error);
      }
    }, interval);
  }, [fetcher, cacheKey, interval]);

  const stopBackgroundRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    isActiveRef.current = false;
  }, []);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
      } else {
        isActiveRef.current = true;
        startBackgroundRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startBackgroundRefresh();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopBackgroundRefresh();
    };
  }, [startBackgroundRefresh, stopBackgroundRefresh]);

  return {
    startBackgroundRefresh,
    stopBackgroundRefresh,
  };
}

// Utility for batch prefetching
export const batchPrefetch = {
  // Prefetch multiple resources with priority
  prefetchBatch: async (
    items: Array<{
      key: string;
      fetcher: () => Promise<any>;
      priority?: "high" | "low";
    }>
  ) => {
    // Sort by priority
    const highPriority = items.filter((item) => item.priority === "high");
    const lowPriority = items.filter((item) => item.priority !== "high");

    // Execute high priority first
    if (highPriority.length > 0) {
      await Promise.allSettled(
        highPriority.map((item) => prefetch(item.key, item.fetcher))
      );
    }

    // Then execute low priority with delay
    if (lowPriority.length > 0) {
      setTimeout(() => {
        Promise.allSettled(
          lowPriority.map((item) => prefetch(item.key, item.fetcher))
        );
      }, 100);
    }
  },

  // Prefetch based on route patterns
  prefetchRouteData: async (currentRoute: string) => {
    const routeDataMap: Record<
      string,
      Array<{ key: string; fetcher: () => Promise<any> }>
    > = {
      "/dashboard": [
        {
          key: "dashboard-stats",
          fetcher: () => fetch("/api/dashboard/stats").then((r) => r.json()),
        },
        {
          key: "recent-activity",
          fetcher: () => fetch("/api/dashboard/activity").then((r) => r.json()),
        },
      ],
      "/locations": [
        {
          key: "locations-list",
          fetcher: () => fetch("/api/locations").then((r) => r.json()),
        },
      ],
      "/payroll": [
        {
          key: "payroll-summary",
          fetcher: () => fetch("/api/payroll/summary").then((r) => r.json()),
        },
      ],
    };

    const dataToFetch = routeDataMap[currentRoute];
    if (dataToFetch) {
      await batchPrefetch.prefetchBatch(
        dataToFetch.map((item) => ({ ...item, priority: "high" as const }))
      );
    }
  },
};
