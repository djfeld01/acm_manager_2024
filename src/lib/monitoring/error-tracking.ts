// Error tracking and reporting system

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
  featureFlags?: Record<string, boolean>;
}

export interface PerformanceMetrics {
  url: string;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timestamp: string;
  userId?: string;
  userRole?: string;
  deviceType: "mobile" | "tablet" | "desktop";
  connection?: string;
}

class ErrorTracker {
  private apiEndpoint: string;
  private userId?: string;
  private userRole?: string;
  private featureFlags: Record<string, boolean> = {};
  private isEnabled: boolean = true;

  constructor(
    config: {
      apiEndpoint?: string;
      userId?: string;
      userRole?: string;
      enabled?: boolean;
    } = {}
  ) {
    this.apiEndpoint = config.apiEndpoint || "/api/monitoring/errors";
    this.userId = config.userId;
    this.userRole = config.userRole;
    this.isEnabled = config.enabled ?? true;

    if (typeof window !== "undefined" && this.isEnabled) {
      this.setupGlobalErrorHandlers();
      this.setupUnhandledRejectionHandler();
    }
  }

  setUserContext(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
  }

  setFeatureFlags(flags: Record<string, boolean>) {
    this.featureFlags = flags;
  }

  async reportError(
    error: Error | string,
    severity: ErrorReport["severity"] = "medium",
    context?: Record<string, any>
  ) {
    if (!this.isEnabled) return;

    try {
      const errorReport: ErrorReport = {
        message: typeof error === "string" ? error : error.message,
        stack: typeof error === "object" ? error.stack : undefined,
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        userId: this.userId,
        userRole: this.userRole,
        timestamp: new Date().toISOString(),
        severity,
        context,
        featureFlags: this.featureFlags,
      };

      // Send to monitoring service
      await this.sendErrorReport(errorReport);

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error tracked:", errorReport);
      }
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
    }
  }

  private async sendErrorReport(report: ErrorReport) {
    try {
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      // Store in localStorage as fallback
      this.storeErrorLocally(report);
    }
  }

  private storeErrorLocally(report: ErrorReport) {
    if (typeof window === "undefined") return;

    try {
      const stored = JSON.parse(localStorage.getItem("error_reports") || "[]");
      stored.push(report);

      // Keep only last 50 errors
      const trimmed = stored.slice(-50);
      localStorage.setItem("error_reports", JSON.stringify(trimmed));
    } catch (error) {
      console.error("Failed to store error locally:", error);
    }
  }

  private setupGlobalErrorHandlers() {
    window.addEventListener("error", (event) => {
      this.reportError(event.error || event.message, "high", {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.reportError(event.reason, "high", {
        type: "unhandledrejection",
      });
    });
  }

  private setupUnhandledRejectionHandler() {
    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", (event) => {
        this.reportError(
          `Unhandled Promise Rejection: ${event.reason}`,
          "high",
          { type: "promise_rejection" }
        );
      });
    }
  }

  // Get stored errors for debugging
  getStoredErrors(): ErrorReport[] {
    if (typeof window === "undefined") return [];

    try {
      return JSON.parse(localStorage.getItem("error_reports") || "[]");
    } catch {
      return [];
    }
  }

  // Clear stored errors
  clearStoredErrors() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("error_reports");
    }
  }
}

class PerformanceMonitor {
  private apiEndpoint: string;
  private userId?: string;
  private userRole?: string;
  private isEnabled: boolean = true;

  constructor(
    config: {
      apiEndpoint?: string;
      userId?: string;
      userRole?: string;
      enabled?: boolean;
    } = {}
  ) {
    this.apiEndpoint = config.apiEndpoint || "/api/monitoring/performance";
    this.userId = config.userId;
    this.userRole = config.userRole;
    this.isEnabled = config.enabled ?? true;

    if (typeof window !== "undefined" && this.isEnabled) {
      this.setupPerformanceObserver();
    }
  }

  setUserContext(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
  }

  async reportPageLoad() {
    if (!this.isEnabled || typeof window === "undefined") return;

    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType("paint");

      const fcp =
        paintEntries.find((entry) => entry.name === "first-contentful-paint")
          ?.startTime || 0;

      const metrics: PerformanceMetrics = {
        url: window.location.href,
        loadTime: navigation
          ? navigation.loadEventEnd - navigation.fetchStart
          : 0,
        firstContentfulPaint: fcp,
        largestContentfulPaint: 0, // Will be updated by observer
        firstInputDelay: 0, // Will be updated by observer
        cumulativeLayoutShift: 0, // Will be updated by observer
        timestamp: new Date().toISOString(),
        userId: this.userId,
        userRole: this.userRole,
        deviceType: this.getDeviceType(),
        connection: this.getConnectionType(),
      };

      await this.sendPerformanceMetrics(metrics);
    } catch (error) {
      console.error("Failed to report page load metrics:", error);
    }
  }

  private setupPerformanceObserver() {
    if (!("PerformanceObserver" in window)) return;

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.updateMetric("largestContentfulPaint", lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch (error) {
      console.warn("LCP observer not supported");
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.updateMetric(
            "firstInputDelay",
            entry.processingStart - entry.startTime
          );
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch (error) {
      console.warn("FID observer not supported");
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.updateMetric("cumulativeLayoutShift", clsValue);
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      console.warn("CLS observer not supported");
    }
  }

  private updateMetric(metric: keyof PerformanceMetrics, value: number) {
    // Store metric for later reporting
    if (typeof window !== "undefined") {
      const stored = JSON.parse(sessionStorage.getItem("perf_metrics") || "{}");
      stored[metric] = value;
      sessionStorage.setItem("perf_metrics", JSON.stringify(stored));
    }
  }

  private async sendPerformanceMetrics(metrics: PerformanceMetrics) {
    try {
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metrics),
      });
    } catch (error) {
      console.error("Failed to send performance metrics:", error);
    }
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  private getConnectionType(): string {
    if (typeof navigator === "undefined") return "unknown";

    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    return connection?.effectiveType || "unknown";
  }
}

// Global instances
export const errorTracker = new ErrorTracker({
  enabled: process.env.NODE_ENV === "production",
});

export const performanceMonitor = new PerformanceMonitor({
  enabled: process.env.NODE_ENV === "production",
});

// React Error Boundary integration
export function reportReactError(error: Error, errorInfo: any) {
  errorTracker.reportError(error, "high", {
    componentStack: errorInfo.componentStack,
    type: "react_error",
  });
}

// Feature flag integration
export function initializeMonitoring(
  userId: string,
  userRole: string,
  featureFlags: Record<string, boolean>
) {
  errorTracker.setUserContext(userId, userRole);
  errorTracker.setFeatureFlags(featureFlags);
  performanceMonitor.setUserContext(userId, userRole);
}
