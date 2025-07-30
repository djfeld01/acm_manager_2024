import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type:
    | "revenue"
    | "occupancy"
    | "rentals"
    | "collections"
    | "expenses"
    | "custom";
  period: "monthly" | "quarterly" | "yearly";
  startDate: Date;
  endDate: Date;
  targetValue: number;
  currentValue: number;
  unit: "currency" | "percentage" | "count";
  facilityId?: string;
  facilityName?: string;
  assignedTo?: string;
  status: "active" | "completed" | "paused" | "failed";
  createdBy: string;
  lastUpdated: Date;
}

export interface GoalCardProps {
  goal: Goal;
  onEdit?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
  showFacility?: boolean;
  className?: string;
}

export function GoalCard({
  goal,
  onEdit,
  onViewDetails,
  compact = false,
  showFacility = true,
  className,
}: GoalCardProps) {
  const progressPercent =
    goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const isOverdue = new Date() > goal.endDate && goal.status === "active";
  const daysRemaining = Math.ceil(
    (goal.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const formatValue = (value: number) => {
    switch (goal.unit) {
      case "currency":
        return `$${value.toLocaleString()}`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "count":
        return value.toString();
      default:
        return value.toString();
    }
  };

  const getTypeIcon = () => {
    switch (goal.type) {
      case "revenue":
        return <DollarSign className="h-4 w-4" />;
      case "occupancy":
        return <Building2 className="h-4 w-4" />;
      case "rentals":
        return <Users className="h-4 w-4" />;
      case "collections":
        return <TrendingUp className="h-4 w-4" />;
      case "expenses":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    switch (goal.status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Completed
          </Badge>
        );
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  const getProgressColor = () => {
    if (progressPercent >= 100) return "bg-success";
    if (progressPercent >= 75) return "bg-performance";
    if (progressPercent >= 50) return "bg-warning";
    return "bg-revenue";
  };

  if (compact) {
    return (
      <Card className={cn("hover:bg-muted/50 transition-colors", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getTypeIcon()}
                <div>
                  <div className="font-medium">{goal.title}</div>
                  {showFacility && goal.facilityName && (
                    <div className="text-xs text-muted-foreground">
                      {goal.facilityName}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge()}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {formatValue(goal.currentValue)} /{" "}
                  {formatValue(goal.targetValue)}
                </span>
                <span className="font-semibold">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {goal.status === "active" && (
              <div className="text-xs text-muted-foreground">
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : "Due today"}
              </div>
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
          <div className="flex items-center space-x-2">
            {getTypeIcon()}
            <div>
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              <CardDescription>
                {goal.description}
                {showFacility && goal.facilityName && ` • ${goal.facilityName}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-lg font-bold">
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Current: {formatValue(goal.currentValue)}</span>
              <span>Target: {formatValue(goal.targetValue)}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Start Date</div>
              <div className="font-medium">
                {goal.startDate.toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">End Date</div>
              <div
                className={cn(
                  "font-medium",
                  isOverdue ? "text-destructive" : ""
                )}
              >
                {goal.endDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Status Info */}
          {goal.status === "active" && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : isOverdue
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : "Due today"}
              </span>
            </div>
          )}

          {goal.assignedTo && (
            <div className="text-sm">
              <span className="text-muted-foreground">Assigned to:</span>{" "}
              {goal.assignedTo}
            </div>
          )}

          {onViewDetails && (
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="w-full"
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Goals dashboard component
export interface GoalsDashboardProps {
  goals: Goal[];
  period: "monthly" | "quarterly" | "yearly";
  onPeriodChange?: (period: "monthly" | "quarterly" | "yearly") => void;
  onCreateGoal?: () => void;
  className?: string;
}

export function GoalsDashboard({
  goals,
  period,
  onPeriodChange,
  onCreateGoal,
  className,
}: GoalsDashboardProps) {
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const overdueGoals = goals.filter(
    (g) => new Date() > g.endDate && g.status === "active"
  );

  const averageProgress =
    activeGoals.length > 0
      ? activeGoals.reduce(
          (sum, goal) => sum + (goal.currentValue / goal.targetValue) * 100,
          0
        ) / activeGoals.length
      : 0;

  const getGoalsByType = () => {
    const types = [
      "revenue",
      "occupancy",
      "rentals",
      "collections",
      "expenses",
      "custom",
    ] as const;
    return types.map((type) => ({
      type,
      count: goals.filter((g) => g.type === type).length,
      completed: goals.filter(
        (g) => g.type === type && g.status === "completed"
      ).length,
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals Dashboard
            </CardTitle>
            <CardDescription>
              Track performance across all facilities
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onPeriodChange && (
              <div className="flex gap-1">
                {(["monthly", "quarterly", "yearly"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPeriodChange(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            )}
            {onCreateGoal && (
              <Button onClick={onCreateGoal}>
                <Target className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-info/5 rounded-lg border border-info/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-info" />
                <span className="text-sm font-medium">Active Goals</span>
              </div>
              <div className="text-2xl font-bold">{activeGoals.length}</div>
            </div>

            <div className="p-4 bg-success/5 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <div className="text-2xl font-bold">{completedGoals.length}</div>
            </div>

            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Avg Progress</span>
              </div>
              <div className="text-2xl font-bold">
                {averageProgress.toFixed(0)}%
              </div>
            </div>

            <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Overdue</span>
              </div>
              <div className="text-2xl font-bold">{overdueGoals.length}</div>
            </div>
          </div>

          {/* Goals by Type */}
          <div>
            <h4 className="font-medium mb-3">Goals by Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getGoalsByType().map(({ type, count, completed }) => (
                <div key={type} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {completed}/{count}
                    </span>
                  </div>
                  <Progress
                    value={count > 0 ? (completed / count) * 100 : 0}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Active Goals</h4>
              <div className="space-y-2">
                {activeGoals.slice(0, 5).map((goal) => (
                  <GoalCard key={goal.id} goal={goal} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Goal performance component
export interface GoalPerformanceProps {
  goal: Goal;
  historicalData: Array<{
    date: Date;
    value: number;
  }>;
  className?: string;
}

export function GoalPerformance({
  goal,
  historicalData,
  className,
}: GoalPerformanceProps) {
  const progressPercent =
    goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const isOnTrack = progressPercent >= 75; // Simplified logic

  // Calculate trend
  const recentData = historicalData.slice(-7);
  const trend =
    recentData.length >= 2
      ? recentData[recentData.length - 1].value - recentData[0].value
      : 0;

  const formatValue = (value: number) => {
    switch (goal.unit) {
      case "currency":
        return `$${value.toLocaleString()}`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "count":
        return value.toString();
      default:
        return value.toString();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Goal Performance
        </CardTitle>
        <CardDescription>
          {goal.title} - {goal.facilityName}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Current Value
              </div>
              <div className="text-xl font-bold">
                {formatValue(goal.currentValue)}
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Target Value
              </div>
              <div className="text-xl font-bold">
                {formatValue(goal.targetValue)}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {progressPercent.toFixed(1)}%
                </span>
                {isOnTrack ? (
                  <Badge className="bg-success/10 text-success border-success/20">
                    On Track
                  </Badge>
                ) : (
                  <Badge variant="secondary">Behind</Badge>
                )}
              </div>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          {/* Trend */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">7-Day Trend</span>
              <div className="flex items-center gap-1">
                {trend >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-success font-medium">
                      +{formatValue(Math.abs(trend))}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-destructive font-medium">
                      -{formatValue(Math.abs(trend))}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Simple historical chart */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Performance</div>
            <div className="space-y-1">
              {recentData.map((data, index) => {
                const maxValue = Math.max(...recentData.map((d) => d.value));
                const widthPercent =
                  maxValue > 0 ? (data.value / maxValue) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-16 text-muted-foreground">
                      {data.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 relative">
                      <div
                        className="bg-performance h-2 rounded-full transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <div className="w-20 text-right font-medium">
                      {formatValue(data.value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
