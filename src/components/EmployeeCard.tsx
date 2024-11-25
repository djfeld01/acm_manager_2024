"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

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
import { CirclePlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import EmployeeVacationComponent from "./EmployeeVacationComponent";
import EmployeeMileageComponent from "./EmployeeMileageComponent";
import EmployeeDaysWorkedComponent from "./EmployeeDaysWorkedComponent";

type EmployeeCardProps = {
  employee: UserWithActivities;
  nextPayPeriod: PayPeriod;
  storageCommissionRate: number;
  insuranceCommissionRate: number;
  employeeList: { userDetailId: string; firstName: string; lastName: string }[];
  refreshData: () => void;
  sitelinkId: string;
};

function calculateCommission(
  position: string,
  insurance: number,
  insuranceCommissionRate: number,
  rentals: number,
  storageCommissionRate: number
) {
  return position === "MANAGER"
    ? insurance * insuranceCommissionRate
    : insurance * insuranceCommissionRate + rentals * storageCommissionRate;
}

export function EmployeeCard({
  employee,
  nextPayPeriod,
  storageCommissionRate,
  insuranceCommissionRate,
  employeeList,
  refreshData,
  sitelinkId,
}: EmployeeCardProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { position } = employee;
  const [committedActivities, setCommittedActivities] = useState<Activity[]>(
    employee.committedActivities
  );
  const [uncommittedActivities, setUncommittedActivities] = useState<
    Activity[]
  >(employee.activities);

  const [uncommmittedRentals, setUncommittedRentals] = useState<number>(
    uncommittedActivities.length
  );
  const [uncommittedInsurance, setUncommittedInsurance] = useState<number>(
    uncommittedActivities.reduce(
      (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
      0
    )
  );
  const [uncommittedCommission, setUncommittedCommission] = useState<number>(
    calculateCommission(
      position || "",
      uncommittedInsurance,
      insuranceCommissionRate,
      uncommmittedRentals,
      storageCommissionRate
    )
  );

  const [commmittedRentals, setCommittedRentals] = useState<number>(
    committedActivities.length
  );
  const [committedInsurance, setCommittedInsurance] = useState<number>(
    committedActivities.reduce(
      (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
      0
    )
  );
  const [committedCommission, setCommittedCommission] = useState<number>(
    calculateCommission(
      position || "",
      committedInsurance,
      insuranceCommissionRate,
      commmittedRentals,
      storageCommissionRate
    )
  );
  async function updateActivities(
    buttonType: string,
    selectedActivities: number[]
  ) {
    if (buttonType === "markActivitiesAsPaid") {
      await markActivitiesAsPaid(selectedActivities);
    }

    if (buttonType === "uncommitActivity") {
      await uncommitActivityFromPayroll(selectedActivities);
      // Move selected activities from uncommitted to committed
      setUncommittedActivities((prevActivities) => {
        const activitiesToAdd = committedActivities.filter((activity) =>
          selectedActivities.includes(activity.activityId)
        );
        const updatedActivities = [...prevActivities, ...activitiesToAdd];
        const updatedRentals = updatedActivities.length;
        const updatedInsurance = updatedActivities.reduce(
          (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
          0
        );

        const updatedCommission = calculateCommission(
          position || "",
          updatedInsurance,
          insuranceCommissionRate,
          updatedRentals,
          storageCommissionRate
        );

        setUncommittedRentals(updatedRentals),
          setUncommittedInsurance(updatedInsurance),
          setUncommittedCommission(updatedCommission);
        return updatedActivities;
      });

      setCommittedActivities((prevActivities) => {
        const updatedActivities = prevActivities.filter(
          (activity) => !selectedActivities.includes(activity.activityId)
        );
        const updatedRentals = updatedActivities.length;
        const updatedInsurance = updatedActivities.reduce(
          (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
          0
        );
        const updatedCommission = calculateCommission(
          position || "",
          updatedInsurance,
          insuranceCommissionRate,
          updatedRentals,
          storageCommissionRate
        );

        setCommittedRentals(updatedRentals);
        setCommittedInsurance(updatedInsurance);
        setCommittedCommission(updatedCommission);
        return updatedActivities;
      });
    }

    if (buttonType === "commitActivityCommissionToPayroll") {
      await commitActivityCommissionToPayroll(
        selectedActivities,
        nextPayPeriod.payPeriodId
      );
      // Move selected activities from uncommitted to committed
      setCommittedActivities((prevActivities) => {
        const activitiesToAdd = uncommittedActivities.filter((activity) =>
          selectedActivities.includes(activity.activityId)
        );
        const updatedActivities = [...prevActivities, ...activitiesToAdd];
        const updatedRentals = updatedActivities.length;
        const updatedInsurance = updatedActivities.reduce(
          (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
          0
        );

        const updatedCommission = calculateCommission(
          position || "",
          updatedInsurance,
          insuranceCommissionRate,
          updatedRentals,
          storageCommissionRate
        );

        setCommittedRentals(updatedRentals),
          setCommittedInsurance(updatedInsurance),
          setCommittedCommission(updatedCommission);
        return updatedActivities;
      });

      setUncommittedActivities((prevActivities) => {
        const updatedActivities = prevActivities.filter(
          (activity) => !selectedActivities.includes(activity.activityId)
        );
        const updatedRentals = updatedActivities.length;
        const updatedInsurance = updatedActivities.reduce(
          (prev, activity) => (activity.hasInsurance ? prev + 1 : prev),
          0
        );
        const updatedCommission = calculateCommission(
          position || "",
          updatedInsurance,
          insuranceCommissionRate,
          updatedRentals,
          storageCommissionRate
        );

        setUncommittedRentals(updatedRentals);
        setUncommittedInsurance(updatedInsurance);
        setUncommittedCommission(updatedCommission);
        return updatedActivities;
      });
    }
  }
  // if (isDesktop) {
  return (
    // <Dialog open={open} onOpenChange={setOpen}>
    <Card className="bg-gray-300 p-1 rounded-lg  flex-1 basis-1/3 text-center">
      <CardTitle>
        {employee?.firstName || "Unlinked Rentals"} {employee?.lastName || ""}
      </CardTitle>
      <CardDescription>{employee?.position || "NA"}</CardDescription>{" "}
      <CardContent>
        {employee.fullName && (
          <EmployeeCommittedPayroll
            committedActivities={committedActivities}
            committedCommission={committedCommission}
            updateActivities={updateActivities}
            vacation={employee?.vacation || []}
            mileage={employee?.mileage || []}
          />
        )}
        <EmployeeComissionComponent
          employeeList={employeeList}
          employee={employee}
          uncommittedActivities={uncommittedActivities}
          uncommittedRentals={uncommmittedRentals}
          uncommittedCommission={uncommittedCommission}
          uncommittedInsurance={uncommittedInsurance}
          nextPayPeriod={nextPayPeriod}
          updateActivities={updateActivities}
          refreshData={refreshData}
        />

        {employee.userDetailsId && (
          <div className="grid grid-cols-2">
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
            <div></div>
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

    //   <DialogTrigger asChild>
    //     <Button variant="outline">Edit Profile</Button>
    //   </DialogTrigger>
    //   <DialogContent className="sm:max-w-[425px]">
    //     <DialogHeader>
    //       <DialogTitle>Edit profile</DialogTitle>
    //       <DialogDescription>
    //         Make changes to your profile here. Click save when you're done.
    //       </DialogDescription>
    //     </DialogHeader>
    //     <ProfileForm />
    //   </DialogContent>
    // </Dialog>
  );
  // }

  // return (
  //   <Drawer open={open} onOpenChange={setOpen}>
  //     <DrawerTrigger asChild>
  //       <Button variant="outline">Edit Profile</Button>
  //     </DrawerTrigger>
  //     <DrawerContent>
  //       <DrawerHeader className="text-left">
  //         <DrawerTitle>Edit profile</DrawerTitle>
  //         <DrawerDescription>
  //           Make changes to your profile here. Click save when you're done.
  //         </DrawerDescription>
  //       </DrawerHeader>
  //       <ProfileForm className="px-4" />
  //       <DrawerFooter className="pt-2">
  //         <DrawerClose asChild>
  //           <Button variant="outline">Cancel</Button>
  //         </DrawerClose>
  //       </DrawerFooter>
  //     </DrawerContent>
  //   </Drawer>
  // );
}
