"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CheckSquare2, ChevronsUpDown, WrenchIcon } from "lucide-react";

// Type for each activity
export type Activity = {
  activityType: string;
  date: string; // ISO 8601 string format for date
  unitName: string;
  tenantName: string;
  activityId: number;
  hasInsurance: boolean;
};

// Type for each user and their activities
type UserWithActivities = {
  commission: number | null;
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
  rentals: number;
  insurance: number;
  activities: Activity[]; // Array of Activity objects
};

type EmployeeCardProps = {
  employee: UserWithActivities;
};
export function EmployeeCard({ employee }: EmployeeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState(new Set());
  const isDesktop = useMediaQuery("(min-width: 768px)");

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedActivities(
        new Set(employee.activities.map((a) => a.activityId))
      );
    } else {
      setSelectedActivities(new Set());
    }
  }

  function toggleActivity(activityId: number) {
    setSelectedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      console.log("🚀 ~ setSelectedActivities ~ newSet:", newSet);

      return newSet;
    });
  }

  // if (isDesktop) {
  return (
    // <Dialog open={open} onOpenChange={setOpen}>
    <Card className="bg-gray-300 p-1 rounded-lg  flex-1 basis-1/3 text-center">
      <CardTitle>
        {employee?.firstName || "Unlinked Rentals"} {employee?.lastName || ""}
      </CardTitle>
      <CardDescription>{employee?.position || "NA"}</CardDescription>
      <CardContent>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="col-span-7">Unpaid Commissions</div>
          <div className="grid grid-cols-7 bg-gray-200 rounded-xl">
            <div className="col-span-2 justify-start">
              Rentals: {employee.rentals}
            </div>
            <div className="col-span-2 justify-center">
              Insurance: {employee.insurance}
            </div>
            <div className="col-span-2 justify-end">
              Commission: ${employee.commission?.toFixed(2)}
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
                {/* <div className=" w-6 h-6 flex items-center justify-end">
                  <CheckSquare2 className="h-5 w-5" />
                </div> */}
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
            {employee.activities.map((activity, index) => (
              <div
                className={`${
                  index % 2 === 0 ? "bg-white" : "bg-slate-300"
                } grid grid-cols-9 items-center`}
                key={activity.activityId}
              >
                <div className="col-span-1 flex justify-end">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={selectedActivities.has(activity.activityId)}
                    onChange={() => toggleActivity(activity.activityId)}
                  />
                </div>
                <div className="col-span-2">{activity.unitName}</div>
                <div className="col-span-2">
                  {new Date(activity.date).toLocaleDateString()}
                </div>
                <div className="col-span-2">{activity.tenantName}</div>
                <div className="col-span-1">
                  {activity.hasInsurance ? "Ins" : ""}
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 flex items-center justify-center"
                  >
                    <WrenchIcon className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-8 items-center">
              <div className="col-span-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-end"
                  disabled={
                    employee.fullName === null ||
                    employee.position === "ACM_OFFICE" ||
                    employee.position === "AREA_MANAGER"
                  }
                >
                  Mark as Paid
                </Button>
              </div>
              <div className="col-span-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-end"
                  disabled={
                    employee.fullName === null ||
                    employee.position === "ACM_OFFICE" ||
                    employee.position === "AREA_MANAGER"
                  }
                >
                  Add to Current Payroll
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
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

function ProfileForm({ className }: React.ComponentProps<"form">) {
  return (
    <form className={cn("grid items-start gap-4", className)}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" defaultValue="shadcn@example.com" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" defaultValue="@shadcn" />
      </div>
      <Button type="submit">Save changes</Button>
    </form>
  );
}
