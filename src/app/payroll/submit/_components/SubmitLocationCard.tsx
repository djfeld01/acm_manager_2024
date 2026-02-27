"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { workingEmployees } from "@/app/queryHelpers/queryOptions";
import { Skeleton } from "@/components/ui/skeleton";
import EmployeeSubmitRow from "./EmployeeSubmitRow";
import { Button } from "@/components/ui/button";
import { submitFacilityForReview } from "@/lib/controllers/payrollController/payrollController";
import { toast } from "sonner";

type SubmitLocationCardProps = {
  sitelinkId: string;
  facilityName: string;
  payPeriodId: string;
  periodStart: string | null;
  periodEnd: string;
};

function SubmitLocationCard({
  sitelinkId,
  facilityName,
  payPeriodId,
  periodStart,
  periodEnd,
}: SubmitLocationCardProps) {
  const { data: employees, isFetching } = useQuery(
    workingEmployees(sitelinkId)
  );

  const filteredEmployees = employees?.filter(
    (e) =>
      e.employeePosition === "MANAGER" || e.employeePosition === "ASSISTANT"
  );

  async function handleSubmitForReview() {
    if (!filteredEmployees?.length) return;
    const ids = filteredEmployees.map((e) => e.employeeId);
    await submitFacilityForReview(ids, payPeriodId);
    toast.success(`${facilityName} submitted for supervisor review.`);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="font-semibold text-lg">{facilityName}</div>
        {periodStart && (
          <div className="text-sm text-muted-foreground">
            Pay period: {periodStart} – {periodEnd}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isFetching ? (
          <Skeleton className="h-16 w-full" />
        ) : filteredEmployees && filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <EmployeeSubmitRow
              key={employee.employeeId}
              employeeId={employee.employeeId}
              employeeName={employee.employeeName ?? ""}
              position={employee.employeePosition ?? ""}
              sitelinkId={sitelinkId}
              payPeriodId={payPeriodId}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No employees found.</p>
        )}
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Button
          onClick={handleSubmitForReview}
          disabled={!filteredEmployees?.length}
        >
          Submit for Supervisor Review
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SubmitLocationCard;
