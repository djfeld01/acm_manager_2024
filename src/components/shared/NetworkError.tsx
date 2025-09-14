"use client";

import { ReactNode } from "react";
import {
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NetworkErrorType =
  | "offline"
  | "timeout"
  | "server_error"
  | "not_found"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "unknown";

interface NetworkErrorProps {
  type: NetworkErrorType;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
  showDetails?: boolean;
  retryLabel?: string;
  isRetrying?: boolean;
}

const errorConfig: Record<
  NetworkErrorType,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    badge: string;
  }
> = {
  offline: {
    title: "No Internet Connection",
    description: "Please check your internet connection and try again.",
    icon: WifiOff,
    color: "text-orange-600 dark:text-orange-400",
    badge: "Offline",
  },
  timeout: {
    title: "Request Timeout",
    description: "The request took too long to complete. Please try again.",
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    badge: "Timeout",
  },
  server_error: {
    title: "Server Error",
    description: "Something went wrong on our end. Please try again later.",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    badge: "Server Error",
  },
  not_found: {
    title: "Not Found",
    description: "The requested resource could not be found.",
    icon: AlertCircle,
    color: "text-blue-600 dark:text-blue-400",
    badge: "404",
  },
  unauthorized: {
    title: "Unauthorized",
    description: "You need to sign in to access this resource.",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    badge: "Unauthorized",
  },
  forbidden: {
    title: "Access Denied",
    description: "You do not have permission to access this resource.",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    badge: "Forbidden",
  },
  rate_limited: {
    title: "Too Many Requests",
    description:
      "You have made too many requests. Please wait a moment and try again.",
    icon: AlertCircle,
    color: "text-orange-600 dark:text-orange-400",
    badge: "Rate Limited",
  },
  unknown: {
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again.",
    icon: AlertTriangle,
    color: "text-gray-600 dark:text-gray-400",
    badge: "Error",
  },
};

export function NetworkError({
  type,
  message,
  onRetry,
  onGoBack,
  className,
  showDetails = false,
  retryLabel = "Try Again",
  isRetrying = false,
}: NetworkErrorProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[300px] p-4",
        className
      )}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className={cn("h-6 w-6", config.color)} />
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="mb-2">
              {config.badge}
            </Badge>
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <CardDescription>{message || config.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {retryLabel}
                  </>
                )}
              </Button>
            )}

            {onGoBack && (
              <Button variant="outline" onClick={onGoBack} className="w-full">
                Go Back
              </Button>
            )}
          </div>

          {showDetails && (
            <div className="text-xs text-muted-foreground text-center">
              Error Type: {type}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface NetworkStatusProps {
  children: ReactNode;
  fallback?: ReactNode;
  showOfflineMessage?: boolean;
}

export function NetworkStatus({
  children,
  fallback,
  showOfflineMessage = true,
}: NetworkStatusProps) {
  // This would typically use a hook to detect online/offline status
  // For now, we'll assume online. In a real app, you'd use:
  // const isOnline = useOnlineStatus();
  const isOnline = true;

  if (!isOnline) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showOfflineMessage) {
      return (
        <NetworkError type="offline" onRetry={() => window.location.reload()} />
      );
    }
  }

  return <>{children}</>;
}

interface RetryableErrorProps {
  error: Error | null;
  onRetry: () => void;
  isRetrying?: boolean;
  maxRetries?: number;
  currentRetry?: number;
  className?: string;
}

export function RetryableError({
  error,
  onRetry,
  isRetrying = false,
  maxRetries = 3,
  currentRetry = 0,
  className,
}: RetryableErrorProps) {
  const getErrorType = (error: Error | null): NetworkErrorType => {
    if (!error) return "unknown";

    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return "offline";
    }
    if (message.includes("timeout")) {
      return "timeout";
    }
    if (message.includes("500") || message.includes("server")) {
      return "server_error";
    }
    if (message.includes("404") || message.includes("not found")) {
      return "not_found";
    }
    if (message.includes("401") || message.includes("unauthorized")) {
      return "unauthorized";
    }
    if (message.includes("403") || message.includes("forbidden")) {
      return "forbidden";
    }
    if (message.includes("429") || message.includes("rate limit")) {
      return "rate_limited";
    }

    return "unknown";
  };

  const errorType = getErrorType(error);
  const canRetry = currentRetry < maxRetries;

  return (
    <div className={className}>
      <NetworkError
        type={errorType}
        message={error?.message}
        onRetry={canRetry ? onRetry : undefined}
        isRetrying={isRetrying}
        retryLabel={`Try Again ${
          currentRetry > 0 ? `(${currentRetry}/${maxRetries})` : ""
        }`}
        showDetails={process.env.NODE_ENV === "development"}
      />

      {!canRetry && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Maximum retry attempts reached. Please refresh the page or contact
            support.
          </p>
        </div>
      )}
    </div>
  );
}

// Utility function to determine error type from HTTP status codes
export function getNetworkErrorType(status?: number): NetworkErrorType {
  if (!status) return "unknown";

  switch (status) {
    case 400:
    case 422:
      return "unknown";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 408:
      return "timeout";
    case 429:
      return "rate_limited";
    case 500:
    case 502:
    case 503:
    case 504:
      return "server_error";
    default:
      return "unknown";
  }
}
