"use client";
import {
  facilityPageDataOptions,
  payrollPageDataOptions,
} from "@/app/queryHelpers/queryOptions";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

type MainPayrollProps = {
  sitelinkId: string;
};
function MainPayroll2({ sitelinkId }: MainPayrollProps) {
  const queryClient = useQueryClient();

  const { data: facilityData } = useSuspenseQuery(
    facilityPageDataOptions(sitelinkId)
  );

  const { data: employeesData } = useSuspenseQuery(
    payrollPageDataOptions(sitelinkId)
  );
  return <div>sitelinkId: {sitelinkId}</div>;
}

export default MainPayroll2;
