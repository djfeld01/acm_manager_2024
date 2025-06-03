import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Column } from "@tanstack/react-table";
import { format, subDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { DateRange } from "react-day-picker";

function FilterCalendar({ column }: { column: Column<any, unknown> }) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    to: new Date(),
    from: subDays(new Date(), 30),
  });

  return (
    <div className={cn("grid gap-2")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            selected={
              column.getFilterValue() as unknown as {
                from: Date | undefined;
                to: Date | undefined;
              }
            }
            onSelect={(value) => {
              column.setFilterValue(value);
              setDate(value);
            }}
            mode="range"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default FilterCalendar;
