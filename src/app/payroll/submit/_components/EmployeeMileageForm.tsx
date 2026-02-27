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
import { addMileage } from "@/lib/controllers/payrollController/payrollController";
import { insertMileageSchema, AddMileage } from "@/db/schema/mileage";
import { toast } from "sonner";

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
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
  );
}

export default EmployeeMileageForm;
