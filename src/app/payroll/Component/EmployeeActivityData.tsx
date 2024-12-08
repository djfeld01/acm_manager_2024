"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { WrenchIcon } from "lucide-react";
import { Activity } from "./EmployeeComissionComponent";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { updateActivityUser } from "@/lib/controllers/activityController";
import { useQueryClient } from "@tanstack/react-query";

type EmployeeActivityDataProps = {
  index: number;
  selectedActivities: number[];
  activity: Activity;
  toggleActivity: (activityId: number) => void;
  employeeList: { userDetailId: string; firstName: string; lastName: string }[];
  employeeName?: string;
  sitelinkId: string;
};
const FormSchema = z.object({
  userDetailId: z.string({
    required_error: "Please select a user to assign activity to.",
  }),
});
function EmployeeActivityData({
  index,
  selectedActivities,
  activity,
  toggleActivity,
  employeeList,
  employeeName,
  sitelinkId,
}: EmployeeActivityDataProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const dataToSubmit = {
      activityId: activity.activityId,
      userDetailId: data.userDetailId,
    };
    const updatedValue = await updateActivityUser(dataToSubmit);
    setIsOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["payrollPageData", sitelinkId],
    });
  }
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-8"
          >
            <FormField
              control={form.control}
              name="userDetailId"
              render={({ field }) => (
                <FormItem className="col-span-4 m-2">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={employeeName || "assign to employee"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Employees</SelectLabel>
                        {employeeList.map((employee) => (
                          <SelectItem
                            value={employee.userDetailId}
                            key={employee.userDetailId}
                          >
                            {employee.firstName} {employee.lastName}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="col-span-1"></div>
            <Button type="submit" className="col-span-3 m-2" variant="outline">
              Change Assignment
            </Button>
          </form>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default EmployeeActivityData;
