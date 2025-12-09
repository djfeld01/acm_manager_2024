"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Filter,
  Eye,
  Calendar,
  Building,
  User,
  DollarSign,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getCurrentMonthYear,
  getMonthName,
} from "@/lib/reconciliation/clientUtils";

interface Discrepancy {
  discrepancyId: number;
  reconciliationId: number;
  discrepancyType: string;
  description: string;
  amount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  notes?: string;
  isCritical: boolean;
  referenceTransactionIds?: number[];
  referenceDailyPaymentIds?: number[];
  // Related data
  facilityId: string;
  facilityName: string;
  reconciliationMonth: number;
  reconciliationYear: number;
  reconciliationStatus: string;
  creatorName?: string;
  creatorEmail?: string;
}

interface ReviewSummary {
  totalDiscrepancies: number;
  criticalCount: number;
  totalAmount: number;
  facilitySummary: Array<{
    facilityId: string;
    facilityName: string;
    count: number;
    amount: number;
    criticalCount: number;
  }>;
}

interface DiscrepancyReviewInterfaceProps {
  userRole: string;
  userId: string;
}

const discrepancyTypeLabels: Record<string, string> = {
  multi_day_combination: "Multi-day Combination",
  refund: "Refund",
  error: "Error",
  timing_difference: "Timing Difference",
  bank_fee: "Bank Fee",
  other: "Other",
};

