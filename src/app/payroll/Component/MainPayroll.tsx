"use client";

import {
  facilityPageDataOptions,
  payrollPageDataOptions,
} from "@/app/queryHelpers/queryOptions";
import { getDateSentence } from "@/lib/utils";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React from "react";
import { EmployeePayrollCard } from "./EmployeePayrollCard";
import { mutateCommitActivityCommissionToPayroll } from "@/app/queryHelpers/queries";
import LocationHeader from "./LocationHeader";

type MainPayrollProps = {
  sitelinkId: string;
};
function MainPayroll({ sitelinkId }: MainPayrollProps) {
  const queryClient = useQueryClient();

  const { data: employeesData } = useSuspenseQuery(
    payrollPageDataOptions(sitelinkId)
  );

  const {
    employees,
    nextPayPeriod,
    insuranceCommissionRate,
    storageCommissionRate,
    employeeList,
  } = employeesData;

  return (
    <div className="container mx-auto p-4">
      <LocationHeader sitelinkId={sitelinkId} />

      {/* <EmployeeContainer sitelinkId={sitelinkId} /> */}
      <div className="flex flex-col flex-wrap lg:flex-row justify-between gap-2 mb-8">
        {employees.map(
          (employee) =>
            (employee.fullName ?? employee.activities.length > 0) && (
              <EmployeePayrollCard
                employee={employee}
                key={employee.userDetailsId}
                sitelinkId={sitelinkId}
              />
            )
        )}
      </div>
    </div>
  );
}

export default MainPayroll;
