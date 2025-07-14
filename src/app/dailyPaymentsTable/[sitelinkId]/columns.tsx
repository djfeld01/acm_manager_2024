"use client";

import {
  Column,
  ColumnDef,
  Row,
  SortingState,
  Table,
} from "@tanstack/react-table";
import {
  ChevronsUpDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  Minus,
} from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import dateBetweenFilterFn from "@/lib/dateBetweenFilter";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export type BankTransaction = {
  bankAccountName: string;
  bankTransactionId: number;
  transactionDate: Date;
  transactionAmount: number;
  transactionType: string;
};
export type Payment = {
  dailyPaymentId: number;
  sitelinkDate: Date;
  facilityId: string;
  cash: number | null;
  check: number | null;
  cashCheckDeposit: number | null;
  visa: number | null;
  mastercard: number | null;
  discover: number | null;
  americanExpress: number | null;
  ach: number | null;
  dinersClub: number | null;
  debit: number | null;
  creditCardDeposit: number | null;
  dailyTotal: number | null;
  hasCashBankTransaction: boolean;
  hasCreditCardBankTransaction: boolean;
  cashBankTransactions: BankTransaction[];
  creditCardTransactions: BankTransaction[];
  bankTransactions: BankTransaction[];
};

// const DateRangeFilter = ({ column }: { column: any }) => {
//   const { filterValue, setFilter } = column;
//   const [date, setDate] = React.useState<DateRange | undefined>({
//     from: subDays(new Date(), 30),
//     to: new Date(),
//   });

//   return (
//     <div className="flex items-center py-4">
//       <Popover>
//         <PopoverTrigger asChild>
//           <Button
//             id="date"
//             variant={"outline"}
//             className={cn(
//               "w-[300px] justify-start text-left font-normal",
//               !date && "text-muted-foreground"
//             )}
//           >
//             <CalendarIcon />
//             {date?.from ? (
//               date.to ? (
//                 <>
//                   {format(date.from, "LLL dd, y")} -{" "}
//                   {format(date.to, "LLL dd, y")}
//                 </>
//               ) : (
//                 format(date.from, "LLL dd, y")
//               )
//             ) : (
//               <span>Pick a date</span>
//             )}
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-auto p-0" align="start">
//           <Calendar
//             initialFocus
//             mode="range"
//             defaultMonth={date?.from}
//             selected={date}
//             onSelect={setDate}
//             numberOfMonths={2}
//           />
//         </PopoverContent>
//       </Popover>
//     </div>
//   );
// };

