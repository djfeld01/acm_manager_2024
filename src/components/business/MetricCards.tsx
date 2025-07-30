import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Target,
  MapPin,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";

// TypeScript interfaces for ACM facility data - matching real database schema
export interface FacilityOccupancy {
  facilityId: string;
  facilityName: string;
  abbreviation: string;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  occupancyRate: number;
  rentalGoal?: number;
  currentRentals?: number;
  lastUpdated: string;
}

export interface FacilityActivity {
  facilityId: string;
  date: string;
  moveIns: number;
  moveOuts: number;
  netChange: number;
  inquiries: number;
  tours: number;
  conversionRate: number;
}

export interface FacilityReceivables {
  facilityId: string;
  currentReceivables: number;
  pastDue30: number;
  pastDue60: number;
  pastDue90Plus: number;
  totalPastDue: number;
  collectionRate: number;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend.direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return "";

    switch (trend.direction) {
      case "up":
        return "text-success";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center space-x-1 mt-2">
            {getTrendIcon()}
            <span className={cn("text-xs font-medium", getTrendColor())}>
              {trend.value > 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface FacilityMetricProps {
  occupancy: FacilityOccupancy;
  activity?: FacilityActivity;
  receivables?: FacilityReceivables;
  onViewDetails?: (facilityId: string) => void;
  onManage?: (facilityId: string) => void;
  className?: string;
}

export function FacilityCard({
  occupancy,
  activity,
  receivables,
  onViewDetails,
  onManage,
  className,
}: FacilityMetricProps) {
  const occupancyPercentage = Math.round(occupancy.occupancyRate * 100);
  const goalProgress =
    occupancy.rentalGoal && occupancy.currentRentals
      ? (occupancy.currentRentals / occupancy.rentalGoal) * 100
      : null;

  const getOccupancyStatus = () => {
    if (occupancyPercentage >= 90)
      return { color: "text-success", status: "Excellent" };
    if (occupancyPercentage >= 80)
      return { color: "text-warning", status: "Good" };
    return { color: "text-destructive", status: "Needs Attention" };
  };

  const status = getOccupancyStatus();

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {occupancy.facilityName}
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{occupancy.abbreviation}</span>
                <Badge variant="outline" className={status.color}>
                  {status.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Occupancy Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {occupancyPercentage}%
              </div>
              <div className="text-sm text-muted-foreground">Occupancy</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {occupancy.occupiedUnits}
              </div>
              <div className="text-sm text-muted-foreground">
                of {occupancy.totalUnits} units
              </div>
            </div>
          </div>

          {/* Rental Goal Progress */}
          {goalProgress !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rental Goal</span>
                <span>{Math.round(goalProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-revenue h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(goalProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {occupancy.currentRentals?.toLocaleString()} rentals
                </span>
                <span>{occupancy.rentalGoal?.toLocaleString()} goal</span>
              </div>
            </div>
          )}

          {/* Activity Metrics */}
          {activity && (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="font-semibold text-success">
                  +{activity.moveIns}
                </div>
                <div className="text-muted-foreground">Move-ins</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-destructive">
                  -{activity.moveOuts}
                </div>
                <div className="text-muted-foreground">Move-outs</div>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    "font-semibold",
                    activity.netChange >= 0
                      ? "text-success"
                      : "text-destructive"
                  )}
                >
                  {activity.netChange >= 0 ? "+" : ""}
                  {activity.netChange}
                </div>
                <div className="text-muted-foreground">Net</div>
              </div>
            </div>
          )}

          {/* Receivables Alert */}
          {receivables && receivables.totalPastDue > 0 && (
            <div className="p-2 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-warning">
                  ${receivables.totalPastDue.toLocaleString()} past due
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(occupancy.facilityId)}
                className="flex-1"
              >
                View Details
              </Button>
            )}
            {onManage && (
              <Button
                size="sm"
                onClick={() => onManage(occupancy.facilityId)}
                className="flex-1"
              >
                Manage
              </Button>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(occupancy.lastUpdated).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
