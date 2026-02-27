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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addBonus } from "@/lib/controllers/payrollController/payrollController";
import { useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";
import { committedBonusOptions } from "@/app/queryHelpers/queryOptions";
import { toast } from "sonner";

const commissionSchema = z.object({
  amount: z.string().min(1, "Required"),
  note: z.string().optional(),
});

type CommissionFormValues = z.infer<typeof commissionSchema>;

type EmployeeCommissionFormProps = {
  employeeId: string;
  sitelinkId: string;
  payPeriodId: string;
};

function EmployeeCommissionForm({
  employeeId,
  sitelinkId,
  payPeriodId,
}: EmployeeCommissionFormProps) {
  const form = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
    defaultValues: { amount: "", note: "" },
  });

  const queryClient = getQueryClient();

  const { data: existing = [] } = useQuery(
    committedBonusOptions(sitelinkId, employeeId, payPeriodId)
  );

  const commissions = existing.filter((b) => b.bonusType === "commission");

  async function onSubmit(values: CommissionFormValues) {
    await addBonus({
      date: new Date().toDateString(),
      employeeId,
      facilityId: sitelinkId,
      bonusAmount: values.amount,
      bonusType: "commission",
      bonusNote: values.note || undefined,
      payPeriodId,
      bonusHasBeenPaid: false,
    } as any);
    toast.success("Commission added.");
    form.reset({ amount: "", note: "" });
    queryClient.invalidateQueries({
      queryKey: ["committedBonus", payPeriodId, sitelinkId, employeeId],
    });
  }

  return (
    <div className="space-y-4 pt-2">
      {commissions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Commissions this period
          </p>
          {commissions.map((c) => (
            <div
              key={c.bonusId}
              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            >
              <span className="font-medium">${Number(c.bonusAmount).toFixed(2)}</span>
              {c.bonusNote && (
                <span className="text-muted-foreground text-xs">{c.bonusNote}</span>
              )}
            </div>
          ))}
          <div className="text-xs text-muted-foreground text-right">
            Total: ${commissions.reduce((s, c) => s + Number(c.bonusAmount), 0).toFixed(2)}
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input placeholder="0.00" {...field} type="number" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
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
            <Button type="submit">Add Commission</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default EmployeeCommissionForm;
