"use client";
import React, { useState } from "react";
import { Logins, PayPeriod } from "./EmployeeComissionComponent";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { payPeriod } from "@/db/schema";

type EmployeeDaysWorkedComponentProps = {
  logins: Logins[];
  nextPayPeriod: PayPeriod;
};
function generateDateRange(startDate: string, endDate: string) {
  const startDateObj = new Date(`${startDate}T00:00:00-05:00`); // Eastern Time
  const endDateObj = new Date(`${endDate}T00:00:00-05:00`); // Eastern Time
  const dateArray = [];

  for (
    let date = new Date(startDateObj);
    date <= endDateObj;
    date.setDate(date.getDate() + 1)
  ) {
    dateArray.push(
      new Date(date).toLocaleDateString("en-US", {
        month: "2-digit",
        timeZone: "America/New_York",
        day: "2-digit",
      })
    );
  }

  return dateArray;
}
function EmployeeDaysWorkedComponent({
  logins,
  nextPayPeriod,
}: EmployeeDaysWorkedComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  console.log(logins);
  const daysWorked = logins.map((entry) =>
    new Date(entry.dateTime).toLocaleDateString(undefined, {
      month: "2-digit",
      day: "2-digit",
    })
  );

  const { startDate, endDate } = nextPayPeriod;

  const payPeriodDateArray = generateDateRange(
    startDate,
    endDate || "2000-01-01"
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger>Show Days Worked</CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-7  outline-double">
          <div className="col-span-1">Sun</div>
          <div className="col-span-1">Mon</div>
          <div className="col-span-1">Tue</div>
          <div className="col-span-1">Wed</div>
          <div className="col-span-1">Thu</div>
          <div className="col-span-1">Fri</div>
          <div className="col-span-1">Sat</div>
          {payPeriodDateArray.map((date) => (
            <div
              key={date}
              className={
                daysWorked.includes(date) ? "bg-red-400" : "bg-slate-100"
              }
            >
              {date}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default EmployeeDaysWorkedComponent;
