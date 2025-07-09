"use client";

import { Button } from "@/components/ui/button";
import {
  Column,
  ColumnDef,
  Row,
  SortingState,
  Table,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Rentals = {
  Id: string;
  employeeId: string;
  facilityId: string;
  date: string;
  tenantName: string;
  unitName: string;
  hasInsurance: boolean;
};

export type CommittedPayrollByEmployee = {
  lastName: string;
  firstName: string;
  locationAbbreviation: string;
  locationName: string;
  locationPaycorNumber: number;
  vacationHours: number;
  holidayHours: number;
  christmasBonus: number;
  monthlyBonus: number;
  commission: number;
  mileageDollars: number;
  rentals?: Rentals[];
  unpaidCommission?: Rentals[];
  fullName?: string;
};
function handleSortClick(
  table: Table<CommittedPayrollByEmployee>,
  column: Column<CommittedPayrollByEmployee, unknown>,
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
      column: Column<CommittedPayrollByEmployee, unknown>;
      table: Table<CommittedPayrollByEmployee>;
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
    cell: ({ row }: { row: Row<CommittedPayrollByEmployee> }) => {
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
export const columns: ColumnDef<CommittedPayrollByEmployee>[] = [
  {
    accessorKey: "lastName",
    id: "lastName",
    header: ({
      column,
      table,
    }: {
      column: Column<CommittedPayrollByEmployee, unknown>;
      table: Table<CommittedPayrollByEmployee>;
    }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "lastName")}
          className="font-medium"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm text-muted-foreground text-center">
              Last Name
            </span>
          </div>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "firstName",
    id: "firstName",
    header: ({
      column,
      table,
    }: {
      column: Column<CommittedPayrollByEmployee, unknown>;
      table: Table<CommittedPayrollByEmployee>;
    }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "firstName")}
          className="font-medium"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm text-muted-foreground text-center">
              First Name
            </span>
          </div>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "locationAbbreviation",
    id: "locationAbbreviation",
    header: ({
      column,
      table,
    }: {
      column: Column<CommittedPayrollByEmployee, unknown>;
      table: Table<CommittedPayrollByEmployee>;
    }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "locationAbbreviation")}
          className="font-medium"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm text-muted-foreground text-center">
              Location
            </span>
          </div>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
  },

  {
    accessorKey: "locationPaycorNumber",
    id: "locationPaycorNumber",
    header: ({
      column,
      table,
    }: {
      column: Column<CommittedPayrollByEmployee, unknown>;
      table: Table<CommittedPayrollByEmployee>;
    }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "locationPaycorNumber")}
          className="font-medium"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm text-muted-foreground text-center">
              Paycor #
            </span>
          </div>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "vacationHours",
    id: "vacationHours",
    header: "Vacation Hours",
  },
  {
    accessorKey: "holidayHours",
    id: "holidayHours",
    header: "Holiday Hours",
  },
  formattedColumndDefinition("christmasBonus", "Christmas Bonus"),
  formattedColumndDefinition("monthlyBonus", "Monthly Bonus"),
  formattedColumndDefinition("commission", "Commission"),
  formattedColumndDefinition("mileageDollars", "Mileage"),
];
