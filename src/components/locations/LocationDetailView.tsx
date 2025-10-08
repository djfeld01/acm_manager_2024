"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationData } from "./LocationCard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Settings,
  BarChart3,
  FileText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationMetrics {
  // Occupancy trends (last 30 days)
  occupancyTrend: Array<{
    date: string;
    occupancyRate: number;
    occupiedUnits: number;
    totalUnits: number;
  }>;

  // Revenue trends (last 12 months)
  revenueTrend: Array<{
    month: string;
    revenue: number;
    rentals: number;
    goal: number;
  }>;

  // Recent activity
  recentActivity: Array<{
    id: string;
    type: "rental" | "moveout" | "payment" | "maintenance" | "inquiry";
    description: string;
    timestamp: string;
    employeeName?: string;
  }>;

  // Staff information
  staff: Array<{
    id: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
  }>;

  // Alerts and issues
  alerts: Array<{
    id: string;
    type: "critical" | "warning" | "info";
    title: string;
    description: string;
    timestamp: string;
    isResolved: boolean;
  }>;
}

interface LocationDetailViewProps {
  location: LocationData;
  metrics?: LocationMetrics;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onEditLocation?: () => void;
  onManageStaff?: () => void;
  onViewReports?: () => void;
  onViewActivity?: () => void;
  className?: string;
}

export function LocationDetailView({
  location,
  metrics,
  isLoading = false,
  error = null,
  onRetry,
  onEditLocation,
  onManageStaff,
  onViewReports,
  onViewActivity,
  className,
}: LocationDetailViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "rental":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "moveout":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "maintenance":
        return <Settings className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <CardSkeleton />
        <div className="grid gap-6 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              Failed to load location details
            </p>
            <p className="text-xs text-muted-foreground">
              {error.message || "An error occurred while loading the data"}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-4"
            >
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const rentalProgress =
    (location.rentalsThisMonth / location.rentalGoal) * 100;

  return (
    <ComponentErrorBoundary>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {location.facilityName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {location.facilityAbbreviation}
                      </Badge>
                      <Badge
                        variant={location.isActive ? "default" : "secondary"}
                      >
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {location.alertCount > 0 && (
                        <Badge variant="destructive">
                          {location.alertCount} alerts
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {location.streetAddress}, {location.city},{" "}
                      {location.state} {location.zipCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{location.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{location.email}</span>
                  </div>
                  {location.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{location.website}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onEditLocation && (
                  <Button variant="outline" onClick={onEditLocation}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {onViewReports && (
                  <Button variant="outline" onClick={onViewReports}>
                    <FileText className="mr-2 h-4 w-4" />
                    Reports
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Occupancy Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {location.occupancyRate.toFixed(1)}%
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    {location.occupancyChange > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        location.occupancyChange > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {Math.abs(location.occupancyChange).toFixed(1)}% from last
                      week
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {location.occupiedUnits}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of {location.totalUnits} units
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Monthly Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(location.monthlyRevenue)}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    {location.revenueChange > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        location.revenueChange > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {location.revenueChange > 0 ? "+" : ""}
                      {location.revenueChange.toFixed(1)}% MoM
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rental Goal</p>
                  <p className="text-2xl font-bold">
                    {location.rentalsThisMonth}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    of {location.rentalGoal} goal ({rentalProgress.toFixed(1)}%)
                  </div>
                </div>
                <div className="w-16">
                  <Progress value={rentalProgress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Staff Members</p>
                  <p className="text-2xl font-bold">{location.employeeCount}</p>
                  <div className="text-xs text-muted-foreground">
                    Active employees
                  </div>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Commission Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Commission Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Storage Commission:
                    </span>
                    <span className="font-medium">
                      {location.storageCommissionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Insurance Commission:
                    </span>
                    <span className="font-medium">
                      {location.insuranceCommissionRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Unit Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Unit Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Occupied Units</span>
                      <span className="font-medium">
                        {location.occupiedUnits}
                      </span>
                    </div>
                    <Progress
                      value={
                        (location.occupiedUnits / location.totalUnits) * 100
                      }
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-medium text-green-600">
                        {location.occupiedUnits}
                      </div>
                      <div className="text-muted-foreground">Occupied</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600">
                        {location.availableUnits}
                      </div>
                      <div className="text-muted-foreground">Available</div>
                    </div>
                    <div>
                      <div className="font-medium">{location.totalUnits}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                {onViewActivity && (
                  <Button variant="outline" size="sm" onClick={onViewActivity}>
                    View All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {metrics?.recentActivity &&
                metrics.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.recentActivity.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(activity.timestamp)}</span>
                            {activity.employeeName && (
                              <span>by {activity.employeeName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No recent activity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Staff Members</CardTitle>
                {onManageStaff && (
                  <Button variant="outline" size="sm" onClick={onManageStaff}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Staff
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {metrics?.staff && metrics.staff.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.staff.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={member.isActive ? "default" : "secondary"}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {member.lastLogin && (
                            <span className="text-xs text-muted-foreground">
                              Last: {formatDate(member.lastLogin)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No staff information available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.alerts && metrics.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.alerts
                      .filter((alert) => !alert.isResolved)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          className="flex items-start gap-3 p-3 rounded-lg border"
                        >
                          {getAlertIcon(alert.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(alert.timestamp)}</span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              alert.type === "critical"
                                ? "destructive"
                                : alert.type === "warning"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {alert.type}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No active alerts
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ComponentErrorBoundary>
  );
}
