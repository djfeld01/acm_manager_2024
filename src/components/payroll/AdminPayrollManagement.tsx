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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import {
  Shield,
  DollarSign,
  Users,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Play,
  Pause,
  Lock,
  Unlock,
  FileText,
  Calculator,
  Settings,
  Plus,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PayrollPeriodAdmin {
  payPeriodId: string;
  startDate: string;
  endDate: string;
  status: "draft" | "committed" | "paid" | "processing";
  totalEmployees: number;
  totalPayroll: number;
  processedEmployees: number;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export interface PayrollSummaryAdmin {
  totalEmployees: number;
  totalLocations: number;
  totalPayroll: number;
  pendingApprovals: number;
  processingErrors: number;
  completedPayrolls: number;
}

export interface BatchOperation {
  operationId: string;
  type: "approve" | "process" | "export" | "calculate";
  status: "pending" | "running" | "completed" | "failed";
  employeeCount: number;
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface AdminPayrollManagementProps {
  payrollPeriods: PayrollPeriodAdmin[];
  payrollSummary: PayrollSummaryAdmin;
  batchOperations: BatchOperation[];
  selectedPeriodId?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onPeriodChange?: (periodId: string) => void;
  onCreatePeriod?: (startDate: string, endDate: string) => void;
  onProcessPeriod?: (periodId: string) => void;
  onApprovePeriod?: (periodId: string) => void;
  onExportPayroll?: (periodId: string, format: "csv" | "pdf" | "ach") => void;
  onBatchOperation?: (operation: string, employeeIds: string[]) => void;
  onCancelOperation?: (operationId: string) => void;
  className?: string;
}

export function AdminPayrollManagement({
  payrollPeriods,
  payrollSummary,
  batchOperations,
  selectedPeriodId,
  isLoading = false,
  error = null,
  onRetry,
  onPeriodChange,
  onCreatePeriod,
  onProcessPeriod,
  onApprovePeriod,
  onExportPayroll,
  onBatchOperation,
  onCancelOperation,
  className,
}: AdminPayrollManagementProps) {
  const [showCreatePeriod, setShowCreatePeriod] = useState(false);
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "committed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Settings className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "outline";
      case "committed":
        return "secondary";
      case "paid":
        return "default";
      case "processing":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleCreatePeriod = () => {
    if (newPeriodStart && newPeriodEnd && onCreatePeriod) {
      onCreatePeriod(newPeriodStart, newPeriodEnd);
      setShowCreatePeriod(false);
      setNewPeriodStart("");
      setNewPeriodEnd("");
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
              Failed to load payroll management data
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
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Payroll Management
              </h2>
              <p className="text-muted-foreground">
                Administrative payroll oversight and processing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowCreatePeriod(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Period
            </Button>
            {selectedPeriodId && onExportPayroll && (
              <Button
                variant="outline"
                onClick={() => onExportPayroll(selectedPeriodId, "csv")}
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
                  <p className="text-sm text-muted-foreground">
                    Total Employees
                  </p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.totalEmployees}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across {payrollSummary.totalLocations} locations
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
                  <p className="text-sm text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(payrollSummary.totalPayroll)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current period
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
                    Pending Approvals
                  </p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.pendingApprovals}
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

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Processing Errors
                  </p>
                  <p className="text-2xl font-bold">
                    {payrollSummary.processingErrors}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Need resolution
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Pay Periods</TabsTrigger>
            <TabsTrigger value="operations">Batch Operations</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          </TabsList>

          {/* Pay Periods Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Pay Periods Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Payroll</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollPeriods.map((period) => (
                      <TableRow key={period.payPeriodId}>
                        <TableCell className="font-medium">
                          <div>
                            <div>
                              {formatDate(period.startDate)} -{" "}
                              {formatDate(period.endDate)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {period.payPeriodId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(period.status)}
                            <Badge
                              variant={getStatusColor(period.status) as any}
                            >
                              {period.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {period.totalEmployees}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {period.processedEmployees} processed
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(period.totalPayroll)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>
                                {Math.round(
                                  (period.processedEmployees /
                                    period.totalEmployees) *
                                    100
                                )}
                                %
                              </span>
                              <span>
                                {period.processedEmployees}/
                                {period.totalEmployees}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${
                                    (period.processedEmployees /
                                      period.totalEmployees) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(period.lastModified)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {period.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onProcessPeriod?.(period.payPeriodId)
                                }
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {period.status === "committed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onApprovePeriod?.(period.payPeriodId)
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onExportPayroll?.(period.payPeriodId, "csv")
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Operations Tab */}
          <TabsContent value="operations" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => onBatchOperation?.("calculate", [])}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Recalculate All Payrolls
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => onBatchOperation?.("approve", [])}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Bulk Approve Payrolls
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => onBatchOperation?.("export", [])}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => onBatchOperation?.("process", [])}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Process Pending
                  </Button>
                </CardContent>
              </Card>

              {/* Active Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Active Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {batchOperations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active operations
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {batchOperations.map((operation) => (
                        <div
                          key={operation.operationId}
                          className="border rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  operation.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {operation.type}
                              </Badge>
                              <span className="text-sm font-medium">
                                {operation.employeeCount} employees
                              </span>
                            </div>
                            {operation.status === "running" &&
                              onCancelOperation && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    onCancelOperation(operation.operationId)
                                  }
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{operation.progress}%</span>
                              <span>{formatDateTime(operation.startedAt)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${operation.progress}%` }}
                              />
                            </div>
                          </div>

                          {operation.error && (
                            <p className="text-xs text-red-600 mt-2">
                              {operation.error}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payroll Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Summary Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Detailed Breakdown
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Tax Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Payroll Trends
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    Location Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Employee Metrics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compliance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Audit Trail
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="mr-2 h-4 w-4" />
                    Access Log
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Compliance Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Period Modal */}
        <Dialog open={showCreatePeriod} onOpenChange={setShowCreatePeriod}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pay Period</DialogTitle>
              <DialogDescription>
                Set up a new payroll period for processing employee
                compensation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newPeriodStart}
                  onChange={(e) => setNewPeriodStart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newPeriodEnd}
                  onChange={(e) => setNewPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreatePeriod(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePeriod}>Create Period</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ComponentErrorBoundary>
  );
}
