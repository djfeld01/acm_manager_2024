"use client";
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getEmployeeCompensationHistory,
  addCompensationEntry,
  type EmployeeCurrentComp,
  type EmployeeCompensationEntry,
} from "@/lib/controllers/compensationController";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const CHANGE_REASON_LABELS: Record<string, string> = {
  HIRE: "Hire",
  ANNUAL_INCREASE: "Annual Increase",
  INTERIM_RAISE: "Interim Raise",
  PROMOTION: "Promotion",
  OTHER: "Other",
};

const CHANGE_REASON_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  HIRE: "default",
  ANNUAL_INCREASE: "secondary",
  INTERIM_RAISE: "secondary",
  PROMOTION: "default",
  OTHER: "outline",
};

function formatDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatWage(wage: string, type: string): string {
  return `$${Number(wage).toFixed(2)}${type === "HOURLY" ? "/hr" : "/yr"}`;
}

const entrySchema = z.object({
  effectiveDate: z.string().min(1, "Required"),
  wage: z
    .string()
    .min(1, "Required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
  compensationType: z.enum(["HOURLY", "SALARY"]),
  title: z.string().optional(),
  changeReason: z.enum([
    "HIRE",
    "ANNUAL_INCREASE",
    "INTERIM_RAISE",
    "PROMOTION",
    "OTHER",
  ]),
  notes: z.string().optional(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

type Props = {
  employee: EmployeeCurrentComp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function HistoryEntry({ entry }: { entry: EmployeeCompensationEntry }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{formatWage(entry.wage, entry.compensationType)}</span>
        <Badge variant={CHANGE_REASON_VARIANTS[entry.changeReason] ?? "outline"}>
          {CHANGE_REASON_LABELS[entry.changeReason] ?? entry.changeReason}
        </Badge>
      </div>
      <div className="text-muted-foreground text-xs flex gap-3">
        <span>{formatDate(entry.effectiveDate)}</span>
        {entry.title && <span>· {entry.title}</span>}
        <span>· {entry.compensationType}</span>
      </div>
      {entry.notes && (
        <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
      )}
    </div>
  );
}

export function CompensationHistorySheet({ employee, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["compensationHistory", employee.employeeId],
    queryFn: () => getEmployeeCompensationHistory(employee.employeeId),
    enabled: open,
  });

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      effectiveDate: "",
      wage: "",
      compensationType: "HOURLY",
      title: "",
      changeReason: "ANNUAL_INCREASE",
      notes: "",
    },
  });

  async function onSubmit(values: EntryFormValues) {
    try {
      await addCompensationEntry({
        employeeId: employee.employeeId,
        effectiveDate: values.effectiveDate,
        wage: values.wage,
        compensationType: values.compensationType,
        title: values.title || undefined,
        changeReason: values.changeReason,
        notes: values.notes || undefined,
      });
      toast.success("Compensation entry added.");
      form.reset();
      queryClient.invalidateQueries({
        queryKey: ["compensationHistory", employee.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["employeesCurrentCompensation"],
      });
    } catch (err) {
      toast.error("Failed to add entry. Please try again.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{employee.fullName}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* History */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Compensation History</h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No compensation records yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <HistoryEntry key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add new entry */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Add New Entry</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="effectiveDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="wage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wage ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="compensationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HOURLY">Hourly</SelectItem>
                            <SelectItem value="SALARY">Salary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="changeReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Change Reason</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HIRE">Hire</SelectItem>
                            <SelectItem value="ANNUAL_INCREASE">Annual Increase</SelectItem>
                            <SelectItem value="INTERIM_RAISE">Interim Raise</SelectItem>
                            <SelectItem value="PROMOTION">Promotion</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Manager" {...field} value={field.value ?? ""} />
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
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional context..."
                          rows={3}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Saving..." : "Add Entry"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
