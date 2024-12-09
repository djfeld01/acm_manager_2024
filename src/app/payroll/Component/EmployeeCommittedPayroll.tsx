import React, { useState } from "react";
import {
  Activity,
  Mileage,
  UserWithActivities,
  Vacations,
} from "./EmployeeComissionComponent";
import { CircleMinus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  deleteBonus,
  deleteHoliday,
  deleteMileage,
  deleteVacation,
  getCommittedHolidayHours,
  uncommitActivityFromPayroll,
} from "@/lib/controllers/activityController";
import { calculateCommission } from "@/lib/utils";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  commitedBonusOptions,
  committedHolidayHoursOptions,
  payrollPageDataOptions,
} from "@/app/queryHelpers/queryOptions";
import { Skeleton } from "@/components/ui/skeleton";

type EmployeeCommittedPayrollProps = {
  employeeId: string;
  sitelinkId: string;
  payPeriodId: string;
};
function EmployeeCommittedPayroll({
  employeeId,
  sitelinkId,
  payPeriodId,
}: EmployeeCommittedPayrollProps) {
  const queryClient = useQueryClient();
  const { data: holiday, isRefetching: holidayIsRefetching } = useQuery(
    committedHolidayHoursOptions(sitelinkId, employeeId, payPeriodId)
  );

  const { data: bonus, isRefetching: bonusIsRefetching } = useQuery(
    commitedBonusOptions(sitelinkId, employeeId, payPeriodId)
  );
  const { data: employeesData, isRefetching } = useSuspenseQuery(
    payrollPageDataOptions(sitelinkId)
  );

  const { employees, insuranceCommissionRate, storageCommissionRate } =
    employeesData;

  const employee = employees.filter(
    (employee) => employee.userDetailsId === employeeId
  )[0];
  const { committedActivities, position, vacation, mileage } = employee;

  const commmittedRentals = committedActivities.length;
  const committedInsurance = committedActivities.reduce(
    (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
    0
  );

  const committedCommission = calculateCommission(
    position || "",
    committedInsurance,
    insuranceCommissionRate,
    commmittedRentals,
    storageCommissionRate
  );

  const bonusAmount =
    bonus && bonus.length > 0
      ? bonus.reduce((prev, item) => prev + item.bonusAmount, 0)
      : 0;

  const holidayHours =
    holiday && holiday.length > 0
      ? holiday.reduce((prev, item) => prev + item.holidayHours, 0)
      : 0;

  const vacationHours = vacation
    ? vacation.reduce((prev, item) => prev + item.vacationHours, 0)
    : 0;
  const mileagePaid = mileage
    ? mileage.reduce((prev, item) => {
        return prev + item.mileage * item.mileageRate;
      }, 0)
    : 0;

  async function updateMileage(id: string) {
    const deletedMileage = await deleteMileage(id);
    queryClient.invalidateQueries({
      queryKey: ["payrollPageData", sitelinkId],
    });
  }

  async function updateActivities(selectedActivities: number[]) {
    await uncommitActivityFromPayroll(selectedActivities);
    queryClient.invalidateQueries({
      queryKey: ["payrollPageData", sitelinkId],
    });
  }

  async function updateVacation(selectedVacation: string) {
    await deleteVacation(selectedVacation);
    queryClient.invalidateQueries({
      queryKey: ["payrollPageData", sitelinkId],
    });
  }

  async function updateHoliday(selectedHoliday: string) {
    await deleteHoliday(selectedHoliday);
    queryClient.invalidateQueries({
      queryKey: ["committedHolidayHours", payPeriodId, sitelinkId, employeeId],
    });
  }

  async function updateBonus(selectedBonus: string) {
    await deleteBonus(selectedBonus);
    queryClient.invalidateQueries({
      queryKey: ["committedBonus", payPeriodId, sitelinkId, employeeId],
    });
  }

  if (isRefetching || holidayIsRefetching || bonusIsRefetching) {
    return (
      <div className="bg-gray-200 rounded-3xl">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    // <Collapsible open={isOpen} onOpenChange={setIsOpen}>
    <div className="bg-gray-200 rounded-3xl">
      <CardHeader className="p-1">Committed For This Payroll</CardHeader>
      <CardContent className="flex">
        {committedActivities.length > 0 ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer flex-1">
                <div className="font-semibold">Commission</div>
                <div> ${(committedCommission || 0).toFixed(2)}</div>
              </div>
            </HoverCardTrigger>

            <HoverCardContent>
              <div>Committed Units</div>
              {committedActivities.map((activity) => (
                <div key={activity.activityId} className="grid grid-cols-5 ">
                  <Button
                    onClick={() => updateActivities([activity.activityId])}
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 flex items-center justify-center col-span-1"
                  >
                    <CircleMinus className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                  <div className="col-span-2">{activity.unitName}</div>
                  <div className="col-span-2">
                    {new Date(activity.date).toLocaleDateString(undefined, {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div className="flex-1">
            <div className="font-semibold">Commission</div>
            <div>$0.00</div>
          </div>
        )}
        {vacation ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer flex-1">
                <div className="font-semibold">Vacation</div>
                <div> {vacationHours || 0} hours</div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              {vacation.map((vacation) => (
                <div key={vacation.vacationId} className="grid grid-cols-5 ">
                  <Button
                    onClick={() => updateVacation(vacation.vacationId)}
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 flex items-center justify-center col-span-1"
                  >
                    <CircleMinus className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                  <div className="col-span-2">
                    {new Date(vacation.date).toLocaleDateString(undefined, {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div className="flex-1">
            <div className="font-semibold">Vacation</div>
            <div> 0 hours</div>
          </div>
        )}
        {mileage ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer flex-1">
                <div className="font-semibold">Mileage</div>
                <div> ${mileagePaid.toFixed(2)}</div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              {mileage.map((mileEntry) => (
                <div key={mileEntry.mileageId} className="grid grid-cols-7 ">
                  <Button
                    onClick={() => updateMileage(mileEntry.mileageId)}
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 flex items-center justify-center col-span-1"
                  >
                    <CircleMinus className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                  <div className="col-span-2">{mileEntry.mileage}</div>
                  <div className="col-span-2">
                    {new Date(mileEntry.date).toLocaleDateString(undefined, {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                  <div className="col-span-2">{mileEntry.mileageNote}</div>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <div className="flex-1">
            <div className="font-semibold">Mileage</div>
            <div>$0.00</div>
          </div>
        )}
        {holiday && holiday.length > 0 ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer flex-1">
                <div className="font-semibold">Holiday</div>
                <div> {holidayHours}</div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              {holiday.map((holidayEntry) => (
                <div key={holidayEntry.holidayId} className="grid grid-cols-7 ">
                  <Button
                    onClick={() => updateHoliday(holidayEntry.holidayId)}
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 flex items-center justify-center col-span-1"
                  >
                    <CircleMinus className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                  <div className="col-span-2">{holidayEntry.holidayHours}</div>
                  <div className="col-span-2">
                    {new Date(holidayEntry.date).toLocaleDateString(undefined, {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                  <div className="col-span-2">
                    {holidayEntry.holidayHoursType}
                  </div>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <></>
        )}
        {bonus && bonus.length > 0 ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer flex-1">
                <div className="font-semibold">Bonus</div>
                <div> ${bonusAmount.toFixed(2)}</div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent>
              {bonus.map((bonusEntry) => (
                <div key={bonusEntry.bonusId} className="grid grid-cols-7 ">
                  <Button
                    onClick={() => updateBonus(bonusEntry.bonusId)}
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 flex items-center justify-center col-span-1"
                  >
                    <CircleMinus className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                  <div className="col-span-2">{bonusEntry.bonusAmount}</div>
                  <div className="col-span-2">
                    {new Date(bonusEntry.date).toLocaleDateString(undefined, {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                  <div className="col-span-2">{bonusEntry.bonusType}</div>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <></>
        )}
      </CardContent>
    </div>
    // </Collapsible>
  );
}

export default EmployeeCommittedPayroll;
