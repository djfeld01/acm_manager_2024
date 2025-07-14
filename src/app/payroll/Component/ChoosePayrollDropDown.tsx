"use client";

import * as React from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PayPeriod } from "@/db/schema/payPeriod";

function parseAsLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("T")[0].split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

type ChoosePayrollDropDownProps = {
  payPeriods: PayPeriod[];
  selectedId?: string;
};

export function ChoosePayrollDropDown({
  payPeriods,
  selectedId,
}: ChoosePayrollDropDownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPayPeriodId, setSelectedPayPeriodId] = React.useState(
    selectedId ?? payPeriods[0]?.payPeriodId
  );

  const selectedPeriod = payPeriods.find(
    (p) => p.payPeriodId === selectedPayPeriodId
  );

  const selectedLabel = selectedPeriod
    ? `${format(
        parseAsLocalDate(selectedPeriod.startDate),
        "MM/dd/yyyy"
      )} - ${format(
        parseAsLocalDate(selectedPeriod.endDate ?? ""),
        "MM/dd/yyyy"
      )}`
    : "Select a Pay Period";

  const handleChange = (newId: string) => {
    setSelectedPayPeriodId(newId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("payPeriod", newId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{selectedLabel}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Pay Period</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedPayPeriodId}
          onValueChange={handleChange}
        >
          {payPeriods.map((period) => (
            <DropdownMenuRadioItem
              key={period.payPeriodId}
              value={period.payPeriodId}
            >
              {format(parseAsLocalDate(period.startDate), "MM/dd/yyyy")} -{" "}
              {format(parseAsLocalDate(period.endDate ?? ""), "MM/dd/yyyy")}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
