"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Building2,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  getCurrentMonthYear,
  getMonthName,
} from "@/lib/reconciliation/clientUtils";
import Link from "next/link";

// Types for dashboard data
interface FacilityReconciliationStatus {
  facilityId: string;
  facilityName: string;
  bankAccountIds: number[];
  status: "not_started" | "in_progress" | "pending_review" | "completed";
  totalTransactions: number;
  matchedTransactions: number;
  discrepancies: number;
  totalAmount: number;
  lastUpdated?: string;
  assignedTo?: string;
}

interface DashboardStats {
  totalFacilities: number;
  completedReconciliations: number;
  pendingReview: number;
  inProgress: number;
  totalDiscrepancies: number;
  totalAmount: number;
  matchingAccuracy: number;
}

interface MonthlyReconciliationDashboardProps {
  userId: string;
  userRole: string;
}

export function MonthlyReconciliationDashboard({
  userId,
  userRole,
}: MonthlyReconciliationDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getCurrentMonthYear().month
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    getCurrentMonthYear().year
  );
  const [facilities, setFacilities] = useState<FacilityReconciliationStatus[]>(
    []
  );
  const [stats, setStats] = useState<DashboardStats>({
    totalFacilities: 0,
    completedReconciliations: 0,
    pendingReview: 0,
    inProgress: 0,
    totalDiscrepancies: 0,
    totalAmount: 0,
    matchingAccuracy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reconciliation/dashboard?month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const data = await response.json();

      setFacilities(data.facilities || []);
      setStats(
        data.stats || {
          totalFacilities: 0,
          completedReconciliations: 0,
          pendingReview: 0,
          inProgress: 0,
          totalDiscrepancies: 0,
          totalAmount: 0,
          matchingAccuracy: 0,
        }
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);

      // Fallback to mock data if API fails
      const mockFacilities: FacilityReconciliationStatus[] = [
        {
          facilityId: "FAC001",
          facilityName: "Downtown Storage",
          bankAccountIds: [1],
          status: "completed",
          totalTransactions: 45,
          matchedTransactions: 43,
          discrepancies: 2,
          totalAmount: 12500.75,
          lastUpdated: "2024-09-15T10:30:00Z",
          assignedTo: "Office Manager",
        },
        {
          facilityId: "FAC002",
          facilityName: "Westside Storage",
          bankAccountIds: [2],
          status: "pending_review",
          totalTransactions: 38,
          matchedTransactions: 35,
          discrepancies: 3,
          totalAmount: 9800.5,
          lastUpdated: "2024-09-14T16:45:00Z",
          assignedTo: "Office Manager",
        },
        {
          facilityId: "FAC003",
          facilityName: "North Point Storage",
          bankAccountIds: [3],
          status: "in_progress",
          totalTransactions: 52,
          matchedTransactions: 28,
          discrepancies: 1,
          totalAmount: 15200.25,
          lastUpdated: "2024-09-13T14:20:00Z",
          assignedTo: "Office Manager",
        },
        {
          facilityId: "FAC004",
          facilityName: "Southgate Storage",
          bankAccountIds: [4, 5], // Example of multiple bank accounts
          status: "not_started",
          totalTransactions: 41,
          matchedTransactions: 0,
          discrepancies: 0,
          totalAmount: 11750.0,
        },
      ];

      setFacilities(mockFacilities);

      // Calculate stats for fallback data
      const mockStats: DashboardStats = {
        totalFacilities: mockFacilities.length,
        completedReconciliations: mockFacilities.filter(
          (f) => f.status === "completed"
        ).length,
        pendingReview: mockFacilities.filter(
          (f) => f.status === "pending_review"
        ).length,
        inProgress: mockFacilities.filter((f) => f.status === "in_progress")
          .length,
        totalDiscrepancies: mockFacilities.reduce(
          (sum, f) => sum + f.discrepancies,
          0
        ),
        totalAmount: mockFacilities.reduce((sum, f) => sum + f.totalAmount, 0),
        matchingAccuracy:
          mockFacilities.reduce(
            (sum, f) =>
              sum + (f.matchedTransactions / f.totalTransactions) * 100,
            0
          ) / mockFacilities.length,
      };

      setStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleStartReconciliation = async (facilityId: string) => {
    try {
      const response = await fetch("/api/reconciliation/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facilityId,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start reconciliation");
      }

      const result = await response.json();
      console.log("Reconciliation started:", result);

      // Refresh data after starting
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to start reconciliation:", error);
      // You might want to show a toast notification here
      alert(
        `Failed to start reconciliation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const getStatusBadge = (status: FacilityReconciliationStatus["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending_review":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        );
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "not_started":
        return <Badge variant="outline">Not Started</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProgressPercentage = (facility: FacilityReconciliationStatus) => {
    if (facility.totalTransactions === 0) return 0;
    return Math.round(
      (facility.matchedTransactions / facility.totalTransactions) * 100
    );
  };

  // Generate year options (current year and previous 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Reconciliation Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={loadDashboardData}
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Facilities
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFacilities}</div>
            <p className="text-xs text-muted-foreground">
              Facilities to reconcile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedReconciliations}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFacilities > 0
                ? `${Math.round(
                    (stats.completedReconciliations / stats.totalFacilities) *
                      100
                  )}% complete`
                : "0% complete"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingReview}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalDiscrepancies}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Facilities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Facility Reconciliation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Discrepancies</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.map((facility) => (
                <TableRow key={facility.facilityId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{facility.facilityName}</div>
                      <div className="text-sm text-muted-foreground">
                        {facility.facilityId} • {facility.bankAccountIds.length}{" "}
                        account{facility.bankAccountIds.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(facility.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={getProgressPercentage(facility)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">
                          {getProgressPercentage(facility)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {facility.matchedTransactions} of{" "}
                        {facility.totalTransactions} matched
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {facility.discrepancies > 0 ? (
                      <Badge variant="destructive">
                        {facility.discrepancies}
                      </Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ${facility.totalAmount.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {facility.status === "not_started" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStartReconciliation(facility.facilityId)
                          }
                        >
                          Start
                        </Button>
                      )}
                      {facility.status !== "not_started" && (
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/reconciliation/${facility.facilityId}?month=${selectedMonth}&year=${selectedYear}`}
                          >
                            {facility.status === "completed"
                              ? "View"
                              : "Continue"}
                          </Link>
                        </Button>
                      )}
                      {facility.status === "pending_review" &&
                        userRole === "ADMIN" && (
                          <Button size="sm" variant="secondary" asChild>
                            <Link
                              href={`/reconciliation/${facility.facilityId}/review?month=${selectedMonth}&year=${selectedYear}`}
                            >
                              Review
                            </Link>
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalFacilities > 0
                      ? Math.round(
                          (stats.completedReconciliations /
                            stats.totalFacilities) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    stats.totalFacilities > 0
                      ? (stats.completedReconciliations /
                          stats.totalFacilities) *
                        100
                      : 0
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Matching Accuracy</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(stats.matchingAccuracy)}%
                  </span>
                </div>
                <Progress value={stats.matchingAccuracy} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </div>
                <div className="text-2xl font-bold">
                  ${stats.totalAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Period
                </div>
                <div className="text-lg font-medium">
                  {getMonthName(selectedMonth)} {selectedYear}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
