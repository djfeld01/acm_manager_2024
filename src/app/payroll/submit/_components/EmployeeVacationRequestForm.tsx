"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { submitVacationRequest } from "@/lib/controllers/payrollController/payrollController";
import { toast } from "sonner";

const vacationSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  hoursRequested: z.string().min(1, "Required"),
});

type VacationFormValues = z.infer<typeof vacationSchema>;

type EmployeeVacationRequestFormProps = {
  employeeId: string;
  sitelinkId: string;
  payPeriodId: string;
};

function EmployeeVacationRequestForm({
  employeeId,
  sitelinkId,
  payPeriodId,
}: EmployeeVacationRequestFormProps) {
  const form = useForm<VacationFormValues>({
    resolver: zodResolver(vacationSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
      hoursRequested: "",
    },
  });

  async function onSubmit(values: VacationFormValues) {
    await submitVacationRequest({
      employeeId,
      payPeriodId,
      facilityId: sitelinkId,
      startDate: format(values.startDate, "yyyy-MM-dd"),
      endDate: format(values.endDate, "yyyy-MM-dd"),
      hoursRequested: values.hoursRequested,
    });
    toast.success("Vacation request submitted.");
    form.reset({ startDate: new Date(), endDate: new Date(), hoursRequested: "" });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
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
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
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
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hoursRequested"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours Requested</FormLabel>
              <FormControl>
                <Input
                  placeholder="Hours"
                  {...field}
                  type="number"
                  step="0.25"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">Submit Request</Button>
        </div>
      </form>
    </Form>
  );
}

export default EmployeeVacationRequestForm;
