"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PayrollCard, PayrollData } from "./PayrollCard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import {
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  employeeId: string;
  employeeName: string;
  role: string;
  locationId: string;
  locationName: string;
  locationAbbreviation: string;
  isActive: boolean;
  hireDate: string;
  payrollData?: PayrollData;
}

export interface TeamPayrollSummary {
  totalTeamMembers: number;
  activeMembers: number;
  totalPayroll: number;
  totalCommission: number;
  totalBonuses: number;
  unpaidCommissionCount: number;
  averagePayPerEmployee: number;
}

interface TeamPayrollOverviewProps {
  managerId: string;
  managerName: string;
  teamMembers: TeamMember[];
  payrollSummary: TeamPayrollSummary;
  selectedPeriodId?: string;
  payrollPeriods?: Array<{
    payPeriodId: string;
    startDate: string;
    endDate: string;
    status: "draft" | "committed" | "paid";
  }>;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onPeriodChange?: (periodId: string) => void;
  onViewEmployeeDetails?: (employeeId: string) => void;
  onExportTeamPayroll?: (format: "csv" | "pdf") => void;
  onProcessPayroll?: (employeeIds: string[]) => void;
  className?: string;
}

export function TeamPayrollOverview({
  managerId,
  managerName,
  teamMembers,
  payrollSummary,
  selectedPeriodId,
  payrollPeriods = [],
  isLoading = false,
  error = null,
  onRetry,
  onPeriodChange,
  onViewEmployeeDetails,
  onExportTeamPayroll,
  onProcessPayroll,
  className,
}: TeamPayrollOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

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

  // Get unique locations
  const locations = Array.from(
    new Set(teamMembers.map((member) => member.locationName))
  );

  // Filter team members
  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      searchTerm === "" ||
      member.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.locationName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      selectedLocation === "all" || member.locationName === selectedLocation;

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && member.isActive) ||
      (selectedStatus === "inactive" && !member.isActive) ||
      (selectedStatus === "unpaid" && member.payrollData?.hasUnpaidCommission);

    return matchesSearch && matchesLocation && matchesStatus;
  });

  const handleSelectEmployee = (employeeId: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees((prev) => [...prev, employeeId]);
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredMembers.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredMembers.map((member) => member.employeeId));
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
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
            <p className="text-sm font-medium">
              Failed to load team payroll data
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Team Payroll Overview
            </h2>
            <p className="text-muted-foreground">
              {managerName} • {payrollSummary.totalTeamMembers} team members
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            {onPeriodChange && payrollPeriods.length > 0 && (
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

            {/* Export Button */}
            {onExportTeamPayroll && (
              <Button
                variant="outline"
                onClick={() => onExportTeamPayroll("csv")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(payrollSummary.totalPayroll)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(payrollSummary.averagePayPerEmployee)}
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
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.activeMembers}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {payrollSummary.totalTeamMembers} total
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
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
                    {formatCurrency(payrollSummary.totalCommission)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Performance earnings
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
                  <p className="text-sm text-muted-foreground">Unpaid Items</p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.unpaidCommissionCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-select">Location</Label>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger id="location-select">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unpaid">Has Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="view-mode">View Mode</Label>
                <Select
                  value={viewMode}
                  onValueChange={(value: "cards" | "table") =>
                    setViewMode(value)
                  }
                >
                  <SelectTrigger id="view-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cards">Cards</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedLocation("all");
                      setSelectedStatus("all");
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  {selectedEmployees.length > 0 && onProcessPayroll && (
                    <Button
                      onClick={() => onProcessPayroll(selectedEmployees)}
                      className="flex-1"
                    >
                      Process ({selectedEmployees.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Display */}
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">No team members found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your filters or check back later
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredMembers.map((member) => (
              <div key={member.employeeId} className="relative">
                {member.payrollData ? (
                  <PayrollCard
                    payrollData={member.payrollData}
                    onViewDetails={() =>
                      onViewEmployeeDetails?.(member.employeeId)
                    }
                    className="h-full"
                  />
                ) : (
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold">
                            {member.employeeName}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{member.locationName}</span>
                            <Badge variant="outline" className="text-xs">
                              {member.locationAbbreviation}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                        <Badge
                          variant={member.isActive ? "default" : "secondary"}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        No payroll data for selected period
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onViewEmployeeDetails?.(member.employeeId)
                        }
                        className="mt-2"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Selection checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(member.employeeId)}
                    onChange={(e) =>
                      handleSelectEmployee(member.employeeId, e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedEmployees.length === filteredMembers.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Pay</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.employeeId}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(
                            member.employeeId
                          )}
                          onChange={(e) =>
                            handleSelectEmployee(
                              member.employeeId,
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {member.employeeName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{member.locationName}</span>
                          <Badge variant="outline" className="text-xs">
                            {member.locationAbbreviation}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{member.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={member.isActive ? "default" : "secondary"}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {member.payrollData?.hasUnpaidCommission && (
                            <Badge variant="destructive" className="text-xs">
                              Unpaid
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {member.payrollData
                          ? formatCurrency(member.payrollData.totalPay)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.payrollData
                          ? formatCurrency(member.payrollData.commission)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onViewEmployeeDetails?.(member.employeeId)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </ComponentErrorBoundary>
  );
}
