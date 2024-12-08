"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, WrenchIcon } from "lucide-react";
import {
  commitActivityCommissionToPayroll,
  markActivitiesAsPaid,
} from "@/lib/controllers/activityController";
import next from "next";
import EmployeeActivityData from "./EmployeeActivityData";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { mutateCommitActivityCommissionToPayroll } from "@/app/queryHelpers/queries";
import { payPeriod } from "@/db/schema";
import { payrollPageDataOptions } from "@/app/queryHelpers/queryOptions";
import { calculateCommission } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type Mileage = {
  mileageId: string;
  mileage: number;
  date: string;
  mileageNote?: string;
  mileageRate: number;
};
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
  mileage: Mileage[];
};
type EmployeeCommissionComponentProps = {
  employeeId: string;

  sitelinkId: string;
};
function EmployeeComissionComponent({
  employeeId,
  sitelinkId,
}: EmployeeCommissionComponentProps) {
  const queryClient = useQueryClient();
  const { data: employeesData, isRefetching } = useSuspenseQuery(
    payrollPageDataOptions(sitelinkId)
  );

  const {
    employees,
    nextPayPeriod,
    insuranceCommissionRate,
    storageCommissionRate,
    employeeList,
  } = employeesData;

  const employee = employees.filter(
    (employee) => employee.userDetailsId === employeeId
  )[0];
  const { activities } = employee;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedActivities(activities.map((a) => a.activityId));
    } else {
      setSelectedActivities([]);
    }
  }
  const uncommittedRentals = activities.length;

  const uncommittedInsurance = activities.reduce(
    (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
    0
  );
  const position = employee.position;

  const uncommittedCommission = calculateCommission(
    position || "",
    uncommittedInsurance,
    insuranceCommissionRate,
    uncommittedRentals,
    storageCommissionRate
  );

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

  const mutation = useMutation({
    mutationFn: mutateCommitActivityCommissionToPayroll,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["payrollPageData", sitelinkId],
        refetchType: "all",
      }),
  });

  function handleChange(activitiesArray: number[], payPeriodId: string) {
    mutation.mutate({
      activitiesArray: activitiesArray,
      payPeriodId: payPeriodId,
    });
    setIsOpen(false);
  }

  if (isRefetching) {
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
            {activities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 flex items-center justify-center"
              >
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            )}
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
        {activities.map((activity, index) => (
          <EmployeeActivityData
            index={index}
            activity={activity}
            toggleActivity={toggleActivity}
            selectedActivities={selectedActivities}
            key={activity.activityId}
            employeeList={employeeList}
            employeeName={employee.fullName || undefined}
            sitelinkId={sitelinkId}
          />
        ))}
        <div className="grid grid-cols-8 items-center">
          <div className="col-span-2">
            {/* <Button
              onClick={() => updateActivities(selectedActivities)}
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
                handleChange(selectedActivities, nextPayPeriod.payPeriodId)
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
