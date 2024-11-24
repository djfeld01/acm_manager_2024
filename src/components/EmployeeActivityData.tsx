import React, { useState } from "react";
import { Button } from "./ui/button";
import { WrenchIcon } from "lucide-react";
import { Activity } from "./EmployeeComissionComponent";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type EmployeeActivityDataProps = {
  index: number;
  selectedActivities: number[];
  activity: Activity;
  toggleActivity: (activityId: number) => void;
  employeeList: { userDetailId: string; firstName: string; lastName: string }[];
  employeeName?: string;
};
function EmployeeActivityData({
  index,
  selectedActivities,
  activity,
  toggleActivity,
  employeeList,
  employeeName,
}: EmployeeActivityDataProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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
            checked={selectedActivities.includes(activity.activityId)}
            onChange={() => toggleActivity(activity.activityId)}
          />
        </div>
        <div className="col-span-2">{activity.unitName}</div>
        <div className="col-span-2">
          {new Date(activity.date).toLocaleDateString(undefined, {
            month: "2-digit",
            day: "2-digit",
          })}
        </div>
        <div className="col-span-2">{activity.tenantName}</div>
        <div className="col-span-1">{activity.hasInsurance ? "Ins" : ""}</div>
        <CollapsibleTrigger>
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
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <Select>
          <SelectTrigger className="w-[140px] m-2">
            <SelectValue placeholder={employeeName || "assign to employee"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="blueberry">Blueberry</SelectItem>
              <SelectItem value="grapes">Grapes</SelectItem>
              <SelectItem value="pineapple">Pineapple</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default EmployeeActivityData;
