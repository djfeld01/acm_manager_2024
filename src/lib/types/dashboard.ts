import { LucideIcon } from "lucide-react";
import { QuickAction } from "./navigation";

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
    href: string;
  };
  icon?: LucideIcon;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  level: "info" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: "payroll" | "location" | "user" | "system";
  userId?: string;
  facilityId?: string;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  alerts: Alert[];
  quickActions: QuickAction[];
  recentActivity: Activity[];
}
