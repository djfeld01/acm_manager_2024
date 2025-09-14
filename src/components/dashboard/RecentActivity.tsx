"use client";

import { Role } from "@/db/schema/user";
import { filterByRole } from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  User,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  type:
    | "payment"
    | "rental"
    | "report"
    | "alert"
    | "system"
    | "payroll"
    | "user";
  title: string;
  description: string;
  timestamp: Date;
  roles: Role[];
  priority?: "low" | "medium" | "high";
  actionUrl?: string;
  locationId?: string;
  locationName?: string;
  userId?: string;
  userName?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  userRole: Role;
  maxItems?: number;
  showLocationFilter?: boolean;
  className?: string;
}

export function RecentActivity({
  activities,
  userRole,
  maxItems = 10,
  showLocationFilter = false,
  className,
}: RecentActivityProps) {
  // Filter activities by user role
  const filteredActivities = filterByRole(activities, userRole)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "payment":
        return DollarSign;
      case "rental":
        return User;
      case "report":
        return FileText;
      case "alert":
        return AlertCircle;
      case "system":
        return Settings;
      case "payroll":
        return DollarSign;
      case "user":
        return User;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: ActivityItem["type"], priority?: string) => {
    if (priority === "high") return "text-red-600 dark:text-red-400";
    if (priority === "medium") return "text-yellow-600 dark:text-yellow-400";

    switch (type) {
      case "payment":
        return "text-green-600 dark:text-green-400";
      case "rental":
        return "text-blue-600 dark:text-blue-400";
      case "alert":
        return "text-red-600 dark:text-red-400";
      case "system":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority || priority === "low") return null;

    return (
      <Badge
        variant={priority === "high" ? "destructive" : "secondary"}
        className="text-xs"
      >
        {priority}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (filteredActivities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            Stay updated with the latest activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Activity will appear here as it happens
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and activities relevant to your role
            </CardDescription>
          </div>
          <Badge variant="outline">{filteredActivities.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const iconColor = getActivityColor(
                activity.type,
                activity.priority
              );

              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
                    activity.actionUrl && "hover:bg-accent/50 cursor-pointer"
                  )}
                  onClick={
                    activity.actionUrl
                      ? () => (window.location.href = activity.actionUrl!)
                      : undefined
                  }
                >
                  <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(activity.priority)}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>

                    {(activity.locationName || activity.userName) && (
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        {activity.locationName && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{activity.locationName}</span>
                          </div>
                        )}
                        {activity.userName && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{activity.userName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {filteredActivities.length >= maxItems && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full">
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data generator for testing
export function generateMockActivities(): ActivityItem[] {
  const now = new Date();

  return [
    {
      id: "1",
      type: "payment",
      title: "Payment Received",
      description: "Monthly payment of $150 received from Unit A-123",
      timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      roles: [
        Role.MANAGER,
        Role.ASSISTANT,
        Role.SUPERVISOR,
        Role.ADMIN,
        Role.OWNER,
      ],
      priority: "low",
      locationName: "Downtown Storage",
    },
    {
      id: "2",
      type: "rental",
      title: "New Rental Agreement",
      description: "John Smith signed rental agreement for Unit B-456",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
      roles: [
        Role.MANAGER,
        Role.ASSISTANT,
        Role.SUPERVISOR,
        Role.ADMIN,
        Role.OWNER,
      ],
      priority: "medium",
      locationName: "Downtown Storage",
      userName: "Sarah Johnson",
    },
    {
      id: "3",
      type: "alert",
      title: "Overdue Payment Alert",
      description: "Unit C-789 payment is 5 days overdue - follow up required",
      timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
      roles: [Role.MANAGER, Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
      priority: "high",
      actionUrl: "/payments/overdue",
      locationName: "Westside Storage",
    },
    {
      id: "4",
      type: "report",
      title: "Daily Report Generated",
      description: "Daily operations report for March 15th has been generated",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      roles: [Role.MANAGER, Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
      actionUrl: "/reports/daily",
      locationName: "Downtown Storage",
    },
    {
      id: "5",
      type: "payroll",
      title: "Payroll Processed",
      description: "Bi-weekly payroll has been processed for all employees",
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
      userName: "System",
    },
    {
      id: "6",
      type: "system",
      title: "System Maintenance",
      description: "Scheduled maintenance completed successfully",
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
      roles: [Role.ADMIN, Role.OWNER],
      userName: "System Admin",
    },
    {
      id: "7",
      type: "user",
      title: "New User Added",
      description: "Mike Wilson has been added as Assistant Manager",
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      roles: [Role.SUPERVISOR, Role.ADMIN, Role.OWNER],
      locationName: "Northside Storage",
      userName: "Admin",
    },
  ];
}
