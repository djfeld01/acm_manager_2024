"use client";
import React, { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getHoursEntry, saveHoursEntry } from "@/lib/controllers/payrollController/payrollController";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const hoursSchema = z.object({
  regularHours: z.string().min(1, "Required"),
  overtimeHours: z.string().default("0"),
  notes: z.string().optional(),
});

type HoursFormValues = z.infer<typeof hoursSchema>;

type EmployeeHoursFormProps = {
  employeeId: string;
  sitelinkId: string;
  payPeriodId: string;
};

function EmployeeHoursForm({
  employeeId,
  sitelinkId,
  payPeriodId,
}: EmployeeHoursFormProps) {
  const form = useForm<HoursFormValues>({
    resolver: zodResolver(hoursSchema),
    defaultValues: { regularHours: "", overtimeHours: "0", notes: "" },
  });

  const { data: existing } = useQuery({
    queryKey: ["hoursEntry", payPeriodId, sitelinkId, employeeId],
    queryFn: () => getHoursEntry(employeeId, payPeriodId, sitelinkId),
  });

  useEffect(() => {
    if (existing) {
      form.reset({
        regularHours: existing.regularHours ?? "",
        overtimeHours: existing.overtimeHours ?? "0",
        notes: existing.notes ?? "",
      });
    }
  }, [existing, form]);

  const queryClient = getQueryClient();

  async function onSubmit(values: HoursFormValues) {
    await saveHoursEntry({
      employeeId,
      payPeriodId,
      facilityId: sitelinkId,
      regularHours: values.regularHours,
      overtimeHours: values.overtimeHours,
      notes: values.notes,
    });
    toast.success("Hours saved.");
    queryClient.invalidateQueries({
      queryKey: ["hoursEntry", payPeriodId, sitelinkId, employeeId],
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="regularHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regular Hours</FormLabel>
              <FormControl>
                <Input
                  placeholder="0.00"
                  {...field}
                  type="number"
                  step="0.25"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="overtimeHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overtime Hours</FormLabel>
              <FormControl>
                <Input
                  placeholder="0.00"
                  {...field}
                  type="number"
                  step="0.25"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional notes"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">Save Hours</Button>
        </div>
      </form>
    </Form>
  );
}

export default EmployeeHoursForm;
