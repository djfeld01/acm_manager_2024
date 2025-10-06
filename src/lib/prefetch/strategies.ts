"use client";

import { prefetch, cacheUtils } from "@/lib/cache/clientCache";
import { preloadUtils } from "@/lib/cache/serverCache";

// Prefetch strategy configuration
export interface PrefetchStrategy {
  name: string;
  priority: "critical" | "high" | "normal" | "low";
  condition: () => boolean;
  execute: () => Promise<void>;
  delay?: number;
}

// Route-based prefetching strategies
export const routePrefetchStrategies: Record<string, PrefetchStrategy[]> = {
  "/dashboard": [
    {
      name: "dashboard-critical",
      priority: "critical",
      condition: () => true,
      execute: async () => {
        await Promise.all([
          prefetch("user-profile", () =>
            fetch("/api/user/profile").then((r) => r.json())
          ),
          prefetch("dashboard-stats", () =>
            fetch("/api/dashboard/stats").then((r) => r.json())
          ),
        ]);
      },
    },
    {
      name: "dashboard-secondary",
      priority: "high",
      condition: () => true,
      delay: 100,
      execute: async () => {
        await Promise.all([
          prefetch("recent-locations", () =>
            fetch("/api/locations?limit=5").then((r) => r.json())
          ),
          prefetch("recent-activity", () =>
            fetch("/api/dashboard/activity").then((r) => r.json())
          ),
        ]);
      },
    },
    {
      name: "dashboard-tertiary",
      priority: "normal",
      condition: () => true,
      delay: 500,
      execute: async () => {
        await prefetch("payroll-summary", () =>
          fetch("/api/payroll/summary").then((r) => r.json())
        );
      },
    },
  ],

  "/locations": [
    {
      name: "locations-list",
      priority: "critical",
      condition: () => true,
      execute: async () => {
        await prefetch("locations-page-1", () =>
          fetch("/api/locations?page=1&limit=20").then((r) => r.json())
        );
      },
    },
    {
      name: "locations-next-page",
      priority: "high",
      condition: () => true,
      delay: 200,
      execute: async () => {
        await prefetch("locations-page-2", () =>
          fetch("/api/locations?page=2&limit=20").then((r) => r.json())
        );
      },
    },
  ],

  "/locations/[id]": [
    {
      name: "location-details",
      priority: "critical",
      condition: () => true,
      execute: async () => {
        const locationId = window.location.pathname.split("/").pop();
        if (locationId) {
          await Promise.all([
            prefetch(`location-${locationId}`, () =>
              fetch(`/api/locations/${locationId}`).then((r) => r.json())
            ),
            prefetch(`location-${locationId}-metrics`, () =>
              fetch(`/api/locations/${locationId}/metrics`).then((r) =>
                r.json()
              )
            ),
          ]);
        }
      },
    },
  ],

  "/payroll": [
    {
      name: "payroll-summary",
      priority: "critical",
      condition: () => true,
      execute: async () => {
        await prefetch("payroll-current", () =>
          fetch("/api/payroll/current").then((r) => r.json())
        );
      },
    },
  ],
};

// User behavior-based prefetching
export class BehaviorBasedPrefetch {
  private interactionHistory: string[] = [];
  private patterns: Map<string, string[]> = new Map();
  private prefetchQueue: Set<string> = new Set();

  constructor() {
    this.loadPatterns();
  }

  // Track user navigation
  trackNavigation(path: string) {
    this.interactionHistory.push(path);

    // Keep only last 20 interactions
    if (this.interactionHistory.length > 20) {
      this.interactionHistory.shift();
    }

    this.updatePatterns();
    this.predictAndPrefetch();
  }

  // Update navigation patterns
  private updatePatterns() {
    if (this.interactionHistory.length < 2) return;

    const current = this.interactionHistory[this.interactionHistory.length - 1];
    const previous =
      this.interactionHistory[this.interactionHistory.length - 2];

    if (!this.patterns.has(previous)) {
      this.patterns.set(previous, []);
    }

    const nextRoutes = this.patterns.get(previous)!;
    if (!nextRoutes.includes(current)) {
      nextRoutes.push(current);
    }

    this.savePatterns();
  }

  // Predict and prefetch likely next routes
  private predictAndPrefetch() {
    const currentPath =
      this.interactionHistory[this.interactionHistory.length - 1];
    const predictions = this.patterns.get(currentPath) || [];

    predictions.forEach((route) => {
      if (!this.prefetchQueue.has(route)) {
        this.prefetchQueue.add(route);
        this.executePrefetchForRoute(route);

        // Remove from queue after timeout
        setTimeout(() => {
          this.prefetchQueue.delete(route);
        }, 30000);
      }
    });
  }

