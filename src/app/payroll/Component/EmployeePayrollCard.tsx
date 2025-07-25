"use client";

import { useState } from "react";

import { calculateCommission, cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import EmployeeComissionComponent, {
  Activity,
  PayPeriod,
  UserWithActivities,
} from "./EmployeeComissionComponent";
import EmployeeCommittedPayroll from "./EmployeeCommittedPayroll";
import {
  commitActivityCommissionToPayroll,
  markActivitiesAsPaid,
  uncommitActivityFromPayroll,
} from "@/lib/controllers/activityController";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  facilityPageDataOptions,
  getMonthlyNumbers,
  payrollPageDataOptions,
} from "@/app/queryHelpers/queryOptions";
import EmployeeVacationComponent from "./EmployeeVacationComponent";
import EmployeeMileageComponent from "@/components/EmployeeMileageComponent";
import EmployeeDaysWorkedComponent from "@/components/EmployeeDaysWorkedComponent";
import EmployeeHolidayComponent from "./EmployeeHolidayComponent";
import next from "next";
import EmployeeBonusComponent from "./EmployeeBonusComponent";
import EmployeeMonthlyBonusComponent from "./EmployeeMonthlyBonusComponent";

// import EmployeeVacationComponent from "./EmployeeVacationComponent";
// import EmployeeMileageComponent from "./EmployeeMileageComponent";
// import EmployeeDaysWorkedComponent from "./EmployeeDaysWorkedComponent";

type EmployeePayrollCardProps = {
  employee: UserWithActivities;
  sitelinkId: string;
  employeePosition: string;
};

export function EmployeePayrollCard({
  employee,
  sitelinkId,
  employeePosition,
}: EmployeePayrollCardProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { data: employeesData } = useSuspenseQuery(
    payrollPageDataOptions(sitelinkId)
  );

  const { nextPayPeriod } = employeesData;
  const { data: monthlyNumbers } = useQuery(
    getMonthlyNumbers(sitelinkId, "2025-05-31")
  );

  const showMonthlyBonus =
    monthlyNumbers?.monthlyGoals?.length &&
    monthlyNumbers?.monthlyGoals?.length > 0 &&
    !monthlyNumbers?.monthlyGoals?.[0]?.hasBeenPaid;

  console.log("showMonthlyBonus ", showMonthlyBonus);
  // if (isDesktop) {
  return (
    // <Dialog open={open} onOpenChange={setOpen}>
    <Card className="bg-gray-300 p-1 rounded-lg  flex-1 basis-1/3 text-center">
      <CardTitle>
        {employee?.firstName || "Unlinked Rentals"} {employee?.lastName || ""}
      </CardTitle>
      <CardDescription>{employee?.position || "NA"}</CardDescription>{" "}
      <CardContent>
        {employee.userDetailsId && (
          <EmployeeCommittedPayroll
            employeeId={employee.userDetailsId || ""}
            sitelinkId={sitelinkId}
            payPeriodId={nextPayPeriod.payPeriodId}
          />
        )}
        <EmployeeComissionComponent
          employeeId={employee.userDetailsId || ""}
          sitelinkId={sitelinkId}
        />

        {employee.userDetailsId && (
          <div className="grid grid-cols-3">
            <EmployeeVacationComponent
              sitelinkId={sitelinkId}
              employeeId={employee.userDetailsId}
              payPeriodId={nextPayPeriod.payPeriodId}
            />
            <EmployeeMileageComponent
              sitelinkId={sitelinkId}
              employeeId={employee.userDetailsId}
              payPeriodId={nextPayPeriod.payPeriodId}
            />
            <EmployeeHolidayComponent
              sitelinkId={sitelinkId}
              employeeId={employee.userDetailsId}
              payPeriodId={nextPayPeriod.payPeriodId}
            />
            <EmployeeBonusComponent
              sitelinkId={sitelinkId}
              employeeId={employee.userDetailsId}
              payPeriodId={nextPayPeriod.payPeriodId}
            />
            {showMonthlyBonus === true && (
              <EmployeeMonthlyBonusComponent
                sitelinkId={sitelinkId}
                employeeId={employee.userDetailsId}
                payPeriodId={nextPayPeriod.payPeriodId}
                employeePosition={employeePosition}
              />
            )}
          </div>
        )}

        {employee.logins.length > 0 && (
          <EmployeeDaysWorkedComponent
            logins={employee?.logins || []}
            nextPayPeriod={nextPayPeriod}
          />
        )}
      </CardContent>
    </Card>
  );
}
