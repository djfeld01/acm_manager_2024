"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useTransition } from "react";
import { addUnpaidCommissionsToPayroll } from "../actions/addUnpaidCommissions";
import { Rentals } from "../payrollTable/payrollColumns";
import { toast } from "sonner";

interface UnpaidCommissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unpaidCommissions: Rentals[];
  employeeName: string;
  locationName: string;
  payrollId: string;
}

export function UnpaidCommissionModal({
  open,
  onOpenChange,
  unpaidCommissions,
  employeeName,
  locationName,
  payrollId,
}: UnpaidCommissionModalProps) {
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSelectionChange = (commissionId: string, checked: boolean) => {
    setSelectedCommissions((prev) =>
      checked
        ? [...prev, commissionId]
        : prev.filter((id) => id !== commissionId)
    );
  };

  const handleSelectAll = () => {
    if (selectedCommissions.length === unpaidCommissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(
        unpaidCommissions.map((commission) => commission.Id)
      );
    }
  };

  const handleAddCommissions = () => {
    if (selectedCommissions.length === 0) {
      toast.error("Please select at least one commission to add");
      return;
    }

    startTransition(async () => {
      try {
        const result = await addUnpaidCommissionsToPayroll(
          selectedCommissions,
          payrollId
        );

        if (result.success) {
          toast.success(result.message);
          setSelectedCommissions([]);
          onOpenChange(false);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Unpaid Commissions</DialogTitle>
          <DialogDescription>
            Select commissions to add to payroll for {employeeName} at{" "}
            {locationName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedCommissions.length === unpaidCommissions.length &&
                      unpaidCommissions.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all commissions"
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-center">Insurance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unpaidCommissions.map((commission) => (
                <TableRow key={commission.Id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCommissions.includes(commission.Id)}
                      onCheckedChange={(checked) =>
                        handleSelectionChange(commission.Id, checked as boolean)
                      }
                      aria-label={`Select commission for ${commission.tenantName}`}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(commission.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{commission.tenantName}</TableCell>
                  <TableCell>{commission.unitName}</TableCell>
                  <TableCell className="text-center">
                    {commission.hasInsurance ? "✓" : "✗"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCommissions}
            disabled={isPending || selectedCommissions.length === 0}
          >
            {isPending
              ? "Adding..."
              : `Add ${selectedCommissions.length} Commission${
                  selectedCommissions.length !== 1 ? "s" : ""
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
