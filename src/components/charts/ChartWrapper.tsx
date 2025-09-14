"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import { AlertCircle, RefreshCw, Download, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChartWrapperProps {
  title?: string;
  description?: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
  height?: number;
  className?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: "default" | "outline" | "ghost";
  }>;
}

export function ChartWrapper({
  title,
  description,
  children,
  isLoading = false,
  error = null,
  onRetry,
  onExport,
  onFullscreen,
  height = 300,
  className,
  badge,
  actions = [],
}: ChartWrapperProps) {
  // Default actions
  const defaultActions = [];

  if (onExport) {
    defaultActions.push({
      label: "Export",
      onClick: onExport,
      icon: Download,
      variant: "outline" as const,
    });
  }

  if (onFullscreen) {
    defaultActions.push({
      label: "Fullscreen",
      onClick: onFullscreen,
      icon: Maximize2,
      variant: "outline" as const,
    });
  }

  const allActions = [...defaultActions, ...actions];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="animate-pulse bg-muted rounded-md"
            style={{ height }}
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center space-y-4"
            style={{ height }}
          >
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Failed to load chart</p>
              <p className="text-xs text-muted-foreground">
                {error.message ||
                  "An error occurred while loading the chart data"}
              </p>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && <CardTitle className="text-lg">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center space-x-2">
            {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
            {allActions.length > 0 && (
              <div className="flex space-x-1">
                {allActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      size="sm"
                      onClick={action.onClick}
                      className="h-8 w-8 p-0"
                      title={action.label}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ComponentErrorBoundary>
          <div className="w-full" style={{ height: height || 300 }}>
            {children}
          </div>
        </ComponentErrorBoundary>
      </CardContent>
    </Card>
  );
}

// Responsive chart container that handles different screen sizes
export function ResponsiveChartContainer({
  children,
  height = 300,
  minHeight = 200,
  className,
}: {
  children: ReactNode;
  height?: number;
  minHeight?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("w-full", className)}
      style={{
        height: `${height}px`,
        minHeight: `${minHeight}px`,
      }}
    >
      {children}
    </div>
  );
}
