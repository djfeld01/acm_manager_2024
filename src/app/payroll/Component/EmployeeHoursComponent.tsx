"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { hoursEntryOptions } from "@/app/queryHelpers/queryOptions";

type EmployeeHoursComponentProps = {
  sitelinkId: string;
  employeeId: string;
  payPeriodId: string;
};

function EmployeeHoursComponent({
  sitelinkId,
  employeeId,
  payPeriodId,
}: EmployeeHoursComponentProps) {
  const { data: hours } = useQuery(
    hoursEntryOptions(sitelinkId, employeeId, payPeriodId)
  );

  const regular = hours?.regularHours ?? null;
  const overtime = hours?.overtimeHours ?? null;

  return (
    <div className="flex-1">
      <div className="font-semibold">Hours</div>
      {regular !== null ? (
        <div className="text-sm">
          {regular} reg
          {Number(overtime) > 0 && ` · ${overtime} OT`}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">—</div>
      )}
    </div>
  );
}

export default EmployeeHoursComponent;
