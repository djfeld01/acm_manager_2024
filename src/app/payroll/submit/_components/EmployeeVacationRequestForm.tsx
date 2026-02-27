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
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getVacationRequestsForPeriod,
  submitVacationRequest,
} from "@/lib/controllers/payrollController/payrollController";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";

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

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
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

  const queryClient = getQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["vacationRequests", payPeriodId, employeeId],
    queryFn: () => getVacationRequestsForPeriod(employeeId, payPeriodId),
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
    queryClient.invalidateQueries({
      queryKey: ["vacationRequests", payPeriodId, employeeId],
    });
  }

  return (
    <div className="space-y-4 pt-2">
      {requests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Requests this period
          </p>
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <span>
                {r.startDate} – {r.endDate} ({r.hoursRequested} hrs)
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  statusColors[r.status] ?? "bg-gray-100 text-gray-600"
                )}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
    </div>
  );
}

export default EmployeeVacationRequestForm;
