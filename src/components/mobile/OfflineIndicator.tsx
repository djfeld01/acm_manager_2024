"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOfflineStatus, useServiceWorker } from "@/lib/mobile/pwa";
import { useNetworkStatus } from "@/lib/mobile/device-detection";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export interface OfflineIndicatorProps {
  className?: string;
  showConnectionType?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function OfflineIndicator({
  className,
  showConnectionType = true,
  showRetryButton = true,
  onRetry,
}: OfflineIndicatorProps) {
  const { isOnline, wasOffline, offlineDuration } = useOfflineStatus();
  const { connectionType } = useNetworkStatus();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getConnectionText = () => {
    if (!isOnline) return "Offline";
    if (showConnectionType && connectionType && connectionType !== "unknown") {
      return `Online (${connectionType.toUpperCase()})`;
    }
    return "Online";
  };

  const getConnectionColor = () => {
    if (!isOnline) return "text-destructive";
    if (connectionType === "slow-2g" || connectionType === "2g") {
      return "text-yellow-600";
    }
    return "text-green-600";
  };

  // Show reconnection message
  if (wasOffline && isOnline) {
    return (
      <Card
        className={cn(
          "border-green-200 bg-green-50 dark:bg-green-950/20",
          className
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Back online
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              (was offline for {formatDuration(offlineDuration)})
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show offline message
  if (!isOnline) {
    return (
      <Card className={cn("border-destructive/20 bg-destructive/5", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-destructive" />
              <div>
                <span className="text-sm font-medium text-destructive">
                  You&apos;re offline
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Some features may not be available
                </p>
              </div>
            </div>
            {showRetryButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show connection status in header/status bar
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs",
        getConnectionColor(),
        className
      )}
    >
      {getConnectionIcon()}
      <span>{getConnectionText()}</span>
    </div>
  );
}

export interface ServiceWorkerStatusProps {
  className?: string;
}

export function ServiceWorkerStatus({ className }: ServiceWorkerStatusProps) {
  const { isRegistered, updateAvailable, updateServiceWorker } =
    useServiceWorker();

  if (!isRegistered) {
    return null;
  }

  if (updateAvailable) {
    return (
      <Card
        className={cn(
          "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
          className
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Update available
                </span>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  A new version of the app is ready
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={updateServiceWorker}
              className="ml-2"
            >
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export interface NetworkQualityIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function NetworkQualityIndicator({
  className,
  showDetails = false,
}: NetworkQualityIndicatorProps) {
  const { isOnline, connectionType } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs text-destructive",
          className
        )}
      >
        <WifiOff className="h-3 w-3" />
        <span>Offline</span>
      </div>
    );
  }

  const getQualityColor = () => {
    switch (connectionType) {
      case "slow-2g":
      case "2g":
        return "text-red-500";
      case "3g":
        return "text-yellow-500";
      case "4g":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getQualityText = () => {
    switch (connectionType) {
      case "slow-2g":
        return "Very Slow";
      case "2g":
        return "Slow";
      case "3g":
        return "Good";
      case "4g":
        return "Fast";
      default:
        return "Unknown";
    }
  };

  if (!showDetails) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs",
          getQualityColor(),
          className
        )}
      >
        <Wifi className="h-3 w-3" />
        <span>{connectionType?.toUpperCase() || "Online"}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <div className={cn("flex items-center gap-1", getQualityColor())}>
        <Wifi className="h-3 w-3" />
        <span>{getQualityText()}</span>
      </div>
      {connectionType && connectionType !== "unknown" && (
        <span className="text-muted-foreground">
          ({connectionType.toUpperCase()})
        </span>
      )}
    </div>
  );
}

export interface OfflineDataIndicatorProps {
  hasOfflineData?: boolean;
  lastSyncTime?: Date;
  className?: string;
}

export function OfflineDataIndicator({
  hasOfflineData = false,
  lastSyncTime,
  className,
}: OfflineDataIndicatorProps) {
  const { isOnline } = useOfflineStatus();

  if (isOnline && !hasOfflineData) {
    return null;
  }

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      <span>
        {isOnline ? "Cached data" : "Offline data"}
        {lastSyncTime && ` • Last sync: ${formatLastSync(lastSyncTime)}`}
      </span>
    </div>
  );
}
