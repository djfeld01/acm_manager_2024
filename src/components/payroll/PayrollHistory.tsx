"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PayrollCard, PayrollData } from "./PayrollCard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import {
  Calendar,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PayrollPeriod {
  payPeriodId: string;
  startDate: string;
  endDate: string;
  status: "draft" | "committed" | "paid";
  year: number;
}

interface PayrollHistoryProps {
  employeeId: string;
  employeeName: string;
  payrollHistory: PayrollData[];
  payrollPeriods: PayrollPeriod[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onExportHistory?: (format: "csv" | "pdf") => void;
  onViewPayrollDetails?: (payrollData: PayrollData) => void;
  className?: string;
}

export function PayrollHistory({
  employeeId,
  employeeName,
  payrollHistory,
  payrollPeriods,
  isLoading = false,
  error = null,
  onRetry,
  onExportHistory,
  onViewPayrollDetails,
  className,
}: PayrollHistoryProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Get unique years from payroll periods
  const availableYears = Array.from(
    new Set(payrollPeriods.map((period) => period.year))
  ).sort((a, b) => b - a);

  // Filter payroll history
  const filteredHistory = payrollHistory.filter((payroll) => {
    const matchesYear =
      selectedYear === "all" ||
      new Date(payroll.payPeriodStart).getFullYear().toString() ===
        selectedYear;

    const period = payrollPeriods.find(
      (p) => p.payPeriodId === payroll.payPeriodId
    );
    const matchesStatus =
      selectedStatus === "all" || period?.status === selectedStatus;

    const matchesSearch =
      searchTerm === "" ||
      payroll.payPeriodId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.locationName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesYear && matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Calculate totals for the filtered period
  const totalEarnings = filteredHistory.reduce(
    (sum, payroll) => sum + payroll.totalPay,
    0
  );
  const totalCommission = filteredHistory.reduce(
    (sum, payroll) => sum + payroll.commission,
    0
  );
  const totalBonuses = filteredHistory.reduce(
    (sum, payroll) => sum + payroll.monthlyBonus + payroll.christmasBonus,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton />
        <div className="grid gap-4 md:grid-cols-2">
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
              Failed to load payroll history
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

  return (
    <ComponentErrorBoundary>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Payroll History
            </h2>
            <p className="text-muted-foreground">
              {employeeName} • {filteredHistory.length} pay periods
            </p>
          </div>

          {onExportHistory && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportHistory("csv")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportHistory("pdf")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          )}
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
                    {formatCurrency(totalEarnings)}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
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
                    {formatCurrency(totalCommission)}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
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
                    {formatCurrency(totalBonuses)}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="year-select">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-select">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="committed">Committed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search periods or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedYear("all");
                    setSelectedStatus("all");
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll History Grid */}
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">No payroll records found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your filters or check back later
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {paginatedHistory.map((payroll) => {
                const period = payrollPeriods.find(
                  (p) => p.payPeriodId === payroll.payPeriodId
                );
                return (
                  <div key={payroll.payPeriodId} className="relative">
                    <PayrollCard
                      payrollData={payroll}
                      onViewDetails={() => onViewPayrollDetails?.(payroll)}
                      className="h-full"
                    />
                    {period && (
                      <Badge
                        variant={
                          period.status === "paid"
                            ? "default"
                            : period.status === "committed"
                            ? "secondary"
                            : "outline"
                        }
                        className="absolute top-2 right-2"
                      >
                        {period.status}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredHistory.length)}{" "}
                  of {filteredHistory.length} records
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ComponentErrorBoundary>
  );
}
