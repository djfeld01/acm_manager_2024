import React, { useState } from "react";
import { Activity, UserWithActivities } from "./EmployeeComissionComponent";
import { CircleMinus } from "lucide-react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

type EmployeeCommittedPayrollProps = {
  employee: UserWithActivities;
  committedActivities: Activity[];
  committedInsurance: number;
  committedRentals: number;
  committedCommission: number;
  updateActivities: (buttonType: string, selectedActivities: number[]) => void;
};
function EmployeeCommittedPayroll({
  employee,
  committedActivities,
  committedInsurance,
  committedRentals,
  committedCommission,
  updateActivities,
}: EmployeeCommittedPayrollProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div>
        <div className="grid grid-cols-4 bg-grey-300">
          <div>Rentals</div>
          <div>Commission</div>
          <div>Vacation</div>
          <div>Miles</div>
          <CollapsibleTrigger asChild>
            <div>{committedRentals || 0}</div>
          </CollapsibleTrigger>
          <CollapsibleTrigger asChild>
            <div>${(committedCommission || 0).toFixed(2)}</div>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {committedActivities.map((activity) => (
            <div key={activity.activityId}>
              <div>
                {activity.unitName}{" "}
                {new Date(activity.date).toLocaleDateString(undefined, {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </div>
              <Button
                onClick={() =>
                  updateActivities("uncommitActivity", [activity.activityId])
                }
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 flex items-center justify-center"
              >
                <CircleMinus className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </div>
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default EmployeeCommittedPayroll;
