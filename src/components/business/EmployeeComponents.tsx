import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Clock,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  facility?: string;
  avatar?: string;
  startDate?: Date;
  performance?: {
    currentMonth: {
      rentals: number;
      goal: number;
      commission: number;
    };
    lastMonth?: {
      rentals: number;
      commission: number;
    };
  };
  status: "active" | "inactive" | "on_leave";
}

export interface EmployeeCardProps {
  employee: Employee;
  showPerformance?: boolean;
  compact?: boolean;
  onClick?: (employee: Employee) => void;
  actions?: React.ReactNode;
}

export function EmployeeCard({
  employee,
  showPerformance = false,
  compact = false,
  onClick,
  actions,
}: EmployeeCardProps) {
  const getStatusBadge = () => {
    switch (employee.status) {
      case "active":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Active
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "on_leave":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            On Leave
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPerformanceColor = () => {
    if (!employee.performance?.currentMonth) return "text-muted-foreground";
    const { rentals, goal } = employee.performance.currentMonth;
    const percentage = (rentals / goal) * 100;

    if (percentage >= 100) return "text-success";
    if (percentage >= 80) return "text-warning";
    return "text-destructive";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (compact) {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-sm",
          onClick && "hover:bg-muted/50"
        )}
        onClick={() => onClick?.(employee)}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{employee.name}</div>
              <div className="text-sm text-muted-foreground truncate">
                {employee.position}
              </div>
              {employee.facility && (
                <div className="text-xs text-muted-foreground">
                  {employee.facility}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
              {actions}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={() => onClick?.(employee)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{employee.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {employee.position}
                {employee.facility && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {employee.facility}
                    </span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {actions}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {employee.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee.phone}</span>
              </div>
            )}
            {employee.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Started {employee.startDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {showPerformance && employee.performance?.currentMonth && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4" />
                <span className="font-medium">Current Month Performance</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Rentals</div>
                  <div
                    className={cn(
                      "font-semibold text-lg",
                      getPerformanceColor()
                    )}
                  >
                    {employee.performance.currentMonth.rentals}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of {employee.performance.currentMonth.goal} goal
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">Progress</div>
                  <div
                    className={cn(
                      "font-semibold text-lg",
                      getPerformanceColor()
                    )}
                  >
                    {Math.round(
                      (employee.performance.currentMonth.rentals /
                        employee.performance.currentMonth.goal) *
                        100
                    )}
                    %
                  </div>
                  <div className="text-xs text-muted-foreground">
                    completion
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">Commission</div>
                  <div className="font-semibold text-lg text-revenue">
                    $
                    {employee.performance.currentMonth.commission.toLocaleString()}
                  </div>
                  {employee.performance.lastMonth && (
                    <div className="text-xs text-muted-foreground">
                      Last: $
                      {employee.performance.lastMonth.commission.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      getPerformanceColor().includes("success")
                        ? "bg-success"
                        : getPerformanceColor().includes("warning")
                        ? "bg-warning"
                        : "bg-destructive"
                    )}
                    style={{
                      width: `${Math.min(
                        (employee.performance.currentMonth.rentals /
                          employee.performance.currentMonth.goal) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick stats component for employee overview
export interface EmployeeStatsProps {
  totalEmployees: number;
  activeEmployees: number;
  topPerformer?: {
    name: string;
    rentals: number;
  };
  averagePerformance: number;
  className?: string;
}

export function EmployeeStats({
  totalEmployees,
  activeEmployees,
  topPerformer,
  averagePerformance,
  className,
}: EmployeeStatsProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <div className="text-sm text-muted-foreground">Total Staff</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-success" />
            <div>
              <div className="text-2xl font-bold">{activeEmployees}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {topPerformer && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-warning" />
              <div>
                <div className="text-sm font-medium truncate">
                  {topPerformer.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {topPerformer.rentals} rentals (top)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-performance" />
            <div>
              <div className="text-2xl font-bold">{averagePerformance}%</div>
              <div className="text-sm text-muted-foreground">
                Avg Performance
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
