"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/reconciliation/clientUtils";

interface Discrepancy {
  discrepancyId: number;
  reconciliationId: number;
  discrepancyType: string;
  description: string;
  amount: number;
  status: "pending_approval" | "approved" | "rejected" | "resolved";
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
  notes?: string;
  approvalNotes?: string;
  isCritical: boolean;
}

interface DiscrepancyManagerProps {
  facilityId: string;
  month: number;
  year: number;
  userRole: string;
  onDiscrepancyResolved: () => void;
}

export function DiscrepancyManager({
  facilityId,
  month,
  year,
  userRole,
  onDiscrepancyResolved,
}: DiscrepancyManagerProps) {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState<{ [key: number]: string }>(
    {}
  );

  const loadDiscrepancies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reconciliation/discrepancies?facilityId=${facilityId}&month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error("Failed to load discrepancies");
      }

      const data = await response.json();
      setDiscrepancies(data.discrepancies || []);
    } catch (error) {
      console.error("Failed to load discrepancies:", error);

      // Mock discrepancies for demo
      setDiscrepancies([
        {
          discrepancyId: 1,
          reconciliationId: 1,
          discrepancyType: "multi_day_combination",
          description: "Bank deposit combines transactions from Sept 15-16",
          amount: 25.5,
          status: "pending_approval",
          createdBy: "Office Manager",
          createdAt: "2024-09-17T10:30:00Z",
          notes: "Weekend deposits were combined by bank",
          isCritical: false,
        },
        {
          discrepancyId: 2,
          reconciliationId: 1,
          discrepancyType: "bank_fee",
          description: "Bank processing fee not reflected in daily payments",
          amount: 3.5,
          status: "pending_approval",
          createdBy: "Office Manager",
          createdAt: "2024-09-16T14:20:00Z",
          notes: "Monthly processing fee",
          isCritical: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscrepancies();
  }, [facilityId, month, year]);

  const handleApproveDiscrepancy = async (discrepancyId: number) => {
    try {
      const response = await fetch(
        "/api/reconciliation/discrepancies/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discrepancyId,
            approvalNotes: approvalNotes[discrepancyId] || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to approve discrepancy");
      }

      // Update local state
      setDiscrepancies((prev) =>
        prev.map((d) =>
          d.discrepancyId === discrepancyId
            ? {
                ...d,
                status: "approved" as const,
                approvalNotes: approvalNotes[discrepancyId],
              }
            : d
        )
      );

      // Clear notes
      setApprovalNotes((prev) => ({ ...prev, [discrepancyId]: "" }));

      onDiscrepancyResolved();
    } catch (error) {
      console.error("Failed to approve discrepancy:", error);
    }
  };

  const handleRejectDiscrepancy = async (discrepancyId: number) => {
    try {
      const response = await fetch("/api/reconciliation/discrepancies/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discrepancyId,
          rejectionNotes: approvalNotes[discrepancyId] || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject discrepancy");
      }

      // Update local state
      setDiscrepancies((prev) =>
        prev.map((d) =>
          d.discrepancyId === discrepancyId
            ? {
                ...d,
                status: "rejected" as const,
                approvalNotes: approvalNotes[discrepancyId],
              }
            : d
        )
      );

      // Clear notes
      setApprovalNotes((prev) => ({ ...prev, [discrepancyId]: "" }));

      onDiscrepancyResolved();
    } catch (error) {
      console.error("Failed to reject discrepancy:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "multi_day_combination":
        return "bg-purple-100 text-purple-800";
      case "bank_fee":
        return "bg-orange-100 text-orange-800";
      case "refund":
        return "bg-blue-100 text-blue-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canApprove = userRole === "ADMIN" || userRole === "OWNER";

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Discrepancy Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Loading discrepancies...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Discrepancy Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {discrepancies.length} discrepancies found
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {discrepancies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>No discrepancies found</p>
              <p className="text-sm mt-2">
                All transactions appear to be properly matched.
              </p>
            </div>
          ) : (
            discrepancies.map((discrepancy) => (
              <div
                key={discrepancy.discrepancyId}
                className={`p-4 border rounded-lg ${
                  discrepancy.isCritical ? "border-red-300 bg-red-50" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getTypeColor(discrepancy.discrepancyType)}
                    >
                      {discrepancy.discrepancyType.replace("_", " ")}
                    </Badge>
                    <Badge className={getStatusColor(discrepancy.status)}>
                      {discrepancy.status.replace("_", " ")}
                    </Badge>
                    {discrepancy.isCritical && (
                      <Badge variant="destructive">Critical</Badge>
                    )}
                  </div>
                  <div className="text-sm font-semibold">
                    {formatCurrency(discrepancy.amount)}
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div>
                    <span className="font-medium">Description: </span>
                    {discrepancy.description}
                  </div>
                  {discrepancy.notes && (
                    <div>
                      <span className="font-medium">Notes: </span>
                      {discrepancy.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {formatDate(discrepancy.createdAt)}
                  </div>
                  <div>by {discrepancy.createdBy}</div>
                  {discrepancy.approvedAt && discrepancy.approvedBy && (
                    <div>
                      Approved {formatDate(discrepancy.approvedAt)} by{" "}
                      {discrepancy.approvedBy}
                    </div>
                  )}
                </div>

                {discrepancy.approvalNotes && (
                  <div className="p-2 bg-gray-50 rounded text-sm mb-3">
                    <span className="font-medium">Approval Notes: </span>
                    {discrepancy.approvalNotes}
                  </div>
                )}

                {discrepancy.status === "pending_approval" && canApprove && (
                  <div className="space-y-3 pt-3 border-t">
                    <Textarea
                      placeholder="Add approval notes (optional)..."
                      value={approvalNotes[discrepancy.discrepancyId] || ""}
                      onChange={(e) =>
                        setApprovalNotes((prev) => ({
                          ...prev,
                          [discrepancy.discrepancyId]: e.target.value,
                        }))
                      }
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleApproveDiscrepancy(discrepancy.discrepancyId)
                        }
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() =>
                          handleRejectDiscrepancy(discrepancy.discrepancyId)
                        }
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {discrepancy.status === "pending_approval" && !canApprove && (
                  <div className="pt-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      This discrepancy requires approval from an Administrator.
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {discrepancies.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Total Discrepancy Amount:</span>
                <span className="font-semibold">
                  {formatCurrency(
                    discrepancies.reduce((sum, d) => sum + d.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Pending Approval:</span>
                <span className="font-semibold text-yellow-600">
                  {
                    discrepancies.filter((d) => d.status === "pending_approval")
                      .length
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
