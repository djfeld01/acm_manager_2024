"use client";
import React, { useState } from "react";

import { PlusCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  calculateRetailBonus,
  calculateStorageBonus,
  caluclateReceivableBonus,
  getLastMonthDateRange,
} from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { addBonus } from "@/lib/controllers/payrollController";
import { getQueryClient } from "@/app/queryHelpers/getQueryClient";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddBonus, insertBonusSchema } from "@/db/schema/bonus";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  getMonthlyNumbers,
  workingEmployees,
} from "@/app/queryHelpers/queryOptions";
import { Card, CardContent } from "@/components/ui/card";
import { addMonthlyBonus } from "@/app/queryHelpers/queries";

type EmployeeMonthlyBonusComponentProps = {
  sitelinkId: string;
  employeeId: string;
  payPeriodId: string;
  employeePosition: string;
};
function EmployeeMonthlyBonusComponent({
  sitelinkId,
  employeeId,
  payPeriodId,
  employeePosition,
}: EmployeeMonthlyBonusComponentProps) {
  const form = useForm<AddBonus>({
    resolver: zodResolver(insertBonusSchema),
    defaultValues: {
      date: new Date().toLocaleDateString(),
      employeeId: employeeId,
      payPeriodId: payPeriodId,
      facilityId: sitelinkId,
      bonusHasBeenPaid: false,
      bonusAmount: 0,
      bonusType: "Shop",
    },
  });
  const [isOpen, setIsOpen] = useState(false);

  const { start: startOfLastMonthString, end: endOfLastMonthString } =
    getLastMonthDateRange();

  let endOfLastMonth = new Date();
  endOfLastMonth.setUTCDate(0);

  const queryClient = getQueryClient();
  const { data: employees, isFetching: employeesIsFetching } = useQuery(
    workingEmployees(sitelinkId)
  );
  const numberOfEmployees = employees?.filter(
    (employee) =>
      employee.employeePosition === "MANAGER" ||
      employee.employeePosition === "ASSISTANT"
  ).length;

  const { data: monthlyNumbers, isFetching: monthlyNumbersIsFetching } =
    useQuery(getMonthlyNumbers(sitelinkId, endOfLastMonth.toISOString()));
  const receivableActual =
    monthlyNumbers?.dailyManagementReceivable.reduce(
      (prev, curr) => prev + curr.delinquentTotal,
      0
    ) || 0;

  const retailBonus = calculateRetailBonus(
    Number(monthlyNumbers?.monthlyGoals[0].retailGoal),
    monthlyNumbers?.dailyManagementPaymentReceipt[0].monthlyAmount || 0,
    1,
    numberOfEmployees || 1
  );

  const storageBonus = calculateStorageBonus(
    monthlyNumbers?.monthlyGoals[0].rentalGoal || 0,
    monthlyNumbers?.dailyManagementActivity[0]?.monthlyTotal || 0,
    monthlyNumbers?.dailyManagementOccupancy[0]?.unitOccupancy || 0,
    employeePosition
  );

  const receivableBonus = caluclateReceivableBonus(
    Number(monthlyNumbers?.monthlyGoals[0].collectionsGoal),
    receivableActual,
    employeePosition
  );

  async function onSubmitBonus(
    bonusType: "Rental" | "Receivable" | "Retail",
    bonusAmount: number
  ) {
    try {
      await addMonthlyBonus(
        employeeId,
        sitelinkId,
        bonusType,
        bonusAmount,
        payPeriodId,
        endOfLastMonthString,
        startOfLastMonthString
      );
      await queryClient.invalidateQueries({
        queryKey: ["committedBonus", payPeriodId, sitelinkId, employeeId],
      });
      alert(`Added ${bonusType} Bonus`);
    } catch (e) {
      console.error(`addMonthlyBonus failed for ${bonusType}`, e);
    }
  }

  return (
    <Card>
      Monthly Bonuses
      <CardContent>
        <div className="text-sm font-medium">Rental Bonus</div>
        <div className="grid grid-cols-2 gap-2 items-center mb-4">
          <div className="text-right font-semibold">
            ${storageBonus.toFixed(2)}
          </div>
          {storageBonus > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 flex items-center justify-center"
              aria-label="Add Rental Bonus"
              onClick={() => onSubmitBonus("Rental", storageBonus)}
            >
              <PlusCircleIcon />
            </Button>
          )}
        </div>

        <div className="text-sm font-medium">Receivable Bonus</div>
        <div className="grid grid-cols-2 gap-2 items-center mb-4">
          <div className="text-right font-semibold">
            ${receivableBonus.toFixed(2)}
          </div>
          {receivableBonus > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 flex items-center justify-center"
              aria-label="Add Receivable Bonus"
              onClick={() => onSubmitBonus("Receivable", receivableBonus)}
            >
              <PlusCircleIcon />
            </Button>
          )}
        </div>

        <div className="text-sm font-medium">Retail Bonus</div>
        <div className="grid grid-cols-2 gap-2 items-center mb-4">
          <div className="text-right font-semibold">
            ${retailBonus.toFixed(2)}
          </div>
          {retailBonus > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 flex items-center justify-center"
              aria-label="Add Retail Bonus"
              onClick={() => onSubmitBonus("Retail", retailBonus)}
            >
              <PlusCircleIcon />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
    //   <Collapsible open={isOpen} onOpenChange={setIsOpen}>
    //     <div className="p-1  rounded-xl m-2 ">
    //       <div className="flex justify-between items-center mb-4">
    //         <h2 className="text-lg font-semibold">Add Monthly Bonuses</h2>
    //         <CollapsibleTrigger asChild>
    //           <Button variant="ghost" className="p-2">
    //             <CirclePlusIcon className="h-5 w-5" />
    //           </Button>
    //         </CollapsibleTrigger>
    //       </div>
    //       <CollapsibleContent>
    //         <Form {...form}>
    //           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    //             <FormField
    //               control={form.control}
    //               name="date"
    //               render={({ field }) => (
    //                 <FormItem>
    //                   <FormLabel>Bonus Month</FormLabel>
    //                   <Popover>
    //                     <PopoverTrigger asChild>
    //                       <FormControl>
    //                         <Button
    //                           variant="outline"
    //                           className={cn(
    //                             "w-full justify-between text-left font-normal",
    //                             !field.value && "text-muted-foreground"
    //                           )}
    //                         >
    //                           {field.value ? (
    //                             format(field.value, "MM/dd/yyyy")
    //                           ) : (
    //                             <span>Pick a date</span>
    //                           )}
    //                           <CalendarIcon className="ml-2 h-5 w-5 opacity-50" />
    //                         </Button>
    //                       </FormControl>
    //                     </PopoverTrigger>
    //                     <PopoverContent
    //                       className="w-auto p-2 bg-white rounded-md shadow-md"
    //                       align="start"
    //                     >
    //                       <Calendar
    //                         mode="single"
    //                         captionLayout="dropdown-buttons"
    //                         selected={new Date(field.value) || new Date()}
    //                         onSelect={field.onChange}
    //                         disabled={(date) =>
    //                           date > new Date() || date < new Date("1900-01-01")
    //                         }
    //                         initialFocus
    //                         fromYear={1960}
    //                         toYear={2030}
    //                       />
    //                     </PopoverContent>
    //                   </Popover>
    //                   <FormMessage />
    //                 </FormItem>
    //               )}
    //             />

    //             <FormField
    //               control={form.control}
    //               name="bonusAmount"
    //               render={({ field }) => (
    //                 <FormItem>
    //                   <FormLabel>Bonus Amount</FormLabel>
    //                   <FormControl>
    //                     <Input
    //                       placeholder="Hours for Holiday"
    //                       {...field}
    //                       className="w-full"
    //                     />
    //                   </FormControl>
    //                 </FormItem>
    //               )}
    //             />

    //             <FormField
    //               control={form.control}
    //               name="bonusType"
    //               render={({ field }) => (
    //                 <FormItem>
    //                   <FormLabel>Bonus Type</FormLabel>
    //                   <FormControl>
    //                     <Input
    //                       placeholder="Bonus Type"
    //                       {...field}
    //                       value={field.value ?? ""}
    //                       className="w-full"
    //                     />
    //                   </FormControl>
    //                 </FormItem>
    //               )}
    //             />

    //             {/* Submit Button */}
    //             <div className="flex justify-end">
    //               <Button
    //                 type="submit"
    //                 className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
    //               >
    //                 Submit
    //               </Button>
    //             </div>
    //           </form>
    //         </Form>
    //       </CollapsibleContent>
    //     </div>
    //   </Collapsible>
  );
}

export default EmployeeMonthlyBonusComponent;
