"use client";

import { GridLayout } from "@/components/layout";
import { DashboardCard, DashboardMetric } from "./DashboardCard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import { cn } from "@/lib/utils";

interface MetricsGridProps {
  metrics: DashboardMetric[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  colsMd?: 1 | 2 | 3 | 4;
  colsLg?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  cardVariant?: "default" | "compact" | "detailed";
  cardSize?: "sm" | "md" | "lg";
}

export function MetricsGrid({
  metrics,
  isLoading = false,
  error = null,
  onRetry,
  className,
  cols = 1,
  colsMd = 2,
  colsLg = 3,
  gap = "md",
  cardVariant = "default",
  cardSize = "md",
}: MetricsGridProps) {
  if (isLoading) {
    return (
      <GridLayout
        cols={cols}
        colsMd={colsMd}
        colsLg={colsLg}
        gap={gap}
        className={className}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} contentLines={2} />
        ))}
      </GridLayout>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[200px]",
          className
        )}
      >
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Failed to load metrics</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[200px]",
          className
        )}
      >
        <p className="text-muted-foreground">No metrics available</p>
      </div>
    );
  }

  return (
    <GridLayout
      cols={cols}
      colsMd={colsMd}
      colsLg={colsLg}
      gap={gap}
      className={className}
    >
      {metrics.map((metric) => (
        <ComponentErrorBoundary key={metric.id}>
          <DashboardCard
            metric={metric}
            variant={cardVariant}
            size={cardSize}
          />
        </ComponentErrorBoundary>
      ))}
    </GridLayout>
  );
}

// Specialized grids for different dashboard sections

interface KPIGridProps {
  metrics: DashboardMetric[];
  isLoading?: boolean;
  className?: string;
}

export function KPIGrid({ metrics, isLoading, className }: KPIGridProps) {
  return (
    <MetricsGrid
      metrics={metrics}
      isLoading={isLoading}
      cols={2}
      colsMd={4}
      colsLg={4}
      gap="md"
      cardVariant="compact"
      className={className}
    />
  );
}

interface DetailedMetricsGridProps {
  metrics: DashboardMetric[];
  isLoading?: boolean;
  className?: string;
}

export function DetailedMetricsGrid({
  metrics,
  isLoading,
  className,
}: DetailedMetricsGridProps) {
  return (
    <MetricsGrid
      metrics={metrics}
      isLoading={isLoading}
      cols={1}
      colsMd={2}
      colsLg={3}
      gap="lg"
      cardVariant="detailed"
      cardSize="lg"
      className={className}
    />
  );
}

interface AlertsGridProps {
  alerts: DashboardMetric[];
  isLoading?: boolean;
  className?: string;
}

export function AlertsGrid({ alerts, isLoading, className }: AlertsGridProps) {
  // Filter only metrics that have alerts
  const alertMetrics = alerts.filter((metric) => metric.alert);

  if (alertMetrics.length === 0 && !isLoading) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-muted-foreground">No alerts at this time</p>
        <p className="text-xs text-muted-foreground mt-1">
          All systems are running normally
        </p>
      </div>
    );
  }

  return (
    <MetricsGrid
      metrics={alertMetrics}
      isLoading={isLoading}
      cols={1}
      colsMd={1}
      colsLg={2}
      gap="md"
      cardVariant="default"
      className={className}
    />
  );
}
