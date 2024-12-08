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
import { AddVacationHours, insertVacationSchema } from "@/db/schema/vacation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { payPeriodRelations } from "@/db/schema";
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
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { addVacation } from "@/lib/controllers/payrollController";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";

type EmployeeVacationComponentProps = {
  sitelinkId: string;
  employeeId: string;
  payPeriodId: string;
};
function EmployeeVacationComponent({
  sitelinkId,
  employeeId,
  payPeriodId,
}: EmployeeVacationComponentProps) {
  const form = useForm<AddVacationHours>({
    resolver: zodResolver(insertVacationSchema),
    defaultValues: {
      date: new Date().toLocaleDateString(),
      employeeId: employeeId,
      payPeriodId: payPeriodId,
      facilityId: sitelinkId,
      vacationHasBeenPaid: false,
      vacationHoursType: "USED",
    },
  });
  const [isOpen, setIsOpen] = useState(false);

  const queryClient = getQueryClient();
  async function onSubmit(values: AddVacationHours) {
    await addVacation(values);
    setIsOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["payrollPageData", sitelinkId],
    });
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="p-1  rounded-xl m-2 ">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add Vacation</h2>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-2">
              <CirclePlusIcon className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Vacation Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vacation Date</FormLabel>
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

              {/* Vacation Hours */}
              <FormField
                control={form.control}
                name="vacationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Requested hours"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Vacation Note */}
              <FormField
                control={form.control}
                name="vacationNote"
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

export default EmployeeVacationComponent;
