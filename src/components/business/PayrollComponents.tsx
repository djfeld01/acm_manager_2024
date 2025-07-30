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
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calculator,
  Building2,
  User,
  MapPin,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// TypeScript interfaces for ACM Payroll data - matching real database schema
export interface PayrollPeriod {
  payPeriodId: string;
  startDate: string;
  endDate: string | null;
  paycheckDate: string | null;
  processingDate: string | null;
  status: "Completed" | "In Process" | "Current" | "Future" | null;
}

export interface MonthlyBonusBreakdown {
  employeeId: string;
  bonusType: string;
  facilityId: string;
  bonusAmount: number;
  bonusMonth: string;
  date: string;
}

export interface Rentals {
  Id: string;
  employeeId: string;
  facilityId: string;
  date: string;
  tenantName: string;
  unitName: string;
  hasInsurance: boolean;
}

export interface CommittedPayrollByEmployee {
  lastName: string;
  firstName: string;
  fullName?: string;
  locationAbbreviation: string;
  locationName: string;
  locationPaycorNumber: number;
  vacationHours: number;
  holidayHours: number;
  christmasBonus: number;
  monthlyBonus: number;
  monthlyBonusBreakdown?: MonthlyBonusBreakdown[];
  commission: number;
  mileageDollars: number;
  rentals?: Rentals[];
  unpaidCommission?: Rentals[];
  unpaidCommissionCount: number;
  currentPayrollId: string;
  employeeId: string;
  facilityId: string;
}

export interface PayrollSummaryProps {
  period: PayrollPeriod;
  employees: CommittedPayrollByEmployee[];
  breakdown: {
    totalHours: number;
    totalCommissions: number;
    totalBonuses: number;
    totalMileage: number;
    totalVacationHours: number;
    totalHolidayHours: number;
  };
  onProcessPayroll?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function PayrollSummaryCard({
  period,
  employees,
  breakdown,
  onProcessPayroll,
  onViewDetails,
  className,
}: PayrollSummaryProps) {
  const getStatusBadge = () => {
    switch (period.status) {
      case "Current":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            Current
          </Badge>
        );
      case "In Process":
        return (
          <Badge className="bg-info/10 text-info border-info/20">
            Processing
          </Badge>
        );
      case "Completed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Completed
          </Badge>
        );
      case "Future":
        return <Badge variant="secondary">Future</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (period.status) {
      case "Future":
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
      case "Current":
        return <Clock className="h-5 w-5 text-warning" />;
      case "In Process":
        return <Calculator className="h-5 w-5 text-info" />;
      case "Completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const totalGrossPay =
    breakdown.totalCommissions +
    breakdown.totalBonuses +
    breakdown.totalMileage;
  const employeeCount = employees.length;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <CardTitle>
                Pay Period: {new Date(period.startDate).toLocaleDateString()}
                {period.endDate &&
                  ` - ${new Date(period.endDate).toLocaleDateString()}`}
              </CardTitle>
              <CardDescription>
                {period.paycheckDate &&
                  `Pay Date: ${new Date(
                    period.paycheckDate
                  ).toLocaleDateString()} • `}
                {employeeCount} employees
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Amount */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-revenue" />
              <span className="font-medium">Total Variable Pay</span>
            </div>
            <span className="text-2xl font-bold text-revenue">
              ${totalGrossPay.toLocaleString()}
            </span>
          </div>

          {/* ACM-Specific Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Commissions</div>
              <div className="font-semibold text-performance">
                ${breakdown.totalCommissions.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Bonuses</div>
              <div className="font-semibold text-success">
                ${breakdown.totalBonuses.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Mileage</div>
              <div className="font-semibold">
                ${breakdown.totalMileage.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Vacation Hours</div>
              <div className="font-semibold">
                {breakdown.totalVacationHours.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Holiday Hours</div>
              <div className="font-semibold">
                {breakdown.totalHolidayHours.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Hours</div>
              <div className="font-semibold">
                {breakdown.totalHours.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(period.status === "Current" || period.status === "In Process") && (
            <div className="flex space-x-2 pt-2">
              {onViewDetails && (
                <Button variant="outline" onClick={onViewDetails}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
              {onProcessPayroll && period.status === "Current" && (
                <Button onClick={onProcessPayroll}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Process Payroll
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export interface EmployeePayrollItemProps {
  employee: CommittedPayrollByEmployee;
  onViewDetails?: (employeeId: string) => void;
  onEditPayroll?: (employeeId: string) => void;
  className?: string;
}

export function EmployeePayrollItem({
  employee,
  onViewDetails,
  onEditPayroll,
  className,
}: EmployeePayrollItemProps) {
  const grossPay =
    employee.commission + employee.monthlyBonus + employee.mileageDollars;

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-muted rounded-full p-2">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">
                {employee.firstName} {employee.lastName}
              </div>
              <div className="text-sm text-muted-foreground flex items-center space-x-2">
                <MapPin className="h-3 w-3" />
                <span>{employee.locationAbbreviation}</span>
                <span>•</span>
                <span>Dept {employee.locationPaycorNumber}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg">
              ${grossPay.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Gross Pay</div>
          </div>
        </div>

        {/* Pay Breakdown */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Commission</div>
            <div className="font-medium text-performance">
              ${employee.commission.toLocaleString()}
            </div>
            {employee.rentals && (
              <div className="text-xs text-muted-foreground">
                {employee.rentals.length} rentals
              </div>
            )}
          </div>
          <div>
            <div className="text-muted-foreground">Monthly Bonus</div>
            <div className="font-medium text-success">
              ${employee.monthlyBonus.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Mileage</div>
            <div className="font-medium">
              ${employee.mileageDollars.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Hours</div>
            <div className="font-medium">
              {(employee.vacationHours + employee.holidayHours).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Vac: {employee.vacationHours} | Hol: {employee.holidayHours}
            </div>
          </div>
        </div>

        {/* Unpaid Commissions Alert */}
        {employee.unpaidCommissionCount > 0 && (
          <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {employee.unpaidCommissionCount} unpaid commissions pending
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(employee.employeeId)}
            >
              View Details
            </Button>
          )}
          {onEditPayroll && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditPayroll(employee.employeeId)}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export interface PayrollAlert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  employeeId?: string;
  facilityId?: string;
  action?: string;
}

export interface PayrollAlertsProps {
  alerts: PayrollAlert[];
  onResolveAlert?: (alertId: string) => void;
  onViewEmployee?: (employeeId: string) => void;
  className?: string;
}

export function PayrollAlerts({
  alerts,
  onResolveAlert,
  onViewEmployee,
  className,
}: PayrollAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">
            No payroll alerts - everything looks good!
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: PayrollAlert["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info":
        return <CheckCircle2 className="h-4 w-4 text-info" />;
    }
  };

  const getAlertColor = (type: PayrollAlert["type"]) => {
    switch (type) {
      case "error":
        return "bg-destructive/10 border-destructive/20";
      case "warning":
        return "bg-warning/10 border-warning/20";
      case "info":
        return "bg-info/10 border-info/20";
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Payroll Alerts</span>
          <Badge variant="outline">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn("p-3 rounded-lg border", getAlertColor(alert.type))}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{alert.message}</div>
                    {alert.action && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Action: {alert.action}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {alert.employeeId && onViewEmployee && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewEmployee(alert.employeeId!)}
                    >
                      View Employee
                    </Button>
                  )}
                  {onResolveAlert && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
