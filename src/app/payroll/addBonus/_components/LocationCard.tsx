"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import React from "react";
import EmployeeCard from "./EmployeeCard";
import {
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  getMonthlyNumbers,
  workingEmployees,
} from "@/app/queryHelpers/queryOptions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculateRetailBonus,
  calculateStorageBonus,
  caluclateReceivableBonus,
} from "@/lib/utils";

type LocationCardProps = {
  sitelinkId: string;
  facilityName: string;
  nextPayPeriodId: string;
};

function LocationCard({
  sitelinkId,
  facilityName,
  nextPayPeriodId,
}: LocationCardProps) {
  let endOfLastMonth = new Date();
  endOfLastMonth.setUTCDate(0);
  const { data: monthlyNumbers, isFetching: monthlyNumbersIsFetching } =
    useQuery(getMonthlyNumbers(sitelinkId, endOfLastMonth.toISOString()));

  const receivablesGoalNumber = Number(
    monthlyNumbers?.monthlyGoals[0]?.collectionsGoal || 0
  );

  const retailGoalNumber =
    Number(monthlyNumbers?.monthlyGoals[0]?.retailGoal) || 0;
  const receivableActual =
    monthlyNumbers?.dailyManagementReceivable.reduce(
      (prev, curr) => prev + curr.delinquentTotal,
      0
    ) || 0;

  const { data: employees, isFetching: employeesIsFetching } = useQuery(
    workingEmployees(sitelinkId)
  );

  const filteredEmployees = employees?.filter(
    (employee) =>
      employee.employeePosition === "MANAGER" ||
      employee.employeePosition === "ASSISTANT"
  );

  const rentalGoal = monthlyNumbers?.monthlyGoals[0]?.rentalGoal || 0;
  const rentalActual =
    monthlyNumbers?.dailyManagementActivity[0]?.monthlyTotal || 0;
  const occupancy =
    monthlyNumbers?.dailyManagementOccupancy[0]?.unitOccupancy || 0;

  const retailActual =
    monthlyNumbers?.dailyManagementPaymentReceipt[0]?.monthlyAmount || 0;

  const rentalsBonus = calculateStorageBonus(
    rentalGoal,
    rentalActual,
    occupancy
  );

  const receivableBonus = caluclateReceivableBonus(
    receivablesGoalNumber,
    receivableActual
  );

  const retailBonus = calculateRetailBonus(
    retailGoalNumber,
    retailActual,
    1,
    1
  );

  if (monthlyNumbersIsFetching) {
    return (
      <Skeleton>
        <Card className="p-4 h-20"></Card>
      </Skeleton>
    );
  }
  return (
    <Card className="p-0">
      <div className="font-semibold text-center text-xl mb-1 bg-slate-400 rounded-lg">
        {endOfLastMonth.toLocaleString("default", { month: "long" })} Results
      </div>

      <CardContent>
        {/* Top Section: Goals and Actuals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Rental Section */}
          <div className="space-y-2 border rounded-md p-1">
            {rentalGoal > 0 && (
              <div className="flex justify-between bg-orange-300">
                <span className="text-sm font-light ">GOAL REACHED!</span>
              </div>
            )}
            <div className="font-light text-center">Rental</div>
            <div className="flex justify-between">
              <span className="text-sm font-light">Goal:</span>
              <span className="text-sm font-light">
                {monthlyNumbers?.monthlyGoals[0]?.rentalGoal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light">Actual:</span>
              <span className="text-sm font-light">
                {monthlyNumbers?.dailyManagementActivity[0]?.monthlyTotal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light">Unit Occupancy:</span>
              <span className="text-sm font-light">
                {monthlyNumbers?.dailyManagementOccupancy[0]?.unitOccupancy !=
                null
                  ? `${(
                      monthlyNumbers.dailyManagementOccupancy[0].unitOccupancy *
                      100
                    ).toFixed(1)}%`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Retail Section */}
          <div className="space-y-2 border rounded-md p-1">
            {retailBonus > 0 && (
              <div className="flex justify-between bg-orange-300">
                <span className="text-sm font-light ">GOAL REACHED!</span>
              </div>
            )}
            <div className="font-light text-center">Retail</div>
            <div className="flex justify-between">
              <span className="text-sm font-light">Goal:</span>
              <span className="text-sm font-light">${retailGoalNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light">Actual:</span>
              <span className="text-sm font-light">
                $
                {
                  monthlyNumbers?.dailyManagementPaymentReceipt[0]
                    ?.monthlyAmount
                }
              </span>
            </div>
          </div>

          {/* Receivables Section */}
          <div className="space-y-2 border rounded-md p-1">
            {receivableBonus > 0 && (
              <div className="flex justify-between bg-orange-300">
                <span className="text-sm font-light ">GOAL REACHED!</span>
              </div>
            )}
            <div className="font-light text-center">Receivables</div>
            <div className="flex justify-between">
              <span className="text-sm font-light">Goal:</span>
              <span className="text-sm font-light">
                ${receivablesGoalNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-light">Actual:</span>
              <span className="text-sm font-light">${receivableActual}</span>
            </div>
          </div>
        </div>

        {/* Employee Cards */}
        {/* <div className="space-y-4">
          {filteredEmployees &&
            filteredEmployees.map((employee) => (
              <EmployeeCard
                nextPayPeriodId={nextPayPeriodId}
                key={employee.employeeId}
                employeeId={employee.employeeId}
                receivableActual={receivableActual}
                receivableGoal={receivablesGoalNumber}
                rentalActual={
                  monthlyNumbers?.dailyManagementActivity[0]?.monthlyTotal || 0
                }
                rentalGoal={monthlyNumbers?.monthlyGoals[0]?.rentalGoal || 0}
                occupancy={
                  monthlyNumbers?.dailyManagementOccupancy[0]?.unitOccupancy ||
                  0
                }
                retailActual={
                  monthlyNumbers?.dailyManagementPaymentReceipt[0]
                    ?.monthlyAmount || 0
                }
                employeeName={employee?.employeeName || ""}
                retailGoal={retailGoalNumber}
                position={employee?.employeePosition || ""}
                numberOfEmployees={filteredEmployees.length}
                sitelinkId={sitelinkId}
              />
            ))}
        </div> */}
      </CardContent>
    </Card>
  );
}

export default LocationCard;
