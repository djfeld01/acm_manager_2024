import React, { useState } from "react";
import {
  Activity,
  Mileage,
  UserWithActivities,
  Vacations,
} from "./EmployeeComissionComponent";
import { CircleMinus } from "lucide-react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { CardContent, CardHeader, CardTitle } from "./ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { deleteMileage } from "@/lib/controllers/activityController";

type EmployeeCommittedPayrollProps = {
  committedActivities: Activity[];
  committedCommission: number;
  vacation: Vacations[];
  mileage: Mileage[];
  updateActivities: (buttonType: string, selectedActivities: number[]) => void;
};
function EmployeeCommittedPayroll({
  committedActivities,
  committedCommission,
  updateActivities,
  vacation,
  mileage,
}: EmployeeCommittedPayrollProps) {
  const vacationHours = vacation.reduce(
    (prev, item) => prev + item.vacationHours,
    0
  );
  const mileagePaid = mileage.reduce((prev, item) => {
    return prev + item.mileage * item.mileageRate;
  }, 0);

  async function updateMileage(id: string) {
    const deletedMileage = await deleteMileage(id);
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
                    onClick={() =>
                      updateActivities("uncommitActivity", [
                        activity.activityId,
                      ])
                    }
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
        {vacation.length > 0 ? (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer flex-1">
                <div className="font-semibold">Vacation</div>
                <div> ${vacationHours || 0} hours</div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent></HoverCardContent>
          </HoverCard>
        ) : (
          <div className="flex-1">
            <div className="font-semibold">Vacation</div>
            <div> 0 hours</div>
          </div>
        )}
        {mileage.length > 0 ? (
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
        {/* 
          <div>${(mileagePaid || 0).toFixed(2)}</div> */}
      </CardContent>
    </div>
    // </Collapsible>
  );
}

export default EmployeeCommittedPayroll;