export function DiscrepancyReviewInterface({
  userRole,
  userId,
}: DiscrepancyReviewInterfaceProps) {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [selectedDiscrepancies, setSelectedDiscrepancies] = useState<
    Set<number>
  >(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkNotes, setBulkNotes] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [facilityFilter, setFacilityFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState<number>(
    getCurrentMonthYear().month
  );
  const [yearFilter, setYearFilter] = useState<number>(
    getCurrentMonthYear().year
  );

  const loadDiscrepancies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        ...(facilityFilter !== "all" && { facilityId: facilityFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
        month: monthFilter.toString(),
        year: yearFilter.toString(),
      });

      const response = await fetch(
        `/api/reconciliation/discrepancies/review?${params}`
      );

      if (response.ok) {
        const data = await response.json();
        setDiscrepancies(data.discrepancies || []);
        setSummary(data.summary || null);
      } else {
        console.error("Failed to load discrepancies");
        // Fallback to mock data for development
        setDiscrepancies([
          {
            discrepancyId: 1,
            reconciliationId: 1,
            discrepancyType: "multi_day_combination",
            description:
              "Bank deposit combines payments from March 15-16, 2024. Daily payments show $1,250.00 on 3/15 and $875.50 on 3/16, but bank shows single deposit of $2,125.50 on 3/16.",
            amount: 2125.5,
            status: "pending_approval",
            createdBy: "user123",
            createdAt: new Date().toISOString(),
            notes:
              "Verified with bank - this is their standard processing for weekend deposits",
            isCritical: true,
            facilityId: "FAC001",
            facilityName: "Downtown Storage",
            reconciliationMonth: monthFilter,
            reconciliationYear: yearFilter,
            reconciliationStatus: "in_progress",
            creatorName: "Sarah Johnson",
            creatorEmail: "sarah.johnson@company.com",
          },
          {
            discrepancyId: 2,
            reconciliationId: 2,
            discrepancyType: "refund",
            description:
              "Credit card refund of $45.00 processed on 3/18 not reflected in daily payments. Customer John Smith, unit 205.",
            amount: 45.0,
            status: "pending_approval",
            createdBy: "user456",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            isCritical: false,
            facilityId: "FAC002",
            facilityName: "Westside Storage",
            reconciliationMonth: monthFilter,
            reconciliationYear: yearFilter,
            reconciliationStatus: "in_progress",
            creatorName: "Mike Chen",
            creatorEmail: "mike.chen@company.com",
          },
        ]);
        setSummary({
          totalDiscrepancies: 2,
          criticalCount: 1,
          totalAmount: 2170.5,
          facilitySummary: [
            {
              facilityId: "FAC001",
              facilityName: "Downtown Storage",
              count: 1,
              amount: 2125.5,
              criticalCount: 1,
            },
            {
              facilityId: "FAC002",
              facilityName: "Westside Storage",
              count: 1,
              amount: 45.0,
              criticalCount: 0,
            },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to load discrepancies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, facilityFilter, priorityFilter, monthFilter, yearFilter]);

  useEffect(() => {
    loadDiscrepancies();
  }, [loadDiscrepancies]);

  const handleSelectDiscrepancy = (
    discrepancyId: number,
    selected: boolean
  ) => {
    const newSelected = new Set(selectedDiscrepancies);
    if (selected) {
      newSelected.add(discrepancyId);
    } else {
      newSelected.delete(discrepancyId);
    }
    setSelectedDiscrepancies(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedDiscrepancies(
        new Set(discrepancies.map((d) => d.discrepancyId))
      );
    } else {
      setSelectedDiscrepancies(new Set());
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedDiscrepancies.size === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/reconciliation/discrepancies/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          discrepancyIds: Array.from(selectedDiscrepancies),
          notes: bulkNotes || null,
        }),
      });

      if (response.ok) {
        // Reload discrepancies
        await loadDiscrepancies();
        setSelectedDiscrepancies(new Set());
        setBulkNotes("");
      } else {
        console.error(`Failed to ${action} discrepancies`);
      }
    } catch (error) {
      console.error(`Failed to ${action} discrepancies:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleAction = async (
    discrepancyId: number,
    action: "approve" | "reject",
    notes?: string
  ) => {
    setIsProcessing(true);
    try {
      const endpoint =
        action === "approve"
          ? "/api/reconciliation/discrepancies/approve"
          : "/api/reconciliation/discrepancies/reject";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discrepancyId,
          [action === "approve" ? "approvalNotes" : "rejectionNotes"]:
            notes || null,
        }),
      });

      if (response.ok) {
        await loadDiscrepancies();
      } else {
        console.error(`Failed to ${action} discrepancy`);
      }
    } catch (error) {
      console.error(`Failed to ${action} discrepancy:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">
            Loading review dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Director Review Dashboard
          </h2>
          <p className="text-muted-foreground">
            Review and approve discrepancies requiring your attention
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pending
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalDiscrepancies}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {summary.facilitySummary.length} facilities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Items
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.criticalCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Need immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                In pending discrepancies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedDiscrepancies.size}
              </div>
              <p className="text-xs text-muted-foreground">
                Items selected for action
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select
                value={monthFilter.toString()}
                onValueChange={(value) => setMonthFilter(parseInt(value))}
              >
                <SelectTrigger>
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
                value={yearFilter.toString()}
                onValueChange={(value) => setYearFilter(parseInt(value))}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Facility</label>
              <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  {summary?.facilitySummary.map((facility) => (
                    <SelectItem
                      key={facility.facilityId}
                      value={facility.facilityId}
                    >
                      {facility.facilityName} ({facility.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {statusFilter === "pending_approval" &&
        selectedDiscrepancies.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Bulk Actions ({selectedDiscrepancies.size} selected)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Add notes for all selected discrepancies..."
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isProcessing}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve All ({selectedDiscrepancies.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Approve Selected Discrepancies
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to approve{" "}
                        {selectedDiscrepancies.size} discrepancies? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleBulkAction("approve")}
                      >
                        Approve All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isProcessing}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject All ({selectedDiscrepancies.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Reject Selected Discrepancies
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reject{" "}
                        {selectedDiscrepancies.size} discrepancies? They will be
                        returned to the Office Manager for revision.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleBulkAction("reject")}
                      >
                        Reject All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Discrepancies List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Discrepancies for Review</CardTitle>
            {statusFilter === "pending_approval" &&
              discrepancies.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={
                      selectedDiscrepancies.size === discrepancies.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <label className="text-sm font-medium">Select All</label>
                </div>
              )}
          </div>
        </CardHeader>
        <CardContent>
          {discrepancies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>No discrepancies found for the selected criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {discrepancies.map((discrepancy) => (
                <DiscrepancyReviewCard
                  key={discrepancy.discrepancyId}
                  discrepancy={discrepancy}
                  isSelected={selectedDiscrepancies.has(
                    discrepancy.discrepancyId
                  )}
                  onSelect={(selected) =>
                    handleSelectDiscrepancy(discrepancy.discrepancyId, selected)
                  }
                  onAction={handleSingleAction}
                  showActions={statusFilter === "pending_approval"}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DiscrepancyReviewCardProps {
  discrepancy: Discrepancy;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onAction: (
    discrepancyId: number,
    action: "approve" | "reject",
    notes?: string
  ) => void;
  showActions: boolean;
  isProcessing: boolean;
}

function DiscrepancyReviewCard({
  discrepancy,
  isSelected,
  onSelect,
  onAction,
  showActions,
  isProcessing,
}: DiscrepancyReviewCardProps) {
  const [actionNotes, setActionNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);

  return (
    <div
      className={`border rounded-lg p-4 space-y-4 ${
        isSelected ? "border-blue-500 bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {showActions && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {discrepancyTypeLabels[discrepancy.discrepancyType] ||
                  discrepancy.discrepancyType}
              </Badge>
              {discrepancy.isCritical && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Critical
                </Badge>
              )}
              {discrepancy.status === "pending_approval" && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
              {discrepancy.status === "approved" && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {discrepancy.status === "rejected" && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(discrepancy.amount)}
            </div>
          </div>
        </div>

        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            {discrepancy.facilityName}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {getMonthName(discrepancy.reconciliationMonth)}{" "}
            {discrepancy.reconciliationYear}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {discrepancy.creatorName || "Unknown"}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Description:</div>
        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
          {discrepancy.description}
        </div>
      </div>

      {discrepancy.notes && (
        <div className="space-y-2">
          <div className="font-medium">Additional Notes:</div>
          <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
            {discrepancy.notes}
          </div>
        </div>
      )}

      {(discrepancy.referenceTransactionIds ||
        discrepancy.referenceDailyPaymentIds) && (
        <div className="space-y-2">
          <div className="font-medium">References:</div>
          <div className="text-sm text-muted-foreground">
            {discrepancy.referenceTransactionIds && (
              <div>
                Bank Transactions:{" "}
                {discrepancy.referenceTransactionIds.join(", ")}
              </div>
            )}
            {discrepancy.referenceDailyPaymentIds && (
              <div>
                Daily Payments:{" "}
                {discrepancy.referenceDailyPaymentIds.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Created: {formatDate(discrepancy.createdAt)} by{" "}
        {discrepancy.creatorName}
      </div>

      {showActions && (
        <div className="space-y-3 pt-3 border-t">
          {showNotesInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Notes:</label>
              <Textarea
                placeholder="Add notes for your decision..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              size="sm"
              onClick={() =>
                onAction(discrepancy.discrepancyId, "approve", actionNotes)
              }
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                onAction(discrepancy.discrepancyId, "reject", actionNotes)
              }
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotesInput(!showNotesInput)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {showNotesInput ? "Hide" : "Add"} Notes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
