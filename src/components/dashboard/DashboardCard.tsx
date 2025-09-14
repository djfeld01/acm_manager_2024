"use client";

import {
  LucideIcon,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
    period: string;
  };
  alert?: {
    level: "info" | "warning" | "error";
    message: string;
  };
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: LucideIcon;
  description?: string;
}

interface DashboardCardProps {
  metric: DashboardMetric;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "detailed";
}

export function DashboardCard({
  metric,
  className,
  size = "md",
  variant = "default",
}: DashboardCardProps) {
  const {
    title,
    value,
    change,
    alert,
    action,
    icon: Icon,
    description,
  } = metric;

  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const getChangeColor = (type: "increase" | "decrease") => {
    return type === "increase"
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getAlertColor = (level: "info" | "warning" | "error") => {
    switch (level) {
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getAlertIcon = (level: "info" | "warning" | "error") => {
    switch (level) {
      case "info":
        return Info;
      case "warning":
      case "error":
        return AlertTriangle;
      default:
        return Info;
    }
  };

  if (variant === "compact") {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            {Icon && (
              <div className="h-8 w-8 text-muted-foreground">
                <Icon className="h-full w-full" />
              </div>
            )}
          </div>
          {change && (
            <div className="mt-2 flex items-center text-xs">
              {change.type === "increase" ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              <span className={getChangeColor(change.type)}>
                {change.value > 0 ? "+" : ""}
                {change.value}% from {change.period}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {Icon && (
          <div className="h-4 w-4 text-muted-foreground">
            <Icon className="h-full w-full" />
          </div>
        )}
      </CardHeader>
      <CardContent className={sizeClasses[size]}>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{value}</div>

          {change && (
            <div className="flex items-center text-xs">
              {change.type === "increase" ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              <span className={getChangeColor(change.type)}>
                {change.value > 0 ? "+" : ""}
                {change.value}% from {change.period}
              </span>
            </div>
          )}

          {alert && (
            <div className="flex items-start space-x-2 rounded-md bg-muted p-2">
              {(() => {
                const AlertIcon = getAlertIcon(alert.level);
                return (
                  <AlertIcon
                    className={cn("h-4 w-4 mt-0.5", getAlertColor(alert.level))}
                  />
                );
              })()}
              <div className="space-y-1">
                <p className="text-xs font-medium">
                  {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}
                </p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            </div>
          )}

          {action && (
            <div className="pt-2">
              {action.href ? (
                <Button asChild size="sm" variant="outline" className="w-full">
                  <a href={action.href}>{action.label}</a>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Specialized dashboard cards for common use cases

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
  };
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  className,
}: MetricCardProps) {
  const metric: DashboardMetric = {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    value,
    change: change
      ? { ...change, type: change.value >= 0 ? "increase" : "decrease" }
      : undefined,
    icon,
  };

  return (
    <DashboardCard metric={metric} variant="compact" className={className} />
  );
}

interface AlertCardProps {
  title: string;
  message: string;
  level: "info" | "warning" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function AlertCard({
  title,
  message,
  level,
  action,
  className,
}: AlertCardProps) {
  const metric: DashboardMetric = {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    value: "",
    alert: { level, message },
    action,
  };

  return <DashboardCard metric={metric} className={className} />;
}

interface DashboardQuickActionCardProps {
  title: string;
  description: string;
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: LucideIcon;
  className?: string;
}

export function DashboardQuickActionCard({
  title,
  description,
  action,
  icon,
  className,
}: DashboardQuickActionCardProps) {
  const metric: DashboardMetric = {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    value: "",
    description,
    action,
    icon,
  };

  return <DashboardCard metric={metric} className={className} />;
}
