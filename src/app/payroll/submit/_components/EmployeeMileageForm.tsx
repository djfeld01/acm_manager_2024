"use client";
import React from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  addMileage,
  getMileageForPeriod,
} from "@/lib/controllers/payrollController/payrollController";
import { insertMileageSchema, AddMileage } from "@/db/schema/mileage";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";

type EmployeeMileageFormProps = {
  employeeId: string;
  sitelinkId: string;
  payPeriodId: string;
};

function EmployeeMileageForm({
  employeeId,
  sitelinkId,
  payPeriodId,
}: EmployeeMileageFormProps) {
  const form = useForm<AddMileage>({
    resolver: zodResolver(insertMileageSchema),
    defaultValues: {
      date: new Date().toLocaleDateString(),
      employeeId,
      facilityId: sitelinkId,
      mileage: 0,
      mileageRate: 0.35,
      payPeriodId,
      mileageHasBeenPaid: false,
    },
  });

  const queryClient = getQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["mileage", payPeriodId, sitelinkId, employeeId],
    queryFn: () => getMileageForPeriod(employeeId, payPeriodId, sitelinkId),
  });

  async function onSubmit(values: AddMileage) {
    await addMileage(values);
    toast.success("Mileage saved.");
    form.reset({
      date: new Date().toLocaleDateString(),
      employeeId,
      facilityId: sitelinkId,
      mileage: 0,
      mileageRate: 0.35,
      payPeriodId,
      mileageHasBeenPaid: false,
    });
    queryClient.invalidateQueries({
      queryKey: ["mileage", payPeriodId, sitelinkId, employeeId],
    });
  }

  return (
    <div className="space-y-4 pt-2">
      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Logged this period
          </p>
          {entries.map((e) => (
            <div
              key={e.mileageId}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <span>{e.date}</span>
              <span className="font-medium">{e.mileage} mi</span>
              {e.mileageNote && (
                <span className="text-muted-foreground text-xs truncate max-w-[120px]">
                  {e.mileageNote}
                </span>
              )}
            </div>
          ))}
          <div className="text-xs text-muted-foreground text-right">
            Total: {entries.reduce((sum, e) => sum + Number(e.mileage), 0)} mi
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
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
                          format(new Date(field.value as string), "MM/dd/yyyy")
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
                      selected={new Date(field.value as string)}
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
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Miles</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0"
                    {...field}
                    type="number"
                    step="0.1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mileageNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Optional note"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit">Save Mileage</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default EmployeeMileageForm;
