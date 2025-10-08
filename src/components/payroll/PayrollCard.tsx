"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  Gift,
  Car,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PayrollData {
  employeeId: string;
  employeeName: string;
  payPeriodId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  locationName: string;
  locationAbbreviation: string;

  // Base compensation
  basePay: number;
  vacationHours: number;
  holidayHours: number;

  // Bonuses and commissions
  monthlyBonus: number;
  christmasBonus: number;
  commission: number;
  commissionCount: number;

  // Other compensation
  mileageDollars: number;

  // Status indicators
  hasUnpaidCommission: boolean;
  unpaidCommissionCount: number;

  // Totals
  totalPay: number;

  // Breakdown data (optional)
  monthlyBonusBreakdown?: Array<{
    bonusType: string;
    amount: number;
    month: string;
    date: string;
  }>;

  commissionBreakdown?: Array<{
    date: string;
    unitName: string;
    tenantName: string;
    hasInsurance: boolean;
    amount: number;
  }>;
}

interface PayrollCardProps {
  payrollData: PayrollData;
  showLocationInfo?: boolean;
  onViewDetails?: () => void;
  onViewBreakdown?: (type: "bonus" | "commission") => void;
  className?: string;
}

export function PayrollCard({
  payrollData,
  showLocationInfo = true,
  onViewDetails,
  onViewBreakdown,
  className,
}: PayrollCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {payrollData.employeeName}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(payrollData.payPeriodStart)} -{" "}
                {formatDate(payrollData.payPeriodEnd)}
              </span>
            </div>
            {showLocationInfo && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{payrollData.locationName}</span>
                <Badge variant="outline" className="text-xs">
                  {payrollData.locationAbbreviation}
                </Badge>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(payrollData.totalPay)}
            </div>
            <div className="text-xs text-muted-foreground">Total Pay</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Base Pay Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hours & Base Pay
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vacation Hours:</span>
              <span className="font-medium">{payrollData.vacationHours}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holiday Hours:</span>
              <span className="font-medium">{payrollData.holidayHours}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bonuses Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Bonuses
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Monthly Bonus:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatCurrency(payrollData.monthlyBonus)}
                </span>
                {payrollData.monthlyBonusBreakdown &&
                  payrollData.monthlyBonusBreakdown.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onViewBreakdown?.("bonus")}
                    >
                      Details
                    </Button>
                  )}
              </div>
            </div>

            {payrollData.christmasBonus > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Christmas Bonus:
                </span>
                <span className="font-medium">
                  {formatCurrency(payrollData.christmasBonus)}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Commission Section */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Commission
          </h4>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Commission ({payrollData.commissionCount} rentals):
              </span>
              {payrollData.hasUnpaidCommission && (
                <Badge variant="destructive" className="text-xs">
                  {payrollData.unpaidCommissionCount} unpaid
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {formatCurrency(payrollData.commission)}
              </span>
              {payrollData.commissionBreakdown &&
                payrollData.commissionBreakdown.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onViewBreakdown?.("commission")}
                  >
                    Details
                  </Button>
                )}
            </div>
          </div>
        </div>

        {/* Mileage Section */}
        {payrollData.mileageDollars > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Car className="h-4 w-4" />
                Mileage:
              </span>
              <span className="font-medium">
                {formatCurrency(payrollData.mileageDollars)}
              </span>
            </div>
          </>
        )}

        {/* Actions */}
        {onViewDetails && (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                <Award className="mr-2 h-4 w-4" />
                View Full Details
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