function handleSortClick(
  table: Table<Payment>,
  column: Column<Payment, unknown>,
  secondaryColumnName: string
) {
  const currentSort = table
    .getState()
    .sorting.find((sort) => sort.id === column.id);
  const nextSort = currentSort?.desc === false ? true : false;

  let newSorting: any[] | ((old: SortingState) => SortingState) = [];

  if (currentSort) {
    if (table.getState().sorting.length > 1) {
      newSorting = table
        .getState()
        .sorting.filter((sort) => sort.id !== column.id);
    } else {
      newSorting = [];
    }
  } else {
    newSorting = table.getState().sorting;
  }

  if (nextSort !== undefined) {
    newSorting = [{ id: column.id, desc: nextSort }, ...newSorting];
  }
  // Add the secondary sort if it doesn't already exist
  if (!newSorting.find((sort) => sort.id === secondaryColumnName)) {
    newSorting.push({ id: secondaryColumnName, desc: false }); // Default secondary sort direction
  }
  table.setSorting(newSorting);
}
function formattedColumndDefinition(columnName: string, label: string) {
  return {
    accessorKey: columnName,
    id: columnName,
    header: ({
      column,
      table,
    }: {
      column: Column<Payment, unknown>;
      table: Table<Payment>;
    }) => {
      const total =
        table.getSelectedRowModel().rows.length > 0
          ? table.getSelectedRowModel().rows.reduce((acc, row) => {
              const value = parseFloat(row.getValue(columnName));
              return acc + (isNaN(value) ? 0 : value);
            }, 0)
          : table.getRowModel().rows.reduce((acc, row) => {
              const value = parseFloat(row.getValue(columnName));
              return acc + (isNaN(value) ? 0 : value);
            }, 0);
      const formatted =
        total === 0
          ? "---"
          : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(total);
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, columnName)}
          className="font-medium"
        >
          <div className="flex flex-col items-start leading-tight ">
            <span className="text-sm text-muted-foreground text-center">
              {label}
            </span>
            <span className="text-xs">Total: {formatted}</span>
          </div>
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: { row: Row<Payment> }) => {
      const columnValue = parseFloat(row.getValue(columnName));
      const formatted =
        columnValue === 0
          ? "---"
          : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(columnValue);

      return <div className="text-center font-medium">{formatted}</div>;
    },
  };
}
export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row, table }) =>
      row.getCanExpand() && (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <button
          {...{
            onClick: row.getToggleExpandedHandler(),
            style: { cursor: "pointer" },
          }}
        >
          {row.getIsExpanded() ? <ChevronUp /> : <ChevronsUpDown />}
        </button>
      ) : (
        ""
      );
    },
  },
  {
    accessorKey: "sitelinkDate",
    id: "sitelinkDate",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "sitelinkDate")}
          className=" font-medium"
        >
          Date <ArrowUpDown className=" h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const sitelinkDate = new Date(
        row.getValue("sitelinkDate")
      ).toLocaleDateString();

      return <div className=" font-medium">{sitelinkDate}</div>;
    },
    enableHiding: false,
    filterFn: dateBetweenFilterFn,
  },
  //
  formattedColumndDefinition("cash", "Cash"),
  formattedColumndDefinition("check", "Check"),
  {
    accessorKey: "hasCashBankTransaction",
    id: "hasCashBankTransaction",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() =>
            handleSortClick(table, column, "hasCashBankTransaction")
          }
          className=" font-medium"
        >
          <ArrowUpDown className="h-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const hasCashBankTransaction = row.getValue(
        "hasCashBankTransaction"
      ) as boolean;

      return (
        <div>
          {row.getValue("cashCheckDeposit") === 0 ? (
            <Minus className="stroke-blue-600 font-extrabold" />
          ) : hasCashBankTransaction ? (
            <CircleCheck className=" stroke-green-600 font-extrabold" />
          ) : (
            <CircleX className="stroke-red-600 font-extrabold" />
          )}
        </div>
      );
    },
  },
  formattedColumndDefinition("cashCheckDeposit", "Cash/Check"),
  formattedColumndDefinition("visa", "Visa"),
  formattedColumndDefinition("mastercard", "Mastercard"),
  formattedColumndDefinition("discover", "Discover"),
  formattedColumndDefinition("americanExpress", "AmEx"),
  formattedColumndDefinition("dinersClub", "Diners Club"),
  formattedColumndDefinition("debit", "Debit Card"),
  formattedColumndDefinition("ach", "ACH"),
  {
    accessorKey: "hasCreditCardBankTransaction",
    id: "hasCreditCardBankTransaction",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() =>
            handleSortClick(table, column, "hasCreditCardBankTransaction")
          }
          className=" font-medium"
        >
          <ArrowUpDown className=" h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const hasCreditCardBankTransaction = row.getValue(
        "hasCreditCardBankTransaction"
      ) as boolean;

      return (
        <div>
          {row.getValue("creditCardDeposit") === 0 ? (
            <Minus className="stroke-blue-600 font-extrabold" />
          ) : hasCreditCardBankTransaction ? (
            <CircleCheck className=" stroke-green-600 font-extrabold" />
          ) : (
            <CircleX className="stroke-red-600 font-extrabold" />
          )}
        </div>
      );
    },
  },
  formattedColumndDefinition("creditCardDeposit", "Credit Card"),
  formattedColumndDefinition("dailyTotal", "Daily Total"),
];
