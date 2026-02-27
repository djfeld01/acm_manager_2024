"use client";
import React, { useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  approveFacilityPayroll,
  getSubmittedPayrollForFacility,
} from "@/lib/controllers/payrollController/payrollController";
import EmployeeReviewRow from "./EmployeeReviewRow";

type ReviewLocationCardProps = {
  sitelinkId: string;
  facilityName: string;
  payPeriodId: string;
};

function ReviewLocationCard({
  sitelinkId,
  facilityName,
  payPeriodId,
}: ReviewLocationCardProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const { data: employees = [], isFetching } = useQuery({
    queryKey: ["submittedPayroll", sitelinkId, payPeriodId],
    queryFn: () => getSubmittedPayrollForFacility(sitelinkId, payPeriodId),
  });

  const submitted = employees.filter(
    (e) => e.status.status === "EMPLOYEE_SUBMITTED"
  );
  const approved = employees.filter(
    (e) => e.status.status === "SUPERVISOR_APPROVED"
  );

  function handleApproveAll() {
    const ids = submitted.map((e) => e.status.employeeId);
    if (!ids.length) return;
    startTransition(async () => {
      await approveFacilityPayroll(ids, payPeriodId);
      toast.success(`${facilityName} approved.`);
      queryClient.invalidateQueries({
        queryKey: ["submittedPayroll", sitelinkId, payPeriodId],
      });
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="font-semibold text-lg">{facilityName}</div>
        <div className="text-sm text-muted-foreground">
          {submitted.length} pending · {approved.length} approved
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isFetching ? (
          <Skeleton className="h-16 w-full" />
        ) : employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No submissions for this period.
          </p>
        ) : (
          employees.map((entry) => (
            <EmployeeReviewRow
              key={entry.status.employeeId}
              entry={entry}
              payPeriodId={payPeriodId}
              sitelinkId={sitelinkId}
              onUpdate={() =>
                queryClient.invalidateQueries({
                  queryKey: ["submittedPayroll", sitelinkId, payPeriodId],
                })
              }
            />
          ))
        )}
      </CardContent>
      {submitted.length > 0 && (
        <CardFooter className="justify-end border-t pt-4">
          <Button onClick={handleApproveAll} disabled={isPending}>
            Approve All
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default ReviewLocationCard;
