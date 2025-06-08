import { addMonthlyBonus } from "@/app/queryHelpers/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  calculateRetailBonus,
  calculateStorageBonus,
  caluclateReceivableBonus,
} from "@/lib/utils";
import { PlusCircleIcon } from "lucide-react";
import React from "react";
import { number } from "zod";
type EmployeeCardProps = {
  employeeId: string;
  rentalGoal: number;
  rentalActual: number;
  occupancy: number;
  receivableGoal: number;
  receivableActual: number;
  retailGoal: number;
  retailActual: number;
  employeeName: string;
  position: string;
  numberOfEmployees: number;
  sitelinkId: string;
  nextPayPeriodId: string;
};
function EmployeeCard({
  employeeName,
  employeeId,
  rentalGoal,
  rentalActual,
  occupancy,
  receivableActual,
  receivableGoal,
  retailActual,
  retailGoal,
  position,
  numberOfEmployees,
  sitelinkId,
  nextPayPeriodId,
}: EmployeeCardProps) {
  const rentalsBonus = calculateStorageBonus(
    rentalGoal,
    rentalActual,
    occupancy,
    position
  );

  const receivableBonus = caluclateReceivableBonus(
    receivableGoal,
    receivableActual,
    position
  );

  const retailBonus = calculateRetailBonus(
    retailGoal,
    retailActual,
    1,
    numberOfEmployees
  );

  return (
    <Card className="p-4">
      <CardHeader className="text-lg font-semibold mb-4 flex">
        <div className="flex-1">{employeeName}</div>
        <div className="flex-2">{position}</div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 items-center mb-4">
          <div className="text-sm font-medium">Rental Bonus</div>
          <div className="text-right font-semibold">
            ${rentalsBonus.toFixed(2)}
          </div>
          {rentalsBonus > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 flex items-center justify-center"
              aria-label="Add Rental Bonus"
              onClick={() => {
                addMonthlyBonus(
                  employeeId,
                  sitelinkId,
                  "Rental",
                  rentalsBonus,
                  nextPayPeriodId,
                  "12-31-2024",
                  "12-01-2024"
                );
                alert("Added Rental Bonus");
              }}
            >
              <PlusCircleIcon />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 items-center mb-4">
          <div className="text-sm font-medium">Receivable Bonus</div>
          <div className="text-right font-semibold">
            ${receivableBonus.toFixed(2)}
          </div>
          {receivableBonus > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 flex items-center justify-center"
              aria-label="Add Receivable Bonus"
              onClick={() => {
                addMonthlyBonus(
                  employeeId,
                  sitelinkId,
                  "Receivable",
                  receivableBonus,
                  nextPayPeriodId,
                  "12-31-2024",
                  "12-01-2024"
                );
                alert("Added receivable bonus");
              }}
            >
              <PlusCircleIcon />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 items-center mb-4">
          <div className="text-sm font-medium">Retail Bonus</div>
          <div className="text-right font-semibold">
            ${retailBonus.toFixed(2)}
          </div>
          {retailBonus > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 flex items-center justify-center"
              aria-label="Add Retail Bonus"
              onClick={() => {
                addMonthlyBonus(
                  employeeId,
                  sitelinkId,
                  "Retail",
                  retailBonus,
                  nextPayPeriodId,
                  "12-31-2024",
                  "12-01-2024"
                );
                alert("Added Retail Bonus");
              }}
            >
              <PlusCircleIcon />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EmployeeCard;
