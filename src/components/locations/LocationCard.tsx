"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationData {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phoneNumber: string;
  website?: string;

  // Status and operational data
  isActive: boolean;
  currentClient: boolean;

  // Performance metrics
  occupancyRate: number;
  occupancyChange: number; // 7-day change
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;

  // Financial metrics
  monthlyRevenue: number;
  revenueChange: number; // month-over-month
  rentalGoal: number;
  rentalsThisMonth: number;

  // Commission rates
  storageCommissionRate: number;
  insuranceCommissionRate: number;

  // Staff metrics
  employeeCount: number;
  lastActivity?: string;
  lastActivityBy?: string;

  // Alerts and notifications
  alertCount: number;
  hasIssues: boolean;
}

interface LocationCardProps {
  location: LocationData;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  onViewDetails?: (sitelinkId: string) => void;
  onManageLocation?: (sitelinkId: string) => void;
  onViewReports?: (sitelinkId: string) => void;
  className?: string;
}

export function LocationCard({
  location,
  variant = "default",
  showActions = true,
  onViewDetails,
  onManageLocation,
  onViewReports,
  className,
}: LocationCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getOccupancyStatus = () => {
    if (location.occupancyRate >= 90)
      return { color: "text-green-600", icon: CheckCircle };
    if (location.occupancyRate >= 75)
      return { color: "text-blue-600", icon: TrendingUp };
    if (location.occupancyRate >= 60)
      return { color: "text-yellow-600", icon: TrendingUp };
    return { color: "text-red-600", icon: AlertTriangle };
  };

  const occupancyStatus = getOccupancyStatus();
  const StatusIcon = occupancyStatus.icon;

  const rentalProgress =
    (location.rentalsThisMonth / location.rentalGoal) * 100;

  if (variant === "compact") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{location.facilityName}</h3>
                <p className="text-sm text-muted-foreground">
                  {location.city}, {location.state}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={location.isActive ? "default" : "secondary"}>
                {formatPercentage(location.occupancyRate)}
              </Badge>
              {location.alertCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {location.alertCount}
                </Badge>
              )}
              {showActions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails?.(location.sitelinkId)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{location.facilityName}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {location.facilityAbbreviation}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location.streetAddress}</span>
            </div>

            <div className="text-sm text-muted-foreground">
              {location.city}, {location.state} {location.zipCode}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={location.isActive ? "default" : "secondary"}>
              {location.isActive ? "Active" : "Inactive"}
            </Badge>
            {location.alertCount > 0 && (
              <Badge variant="destructive">{location.alertCount} alerts</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{location.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{location.email}</span>
          </div>
        </div>

        {/* Occupancy Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <StatusIcon className={cn("h-4 w-4", occupancyStatus.color)} />
              Occupancy Rate
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {formatPercentage(location.occupancyRate)}
              </span>
              {location.occupancyChange !== 0 && (
                <span
                  className={cn(
                    "text-xs flex items-center gap-1",
                    location.occupancyChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {location.occupancyChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(location.occupancyChange).toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          <Progress value={location.occupancyRate} className="h-2" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{location.occupiedUnits} occupied</span>
            <span>{location.availableUnits} available</span>
            <span>{location.totalUnits} total</span>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Monthly Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {formatCurrency(location.monthlyRevenue)}
              </span>
              {location.revenueChange !== 0 && (
                <span
                  className={cn(
                    "text-xs",
                    location.revenueChange > 0
                      ? "text-green-600"
                      : "text-red-600"
                  )}
                >
                  {location.revenueChange > 0 ? "+" : ""}
                  {location.revenueChange.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Staff</span>
            </div>
            <div className="font-semibold">
              {location.employeeCount} employees
            </div>
          </div>
        </div>

        {/* Rental Goal Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Rental Goal Progress</span>
            <span className="text-sm">
              {location.rentalsThisMonth} / {location.rentalGoal}
            </span>
          </div>
          <Progress value={rentalProgress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {formatPercentage(rentalProgress)} of monthly goal
          </div>
        </div>

        {/* Last Activity */}
        {location.lastActivity && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Last activity: {location.lastActivity}</span>
            {location.lastActivityBy && (
              <span>by {location.lastActivityBy}</span>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(location.sitelinkId)}
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>

            {onManageLocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onManageLocation(location.sitelinkId)}
              >
                <Building2 className="h-4 w-4" />
              </Button>
            )}

            {onViewReports && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewReports(location.sitelinkId)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
