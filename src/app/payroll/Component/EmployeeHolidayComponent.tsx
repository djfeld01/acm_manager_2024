"use client";
import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CalendarIcon, CirclePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { cn, holidays } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  addHoliday,
  addVacation,
} from "@/lib/controllers/payrollController/payrollController";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";
import holiday, {
  AddHolidayHours,
  insertHolidaySchema,
} from "@/db/schema/holiday";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EmployeeHolidayComponentProps = {
  sitelinkId: string;
  employeeId: string;
  payPeriodId: string;
};
function EmployeeHolidayComponent({
  sitelinkId,
  employeeId,
  payPeriodId,
}: EmployeeHolidayComponentProps) {
  const form = useForm<AddHolidayHours>({
    resolver: zodResolver(insertHolidaySchema),
    defaultValues: {
      date: new Date().toLocaleDateString(),
      employeeId: employeeId,
      payPeriodId: payPeriodId,
      facilityId: sitelinkId,
      holidayHasBeenPaid: false,
      holidayHoursType: "thanksgiving",
      holidayHours: 8,
    },
  });
  const [isOpen, setIsOpen] = useState(false);

  const queryClient = getQueryClient();
  async function onSubmit(values: AddHolidayHours) {
    await addHoliday(values);
    setIsOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["committedHolidayHours", payPeriodId, sitelinkId, employeeId],
    });
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="p-1  rounded-xl m-2 ">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Holiday</h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-2">
              <CirclePlusIcon className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Holiday Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-between text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MM/dd/yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-2 h-5 w-5 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-2 bg-white rounded-md shadow-md"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          captionLayout="dropdown-buttons"
                          selected={new Date(field.value) || new Date()}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          fromYear={1960}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="holidayHoursType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={"Holiday"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Holidays</SelectLabel>
                          {holidays.map((holiday) => (
                            <SelectItem
                              value={holiday.value}
                              key={holiday.value}
                            >
                              {holiday.display}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {/* Holiday Hours */}
              <FormField
                control={form.control}
                name="holidayHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Hours for Holiday"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Holiday Note */}
              <FormField
                control={form.control}
                name="holidayNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional note"
                        {...field}
                        value={field.value ?? ""}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Submit
                </Button>
              </div>
            </form>
          </Form>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default EmployeeHolidayComponent;