  // Execute prefetch strategies for a route
  private async executePrefetchForRoute(route: string) {
    const strategies = routePrefetchStrategies[route] || [];

    // Sort by priority
    const sortedStrategies = strategies.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const strategy of sortedStrategies) {
      if (strategy.condition()) {
        if (strategy.delay) {
          setTimeout(() => strategy.execute(), strategy.delay);
        } else {
          await strategy.execute();
        }
      }
    }
  }

  // Load patterns from localStorage
  private loadPatterns() {
    try {
      const stored = localStorage.getItem("navigation-patterns");
      if (stored) {
        const data = JSON.parse(stored);
        this.patterns = new Map(data);
      }
    } catch (error) {
      console.warn("Failed to load navigation patterns:", error);
    }
  }

  // Save patterns to localStorage
  private savePatterns() {
    try {
      const data = Array.from(this.patterns.entries());
      localStorage.setItem("navigation-patterns", JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save navigation patterns:", error);
    }
  }
}

// Time-based prefetching
export class TimeBasedPrefetch {
  private schedules: Map<string, NodeJS.Timeout> = new Map();

  // Schedule prefetch at specific times
  scheduleDaily(hour: number, minute: number, strategy: PrefetchStrategy) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      if (strategy.condition()) {
        strategy.execute();
      }
      // Reschedule for next day
      this.scheduleDaily(hour, minute, strategy);
    }, delay);

    this.schedules.set(strategy.name, timeout);
  }

  // Schedule prefetch during idle time
  scheduleIdle(strategy: PrefetchStrategy) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        if (strategy.condition()) {
          strategy.execute();
        }
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        if (strategy.condition()) {
          strategy.execute();
        }
      }, 100);
    }
  }

  // Clear all scheduled prefetches
  clearAll() {
    this.schedules.forEach((timeout) => clearTimeout(timeout));
    this.schedules.clear();
  }
}

// Network-aware prefetching
export class NetworkAwarePrefetch {
  private connection: any;

  constructor() {
    this.connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
  }

  // Check if network conditions are good for prefetching
  shouldPrefetch(): boolean {
    if (!this.connection) return true; // Default to true if no connection info

    // Don't prefetch on slow connections
    if (
      this.connection.effectiveType === "slow-2g" ||
      this.connection.effectiveType === "2g"
    ) {
      return false;
    }

    // Don't prefetch if user has data saver enabled
    if (this.connection.saveData) {
      return false;
    }

    // Don't prefetch on very slow connections
    if (this.connection.downlink < 1) {
      return false;
    }

    return true;
  }

  // Get prefetch priority based on network conditions
  getPrefetchPriority(): "high" | "normal" | "low" {
    if (!this.connection) return "normal";

    if (
      this.connection.effectiveType === "4g" &&
      this.connection.downlink > 10
    ) {
      return "high";
    }

    if (
      this.connection.effectiveType === "3g" ||
      this.connection.downlink > 5
    ) {
      return "normal";
    }

    return "low";
  }
}

// Main prefetch manager
export class PrefetchManager {
  private behaviorPrefetch: BehaviorBasedPrefetch;
  private timePrefetch: TimeBasedPrefetch;
  private networkPrefetch: NetworkAwarePrefetch;
  private isEnabled: boolean = true;

  constructor() {
    this.behaviorPrefetch = new BehaviorBasedPrefetch();
    this.timePrefetch = new TimeBasedPrefetch();
    this.networkPrefetch = new NetworkAwarePrefetch();

    this.setupEventListeners();
  }

  // Execute prefetch strategies for current route
  async prefetchForRoute(route: string) {
    if (!this.isEnabled || !this.networkPrefetch.shouldPrefetch()) {
      return;
    }

    const strategies = routePrefetchStrategies[route] || [];
    const priority = this.networkPrefetch.getPrefetchPriority();

    // Filter strategies based on network conditions
    const filteredStrategies = strategies.filter((strategy) => {
      if (priority === "low" && strategy.priority === "low") return false;
      if (
        priority === "normal" &&
        (strategy.priority === "low" || strategy.priority === "normal")
      )
        return true;
      if (priority === "high") return true;
      return strategy.priority === "critical";
    });

    // Execute strategies
    for (const strategy of filteredStrategies) {
      if (strategy.condition()) {
        if (strategy.delay) {
          setTimeout(() => strategy.execute(), strategy.delay);
        } else {
          await strategy.execute();
        }
      }
    }

    // Track for behavior-based prefetching
    this.behaviorPrefetch.trackNavigation(route);
  }

  // Setup event listeners
  private setupEventListeners() {
    // Listen for route changes
    if (typeof window !== "undefined") {
      // Handle browser back/forward
      window.addEventListener("popstate", () => {
        this.prefetchForRoute(window.location.pathname);
      });

      // Handle visibility changes
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          // Prefetch when user returns to tab
          this.prefetchForRoute(window.location.pathname);
        }
      });
    }
  }

  // Enable/disable prefetching
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Get prefetch statistics
  getStats() {
    return {
      enabled: this.isEnabled,
      networkConditions: {
        shouldPrefetch: this.networkPrefetch.shouldPrefetch(),
        priority: this.networkPrefetch.getPrefetchPriority(),
      },
      cacheStats: cacheUtils.getStats(),
    };
  }

  // Cleanup
  destroy() {
    this.timePrefetch.clearAll();
  }
}

// Global prefetch manager instance
export const prefetchManager = new PrefetchManager();
