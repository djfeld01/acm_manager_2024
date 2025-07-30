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
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Globe,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DailyDeposit {
  id: string;
  date: Date;
  facilityId: string;
  facilityName: string;
  totalAmount: number;
  breakdown: {
    cash: number;
    checks: number;
    creditCards: number;
    ach: number;
    online: number;
  };
  depositedBy: string;
  status: "pending" | "deposited" | "cleared" | "reconciled";
  bankAccount?: string;
  notes?: string;
}

export interface DailyDepositCardProps {
  deposit: DailyDeposit;
  onEdit?: () => void;
  onDeposit?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
  className?: string;
}

export function DailyDepositCard({
  deposit,
  onEdit,
  onDeposit,
  onViewDetails,
  compact = false,
  className,
}: DailyDepositCardProps) {
  const getStatusBadge = () => {
    switch (deposit.status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "deposited":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            Deposited
          </Badge>
        );
      case "cleared":
        return (
          <Badge className="bg-info/10 text-info border-info/20">Cleared</Badge>
        );
      case "reconciled":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Reconciled
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (deposit.status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "deposited":
        return <ArrowUpRight className="h-4 w-4 text-warning" />;
      case "cleared":
        return <CheckCircle2 className="h-4 w-4 text-info" />;
      case "reconciled":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <Card className={cn("hover:bg-muted/50 transition-colors", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-revenue/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-revenue" />
              </div>
              <div>
                <div className="font-medium">{deposit.facilityName}</div>
                <div className="text-sm text-muted-foreground">
                  {deposit.date.toLocaleDateString()} • {deposit.depositedBy}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-revenue text-lg">
                ${deposit.totalAmount.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                {getStatusBadge()}
              </div>
            </div>
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
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {deposit.facilityName}
            </CardTitle>
            <CardDescription>
              {deposit.date.toLocaleDateString()} • Deposited by{" "}
              {deposit.depositedBy}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Total Amount */}
          <div className="flex items-center justify-between p-4 bg-revenue/5 rounded-lg border border-revenue/20">
            <span className="font-medium">Total Deposit</span>
            <span className="text-2xl font-bold text-revenue">
              ${deposit.totalAmount.toLocaleString()}
            </span>
          </div>

          {/* Payment Method Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                <span>Cash</span>
              </div>
              <span className="font-medium">
                ${deposit.breakdown.cash.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Checks</span>
              </div>
              <span className="font-medium">
                ${deposit.breakdown.checks.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Cards</span>
              </div>
              <span className="font-medium">
                ${deposit.breakdown.creditCards.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                <span>ACH</span>
              </div>
              <span className="font-medium">
                ${deposit.breakdown.ach.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Online</span>
              </div>
              <span className="font-medium">
                ${deposit.breakdown.online.toLocaleString()}
              </span>
            </div>
          </div>

          {deposit.bankAccount && (
            <div className="text-sm text-muted-foreground">
              Bank Account: {deposit.bankAccount}
            </div>
          )}

          {deposit.notes && (
            <div className="p-3 bg-muted/50 rounded text-sm">
              <strong>Notes:</strong> {deposit.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button variant="outline" onClick={onViewDetails} size="sm">
                View Details
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" onClick={onEdit} size="sm">
                Edit
              </Button>
            )}
            {deposit.status === "pending" && onDeposit && (
              <Button onClick={onDeposit} size="sm">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Mark Deposited
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Banking summary component
export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  type: "checking" | "savings" | "money_market";
  balance: number;
  availableBalance: number;
  pendingDeposits: number;
  lastUpdated: Date;
}

export interface BankingSummaryProps {
  accounts: BankAccount[];
  totalBalance: number;
  totalPendingDeposits: number;
  onViewAccount?: (accountId: string) => void;
  onReconcile?: () => void;
  className?: string;
}

export function BankingSummary({
  accounts,
  totalBalance,
  totalPendingDeposits,
  onViewAccount,
  onReconcile,
  className,
}: BankingSummaryProps) {
  const getAccountTypeIcon = (type: BankAccount["type"]) => {
    switch (type) {
      case "checking":
        return <CreditCard className="h-4 w-4" />;
      case "savings":
        return <DollarSign className="h-4 w-4" />;
      case "money_market":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Banking Summary</CardTitle>
            <CardDescription>
              Account balances and pending deposits
            </CardDescription>
          </div>
          {onReconcile && (
            <Button variant="outline" onClick={onReconcile}>
              Reconcile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Overall Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-success/5 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Total Balance</span>
              </div>
              <div className="text-2xl font-bold text-success">
                ${totalBalance.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Pending Deposits</span>
              </div>
              <div className="text-2xl font-bold text-warning">
                ${totalPendingDeposits.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Account List */}
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    {getAccountTypeIcon(account.type)}
                  </div>
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ****{account.accountNumber.slice(-4)} • Last updated:{" "}
                      {account.lastUpdated.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    ${account.balance.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Available: ${account.availableBalance.toLocaleString()}
                  </div>
                  {account.pendingDeposits > 0 && (
                    <div className="text-xs text-warning">
                      Pending: ${account.pendingDeposits.toLocaleString()}
                    </div>
                  )}
                </div>

                {onViewAccount && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewAccount(account.id)}
                  >
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Deposit trends component
export interface DepositTrend {
  date: Date;
  amount: number;
  facilityCount: number;
}

export interface DepositTrendsProps {
  trends: DepositTrend[];
  period: "week" | "month" | "quarter";
  onPeriodChange?: (period: "week" | "month" | "quarter") => void;
  className?: string;
}

export function DepositTrends({
  trends,
  period,
  onPeriodChange,
  className,
}: DepositTrendsProps) {
  const totalAmount = trends.reduce((sum, trend) => sum + trend.amount, 0);
  const averageDaily = totalAmount / trends.length;

  // Calculate change from previous period (simplified)
  const currentPeriodTotal = trends
    .slice(-7)
    .reduce((sum, trend) => sum + trend.amount, 0);
  const previousPeriodTotal = trends
    .slice(-14, -7)
    .reduce((sum, trend) => sum + trend.amount, 0);
  const changePercent =
    previousPeriodTotal > 0
      ? ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100
      : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deposit Trends</CardTitle>
            <CardDescription>Daily deposit performance</CardDescription>
          </div>
          {onPeriodChange && (
            <div className="flex gap-1">
              {(["week", "month", "quarter"] as const).map((p) => (
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
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">
                Total Deposits
              </div>
              <div className="text-2xl font-bold">
                ${totalAmount.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Daily Average</div>
              <div className="text-2xl font-bold">
                ${averageDaily.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Change</div>
              <div
                className={cn(
                  "text-2xl font-bold flex items-center gap-1",
                  changePercent >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {changePercent >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {Math.abs(changePercent).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Simple trend visualization */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Daily Deposits</div>
            <div className="space-y-1">
              {trends.slice(-7).map((trend, index) => {
                const maxAmount = Math.max(
                  ...trends.slice(-7).map((t) => t.amount)
                );
                const widthPercent = (trend.amount / maxAmount) * 100;

                return (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-16 text-muted-foreground">
                      {trend.date.toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 relative">
                      <div
                        className="bg-revenue h-2 rounded-full transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <div className="w-20 text-right font-medium">
                      ${trend.amount.toLocaleString()}
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
