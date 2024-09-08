"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import monthlyGoals, {
  CreateMonthlyGoals,
  insertMonthlyGoalsSchema,
} from "@/db/schema/monthlyGoals";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { number, z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { CalendarIcon } from "@radix-ui/react-icons";
import { ToastAction } from "./ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Link from "next/link";
import { db } from "@/db";
import { insertMonthlyGoals } from "@/lib/controllers/activityController";

interface facilityType {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
}
type AddMonthlyGoalFormPropsType = {
  facilities: facilityType[];
};

export function AddMonthlyGoalForm({
  facilities,
}: AddMonthlyGoalFormPropsType): JSX.Element {
  const { toast } = useToast();
  const form = useForm<CreateMonthlyGoals>({
    resolver: zodResolver(insertMonthlyGoalsSchema),
    defaultValues: {
      collectionsGoal: "",
      month: new Date(),
      sitelinkId: facilities[0].sitelinkId,
      rentalGoal: undefined,
      retailGoal: "",
    },
  });

  async function onSubmit(values: CreateMonthlyGoals) {
    //set date to 1st of the month
    const pickedYear = values.month?.getFullYear() ?? 2000;
    const pickedMonth = values.month?.getMonth() ?? 0;

    values.month = new Date(pickedYear, pickedMonth);
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(values, null, 2)}</code>
        </pre>
      ),
    });
    const response = await insertMonthlyGoals(values);
    toast({
      title: "Database Response",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">
            {JSON.stringify(response, null, 2)}
          </code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Month</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "MMM yyyy")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-buttons"
                    selected={field.value || new Date()}
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
          name="sitelinkId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facility</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem
                      key={facility.sitelinkId}
                      value={facility.sitelinkId}
                    >
                      {facility.facilityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* <FormDescription>
                You can manage email addresses in your{" "}
                <Link href="/examples/forms">email settings</Link>.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rentalGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rental Goal</FormLabel>
              <FormControl>
                <Input placeholder="Rental Goal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />{" "}
        <FormField
          control={form.control}
          name="retailGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retail Goal</FormLabel>
              <FormControl>
                <Input placeholder="Retail Goal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="collectionsGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collections Goal</FormLabel>
              <FormControl>
                <Input placeholder="Collection Goal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
