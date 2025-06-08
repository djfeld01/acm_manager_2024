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
import LocationCard from "../addBonus/_components/LocationCard";

type MainPayrollProps = {
  sitelinkId: string;
};
function MainPayroll({ sitelinkId }: MainPayrollProps) {
  const queryClient = useQueryClient();

  const { data: employeesData } = useSuspenseQuery(
    payrollPageDataOptions(sitelinkId)
  );
  const { data: facilityData } = useSuspenseQuery(
    facilityPageDataOptions(sitelinkId)
  );

  const {
    employees,
    nextPayPeriod,
    insuranceCommissionRate,
    storageCommissionRate,
    employeeList,
  } = employeesData;

  const { facility } = facilityData;
  return (
    <div className="container mx-auto p-4">
      <LocationHeader sitelinkId={sitelinkId} />
      <LocationCard
        sitelinkId={sitelinkId}
        nextPayPeriodId={nextPayPeriod.payPeriodId}
        facilityName={facility?.facilityName || ""}
      />

      {/* <EmployeeContainer sitelinkId={sitelinkId} /> */}
      <div className="flex flex-col flex-wrap lg:flex-row justify-between gap-2 mb-8">
        {employees.map(
          (employee) =>
            (employee.fullName ?? employee.activities.length > 0) && (
              <EmployeePayrollCard
                employee={employee}
                key={employee.userDetailsId}
                sitelinkId={sitelinkId}
                employeePosition={employee.position || ""}
              />
            )
        )}
      </div>
    </div>
  );
}

export default MainPayroll;
