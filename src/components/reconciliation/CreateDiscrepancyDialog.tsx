"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/reconciliation/clientUtils";

interface CreateDiscrepancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliationId: number;
  facilityId: string;
  onDiscrepancyCreated: () => void;
  prefilledData?: {
    bankTransactionId?: number;
    dailyPaymentId?: number;
    amount?: number;
    description?: string;
  };
}

const discrepancyTypes = [
  { value: "multi_day_combination", label: "Multi-day Combination" },
  { value: "refund", label: "Refund" },
  { value: "error", label: "Error" },
  { value: "timing_difference", label: "Timing Difference" },
  { value: "bank_fee", label: "Bank Fee" },
  { value: "other", label: "Other" },
];

export function CreateDiscrepancyDialog({
  open,
  onOpenChange,
  reconciliationId,
  facilityId,
  onDiscrepancyCreated,
  prefilledData,
}: CreateDiscrepancyDialogProps) {
  const [formData, setFormData] = useState({
    discrepancyType: prefilledData?.description?.includes("multi-day")
      ? "multi_day_combination"
      : "",
    description: prefilledData?.description || "",
    amount: prefilledData?.amount?.toString() || "",
    notes: "",
    isCritical: false,
    referenceTransactionIds: prefilledData?.bankTransactionId
      ? [prefilledData.bankTransactionId]
      : [],
    referenceDailyPaymentIds: prefilledData?.dailyPaymentId
      ? [prefilledData.dailyPaymentId]
      : [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.discrepancyType) {
      newErrors.discrepancyType = "Discrepancy type is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      newErrors.amount = "Valid amount is required";
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reconciliation/discrepancies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reconciliationId,
          discrepancyType: formData.discrepancyType,
          description: formData.description,
          amount: parseFloat(formData.amount),
          notes: formData.notes || undefined,
          isCritical: formData.isCritical,
          referenceTransactionIds:
            formData.referenceTransactionIds.length > 0
              ? JSON.stringify(formData.referenceTransactionIds)
              : undefined,
          referenceDailyPaymentIds:
            formData.referenceDailyPaymentIds.length > 0
              ? JSON.stringify(formData.referenceDailyPaymentIds)
              : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create discrepancy");
      }

      // Reset form and close dialog
      setFormData({
        discrepancyType: "",
        description: "",
        amount: "",
        notes: "",
        isCritical: false,
        referenceTransactionIds: [],
        referenceDailyPaymentIds: [],
      });
      setErrors({});
      onOpenChange(false);
      onDiscrepancyCreated();
    } catch (error) {
      console.error("Failed to create discrepancy:", error);
      setErrors({ submit: "Failed to create discrepancy. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      discrepancyType: "",
      description: "",
      amount: "",
      notes: "",
      isCritical: false,
      referenceTransactionIds: [],
      referenceDailyPaymentIds: [],
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Create Discrepancy
          </DialogTitle>
          <DialogDescription>
            Document a discrepancy that requires approval before the
            reconciliation can be completed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Discrepancy Type */}
          <div className="space-y-2">
            <Label htmlFor="discrepancyType">Discrepancy Type *</Label>
            <Select
              value={formData.discrepancyType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, discrepancyType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select discrepancy type" />
              </SelectTrigger>
              <SelectContent>
                {discrepancyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.discrepancyType && (
              <p className="text-sm text-red-600">{errors.discrepancyType}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the discrepancy in detail..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="pl-10"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
            {formData.amount && !isNaN(parseFloat(formData.amount)) && (
              <p className="text-sm text-muted-foreground">
                Amount: {formatCurrency(parseFloat(formData.amount))}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context or notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={2}
            />
          </div>

          {/* Critical Flag */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCritical"
              checked={formData.isCritical}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isCritical: checked as boolean,
                }))
              }
            />
            <Label htmlFor="isCritical" className="text-sm">
              Mark as critical (requires immediate attention)
            </Label>
          </div>

          {/* Reference Information */}
          {(formData.referenceTransactionIds.length > 0 ||
            formData.referenceDailyPaymentIds.length > 0) && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">
                Referenced Transactions
              </h4>
              {formData.referenceTransactionIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Bank Transaction IDs:{" "}
                  {formData.referenceTransactionIds.join(", ")}
                </p>
              )}
              {formData.referenceDailyPaymentIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Daily Payment IDs:{" "}
                  {formData.referenceDailyPaymentIds.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Discrepancy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
