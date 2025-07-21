"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Column,
  ColumnDef,
  Row,
  SortingState,
  Table,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { UnpaidCommissionModal } from "../components/UnpaidCommissionModal";
import { useState } from "react";

// Component for handling unpaid commission button and modal
function UnpaidCommissionButton({
  row,
}: {
  row: Row<CommittedPayrollByEmployee>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const data = row.original;

  if (!data.unpaidCommission || data.unpaidCommission.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-xs">No unpaid</div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="h-6 px-2 text-xs"
      >
        {data.unpaidCommissionCount} unpaid
      </Button>

      <UnpaidCommissionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        unpaidCommissions={data.unpaidCommission}
        employeeName={`${data.firstName} ${data.lastName}`}
        locationName={data.locationName}
        payrollId={data.currentPayrollId}
      />
    </>
  );
}

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
export type MonthlyBonusBreakdown = {
  employeeId: string;
  bonusType: string;
  facilityId: string;
  bonusAmount: number;
  bonusMonth: string;
  date: string;
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
  monthlyBonusBreakdown?: MonthlyBonusBreakdown[];
  commission: number;
  mileageDollars: number;
  rentals?: Rentals[];
  unpaidCommission?: Rentals[];
  unpaidCommissionCount: number;
  currentPayrollId: string;
  employeeId: string;
  facilityId: string;

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
function formattedColumndDefinition(
  columnName: string,
  label: string,
  showBreakdown?: boolean
) {
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
          className="font-medium p-1 h-auto"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground text-center">
              {label}
            </span>
            <span className="text-xs">Total: {formatted}</span>
          </div>
          <ArrowUpDown className="h-3 w-3 ml-1" />
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

      if (showBreakdown && columnName === "monthlyBonus") {
        const breakdownData = row.original.monthlyBonusBreakdown;
        console.log("Breakdown Data:", breakdownData);

        if (!breakdownData || breakdownData.length === 0) {
          return <div className="text-center font-medium">{formatted}</div>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                  {formatted}
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-0 max-w-xs">
                <div className="p-2">
                  <div className="font-semibold text-xs mb-1">
                    Monthly Bonus Breakdown
                  </div>
                  <UITable>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs p-1 h-6">Date</TableHead>
                        <TableHead className="text-xs p-1 h-6">Type</TableHead>
                        <TableHead className="text-xs p-1 h-6">Month</TableHead>
                        <TableHead className="text-xs p-1 h-6 text-right">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breakdownData.map((item, index) => (
                        <TableRow key={index} className="h-6">
                          <TableCell className="text-xs p-1">
                            {new Date(item.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs p-1">
                            {item.bonusType}
                          </TableCell>
                          <TableCell className="text-xs p-1">
                            {item.bonusMonth}
                          </TableCell>
                          <TableCell className="text-xs p-1 text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(item.bonusAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </UITable>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      if (showBreakdown && columnName === "commission") {
        const rentalsData = row.original.rentals;

        if (!rentalsData || rentalsData.length === 0) {
          return <div className="text-center font-medium">{formatted}</div>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded">
                  {formatted}
                </div>
              </TooltipTrigger>
              <TooltipContent className="p-0 max-w-xs">
                <div className="p-2">
                  <div className="font-semibold text-xs mb-1">
                    Commission Breakdown
                  </div>
                  <UITable>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs p-1 h-6">Date</TableHead>
                        <TableHead className="text-xs p-1 h-6">Unit</TableHead>
                        <TableHead className="text-xs p-1 h-6 text-center">
                          Ins
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentalsData.map((rental, index) => (
                        <TableRow key={index} className="h-6">
                          <TableCell className="text-xs p-1">
                            {new Date(rental.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs p-1">
                            {rental.unitName}
                          </TableCell>
                          <TableCell className="text-xs p-1 text-center">
                            {rental.hasInsurance ? "✓" : "✗"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </UITable>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

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
          className="font-medium p-1 h-auto"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground text-center">
              Last Name
            </span>
          </div>
          <ArrowUpDown className="h-3 w-3 ml-1" />
        </Button>
      );
    },
    filterFn: (row, id, value) => {
      const firstName = row.original.firstName.toLowerCase();
      const lastName = row.original.lastName.toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const searchValue = value.toLowerCase();
      return (
        fullName.includes(searchValue) ||
        firstName.includes(searchValue) ||
        lastName.includes(searchValue)
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
          className="font-medium p-1 h-auto"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground text-center">
              First Name
            </span>
          </div>
          <ArrowUpDown className="h-3 w-3 ml-1" />
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
          className="font-medium p-1 h-auto"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground text-center">
              Location
            </span>
          </div>
          <ArrowUpDown className="h-3 w-3 ml-1" />
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
          className="font-medium p-1 h-auto"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground text-center">
              Paycor #
            </span>
          </div>
          <ArrowUpDown className="h-3 w-3 ml-1" />
        </Button>
      );
    },
  },

  // Add a hidden column for locationName to enable location filtering
  {
    accessorKey: "locationName",
    id: "locationName",
    header: () => null,
    cell: () => null,
    filterFn: (row, id, value) => {
      return row.original.locationName
        .toLowerCase()
        .includes(value.toLowerCase());
    },
  },
  {
    accessorKey: "vacationHours",
    id: "vacationHours",
    header: () => (
      <span className="text-xs text-muted-foreground">Vacation Hours</span>
    ),
  },
  {
    accessorKey: "holidayHours",
    id: "holidayHours",
    header: () => (
      <span className="text-xs text-muted-foreground">Holiday Hours</span>
    ),
  },
  formattedColumndDefinition("christmasBonus", "Christmas Bonus"),
  formattedColumndDefinition("monthlyBonus", "Monthly Bonus", true),
  formattedColumndDefinition("commission", "Commission", true),
  {
    accessorKey: "unpaidCommissionCount",
    id: "unpaidCommissions",
    header: () => (
      <span className="text-xs text-muted-foreground">Unpaid Commissions</span>
    ),
    cell: ({ row }: { row: Row<CommittedPayrollByEmployee> }) => (
      <UnpaidCommissionButton row={row} />
    ),
  },
  formattedColumndDefinition("mileageDollars", "Mileage"),
];
