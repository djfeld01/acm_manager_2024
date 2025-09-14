"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PayrollCard, PayrollData } from "./PayrollCard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import {
  MapPin,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationPayrollData {
  locationId: string;
  locationName: string;
  locationAbbreviation: string;
  payrollData: PayrollData[];
  totalEarnings: number;
  totalCommission: number;
  totalBonuses: number;
  isActive: boolean;
}

// Import PayrollPeriod from PayrollHistory to maintain consistency
import type { PayrollPeriod } from "./PayrollHistory";

interface MultiLocationPayrollProps {
  employeeId: string;
  employeeName: string;
  locationPayrolls: LocationPayrollData[];
  payrollPeriods: PayrollPeriod[];
  selectedPeriodId?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onPeriodChange?: (periodId: string) => void;
  onViewLocationDetails?: (locationId: string) => void;
  onViewPayrollDetails?: (payrollData: PayrollData) => void;
  className?: string;
}

export function MultiLocationPayroll({
  employeeId,
  employeeName,
  locationPayrolls,
  payrollPeriods,
  selectedPeriodId,
  isLoading = false,
  error = null,
  onRetry,
  onPeriodChange,
  onViewLocationDetails,
  onViewPayrollDetails,
  className,
}: MultiLocationPayrollProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

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

  // Calculate totals across all locations
  const grandTotals = locationPayrolls.reduce(
    (totals, location) => ({
      earnings: totals.earnings + location.totalEarnings,
      commission: totals.commission + location.totalCommission,
      bonuses: totals.bonuses + location.totalBonuses,
    }),
    { earnings: 0, commission: 0, bonuses: 0 }
  );

  // Filter locations based on selection
  const filteredLocations =
    selectedLocationId === "all"
      ? locationPayrolls
      : locationPayrolls.filter((loc) => loc.locationId === selectedLocationId);

  // Get current period info
  const currentPeriod = payrollPeriods.find(
    (p) => p.payPeriodId === selectedPeriodId
  );

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
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
            <p className="text-sm font-medium">Failed to load payroll data</p>
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

  return (
    <ComponentErrorBoundary>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Multi-Location Payroll
            </h2>
            <p className="text-muted-foreground">
              {employeeName} • {locationPayrolls.length} locations
            </p>
            {currentPeriod && (
              <p className="text-sm text-muted-foreground">
                Pay Period: {formatDate(currentPeriod.startDate)} -{" "}
                {formatDate(currentPeriod.endDate)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            {onPeriodChange && (
              <Select value={selectedPeriodId} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  {payrollPeriods.map((period) => (
                    <SelectItem
                      key={period.payPeriodId}
                      value={period.payPeriodId}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {formatDate(period.startDate)} -{" "}
                          {formatDate(period.endDate)}
                        </span>
                        <Badge
                          variant={
                            period.status === "paid"
                              ? "default"
                              : period.status === "committed"
                              ? "secondary"
                              : "outline"
                          }
                          className="ml-2"
                        >
                          {period.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Location Filter */}
            <Select
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locationPayrolls.map((location) => (
                  <SelectItem
                    key={location.locationId}
                    value={location.locationId}
                  >
                    {location.locationAbbreviation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(grandTotals.earnings)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across {locationPayrolls.length} locations
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Commission
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(grandTotals.commission)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Performance-based earnings
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bonuses</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(grandTotals.bonuses)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Monthly & holiday bonuses
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Tabs or Cards */}
        {locationPayrolls.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">No payroll data found</p>
              <p className="text-xs text-muted-foreground">
                No payroll records for the selected period
              </p>
            </CardContent>
          </Card>
        ) : locationPayrolls.length <= 3 ? (
          // Show as cards for few locations
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((location) => (
              <Card key={location.locationId} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {location.locationName}
                      </CardTitle>
                    </div>
                    <Badge variant="outline">
                      {location.locationAbbreviation}
                    </Badge>
                  </div>
                  {!location.isActive && (
                    <Badge variant="secondary" className="w-fit">
                      Inactive
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Earnings</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(location.totalEarnings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Commission
                      </p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(location.totalCommission)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bonuses</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(location.totalBonuses)}
                      </p>
                    </div>
                  </div>

                  {location.payrollData.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Recent Payroll:
                      </p>
                      {location.payrollData.slice(0, 2).map((payroll) => (
                        <div
                          key={payroll.payPeriodId}
                          className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm"
                        >
                          <span>{formatDate(payroll.payPeriodStart)}</span>
                          <span className="font-medium">
                            {formatCurrency(payroll.totalPay)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewLocationDetails?.(location.locationId)}
                    className="w-full"
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Show as tabs for many locations
          <Tabs
            value={selectedLocationId}
            onValueChange={setSelectedLocationId}
          >
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              {locationPayrolls.slice(0, 5).map((location) => (
                <TabsTrigger
                  key={location.locationId}
                  value={location.locationId}
                >
                  {location.locationAbbreviation}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {locationPayrolls.map((location) =>
                  location.payrollData.map((payroll) => (
                    <PayrollCard
                      key={`${location.locationId}-${payroll.payPeriodId}`}
                      payrollData={payroll}
                      onViewDetails={() => onViewPayrollDetails?.(payroll)}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {locationPayrolls.map((location) => (
              <TabsContent
                key={location.locationId}
                value={location.locationId}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {location.locationName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {location.payrollData.length} pay periods
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => onViewLocationDetails?.(location.locationId)}
                  >
                    View All History
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {location.payrollData.map((payroll) => (
                    <PayrollCard
                      key={payroll.payPeriodId}
                      payrollData={payroll}
                      showLocationInfo={false}
                      onViewDetails={() => onViewPayrollDetails?.(payroll)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </ComponentErrorBoundary>
  );
}
