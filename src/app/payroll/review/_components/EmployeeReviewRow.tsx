"use client";
import React, { useState, useTransition } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  approveFacilityPayroll,
  requestPayrollChanges,
} from "@/lib/controllers/payrollController/payrollController";
import type { getSubmittedPayrollForFacility } from "@/lib/controllers/payrollController/payrollController";

type Entry = Awaited<ReturnType<typeof getSubmittedPayrollForFacility>>[number];

type EmployeeReviewRowProps = {
  entry: Entry;
  payPeriodId: string;
  sitelinkId: string;
  onUpdate: () => void;
};

const statusStyles: Record<string, string> = {
  EMPLOYEE_SUBMITTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SUPERVISOR_APPROVED: "bg-green-100 text-green-800 border-green-200",
  NOT_STARTED: "bg-gray-100 text-gray-600 border-gray-200",
  FINALIZED: "bg-blue-100 text-blue-800 border-blue-200",
};

function EmployeeReviewRow({ entry, payPeriodId, sitelinkId, onUpdate }: EmployeeReviewRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const { status, employee, position, hours, vacationRequests, mileageEntries } = entry;
  const isSubmitted = status.status === "EMPLOYEE_SUBMITTED";
  const isApproved = status.status === "SUPERVISOR_APPROVED";

  function handleApprove() {
    startTransition(async () => {
      await approveFacilityPayroll([status.employeeId], payPeriodId);
      toast.success(`${employee?.fullName ?? "Employee"} approved.`);
      onUpdate();
    });
  }

  function handleRequestChanges() {
    if (!notes.trim()) return;
    startTransition(async () => {
      await requestPayrollChanges(status.employeeId, payPeriodId, notes);
      toast.success("Changes requested.");
      setShowChangesForm(false);
      setNotes("");
      onUpdate();
    });
  }

  const totalMileage = mileageEntries.reduce((sum, m) => sum + Number(m.mileage), 0);
  const totalVacationHours = vacationRequests
    .filter((v) => v.status === "PENDING" || v.status === "APPROVED")
    .reduce((sum, v) => sum + Number(v.hoursRequested), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <span className="font-medium text-sm truncate">
              {employee?.fullName ?? status.employeeId}
            </span>
            {position && (
              <Badge variant="outline" className="text-xs shrink-0">
                {position}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium border",
                statusStyles[status.status] ?? "bg-gray-100 text-gray-600"
              )}
            >
              {status.status.replace("_", " ")}
            </span>
            {isSubmitted && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={handleApprove}
                disabled={isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
            )}
            {isApproved && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setShowChangesForm((v) => !v)}
                disabled={isPending}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reopen
              </Button>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 border-t space-y-3 pt-3">
            {/* Hours summary */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded border px-3 py-2 text-center">
                <div className="text-lg font-semibold">{hours?.regularHours ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Regular hrs</div>
              </div>
              <div className="rounded border px-3 py-2 text-center">
                <div className="text-lg font-semibold">{hours?.overtimeHours ?? "—"}</div>
                <div className="text-xs text-muted-foreground">OT hrs</div>
              </div>
              <div className="rounded border px-3 py-2 text-center">
                <div className="text-lg font-semibold">{totalMileage || "—"}</div>
                <div className="text-xs text-muted-foreground">Miles</div>
              </div>
            </div>

            {/* Vacation requests */}
            {vacationRequests.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Vacation Requests ({totalVacationHours} hrs)
                </p>
                {vacationRequests.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-sm border rounded px-3 py-1.5 mb-1"
                  >
                    <span>
                      {v.startDate} – {v.endDate}
                    </span>
                    <span className="text-muted-foreground">{v.hoursRequested} hrs</span>
                    <span className="text-xs text-muted-foreground">{v.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Mileage entries */}
            {mileageEntries.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Mileage ({totalMileage} mi · ${(totalMileage * 0.35).toFixed(2)})
                </p>
                {mileageEntries.map((m) => (
                  <div
                    key={m.mileageId}
                    className="flex items-center justify-between text-sm border rounded px-3 py-1.5 mb-1"
                  >
                    <span>{m.date}</span>
                    <span>{m.mileage} mi</span>
                    {m.mileageNote && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {m.mileageNote}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes from previous review */}
            {status.supervisorNotes && (
              <div className="rounded bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm">
                <span className="font-medium text-yellow-800">Notes: </span>
                {status.supervisorNotes}
              </div>
            )}

            {/* Request changes form */}
            {(isSubmitted || showChangesForm) && (
              <div className="space-y-2 pt-1">
                <Textarea
                  placeholder="Notes for employee (required to request changes)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  {showChangesForm && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowChangesForm(false); setNotes(""); }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestChanges}
                    disabled={isPending || !notes.trim()}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Request Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default EmployeeReviewRow;
