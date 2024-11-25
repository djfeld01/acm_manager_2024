"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";
import { ChevronsUpDown, WrenchIcon } from "lucide-react";
import {
  commitActivityCommissionToPayroll,
  markActivitiesAsPaid,
} from "@/lib/controllers/activityController";
import next from "next";
import EmployeeActivityData from "./EmployeeActivityData";

export type Vacations = {
  vacationId: string;
  vacationHours: number;
  date: string;
  vacationNote?: string;
};

export type Logins = {
  dateTime: Date;
  computerName: string;
  computerIP: string;
};
// Type for each activity
export type Activity = {
  activityType: string;
  date: string; // ISO 8601 string format for date
  unitName: string;
  tenantName: string;
  activityId: number;
  hasInsurance: boolean;
  payPeriodId?: string;
};
export type PayPeriod = {
  payPeriodId: string;
  startDate: string;
  endDate: string | null;
  paycheckDate: string | null;
  processingDate: string | null;
  status: "Completed" | "In Process" | "Current" | "Future" | null;
};
// Type for each user and their activities
export type UserWithActivities = {
  fullName: string | null; // Full name can be null
  firstName: string | null;
  lastName: string | null;
  userDetailsId: string | null; // userDetailsId can be null
  position:
    | "ACM_OFFICE"
    | "AREA_MANAGER"
    | "MANAGER"
    | "ASSISTANT"
    | "STORE_OWNER"
    | null;
  activities: Activity[]; // Array of Activity objects
  committedActivities: Activity[];
  logins: Logins[];
  vacation: Vacations[];
};
type EmployeeCommissionComponentProps = {
  employee: UserWithActivities;
  uncommittedActivities: Activity[];
  uncommittedRentals: number;
  uncommittedInsurance: number;
  uncommittedCommission: number;
  nextPayPeriod: PayPeriod;
  updateActivities: (buttonType: string, selectedActivities: number[]) => void;
  employeeList: { userDetailId: string; firstName: string; lastName: string }[];
  refreshData: () => void;
};
function EmployeeComissionComponent({
  employee,
  uncommittedActivities,
  uncommittedRentals,
  uncommittedInsurance,
  uncommittedCommission,
  nextPayPeriod,
  updateActivities,
  employeeList,
  refreshData,
}: EmployeeCommissionComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedActivities(uncommittedActivities.map((a) => a.activityId));
    } else {
      setSelectedActivities([]);
    }
  }

  function toggleActivity(activityId: number) {
    setSelectedActivities((prev) => {
      if (prev.includes(activityId)) {
        // Remove the activityId if it's already selected
        return prev.filter((id) => id !== activityId);
      } else {
        // Add the activityId if it's not already selected
        return [...prev, activityId];
      }
    });
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {employee.fullName && (
        <div className="col-span-7">Unpaid Commissions</div>
      )}
      <div className="grid grid-cols-7 bg-gray-200 rounded-xl">
        <div className="col-span-2 justify-start">
          Rentals: {uncommittedRentals}
        </div>
        <div className="col-span-2 justify-center">
          Insurance: {uncommittedInsurance}
        </div>
        <div className="col-span-2 justify-end">
          Commission: ${uncommittedCommission.toFixed(2)}
        </div>
        <div className="flex justify-end">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 flex items-center justify-center"
            >
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="w-auto bg-gray-200 rounded-xl m-2">
        <div className="grid grid-cols-9 items-center">
          <div className="col-span-1 flex justify-end">
            <input
              type="checkbox"
              className="w-4 h-4"
              onChange={(e) => toggleAll(e.target.checked)}
            />
          </div>
          <div className="font-bold col-span-2">Unit</div>
          <div className="font-bold col-span-2">Date</div>
          <div className="font-bold col-span-2">Tenant</div>
          <div className="font-bold "></div>
          <div></div>
        </div>
        {uncommittedActivities.map((activity, index) => (
          <EmployeeActivityData
            index={index}
            activity={activity}
            toggleActivity={toggleActivity}
            selectedActivities={selectedActivities}
            key={activity.activityId}
            employeeList={employeeList}
            employeeName={employee.fullName || undefined}
            refreshData={refreshData}
          />
        ))}
        <div className="grid grid-cols-8 items-center">
          <div className="col-span-2">
            {/* <Button
              onClick={() =>
                updateActivities("markActivitiesAsPaid", selectedActivities)
              }
              variant="ghost"
              size="sm"
              className="justify-end"
              disabled={true}
            >
              Mark as Paid
            </Button> */}
          </div>
          <div className="col-span-6">
            <Button
              onClick={() =>
                updateActivities(
                  "commitActivityCommissionToPayroll",
                  selectedActivities
                )
              }
              variant="outline"
              size="sm"
              className="justify-end m-1"
              disabled={
                employee.fullName === null ||
                employee.position === "ACM_OFFICE" ||
                employee.position === "AREA_MANAGER"
              }
            >
              Add to{" "}
              {nextPayPeriod.endDate &&
                new Date(nextPayPeriod.endDate).toLocaleDateString(undefined, {
                  month: "2-digit",
                  day: "2-digit",
                })}{" "}
              Payroll
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default EmployeeComissionComponent;
