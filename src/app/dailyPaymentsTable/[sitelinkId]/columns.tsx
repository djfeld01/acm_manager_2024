"use client";

import { Column, ColumnDef, SortingState, Table } from "@tanstack/react-table";
import {
  CircleCheck,
  CircleCheckBig,
  CircleX,
  MoreHorizontal,
} from "lucide-react";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BankTransaction = {
  bankAccountName: string;
  bankTransactionId: number;
  transactionDate: Date;
  transactionAmount: number;
  transactionType: string;
};
export type Payment = {
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

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "sitelinkDate",
    id: "sitelinkDate",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "sitelinkDate")}
          className="ml-2 font-medium"
        >
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const sitelinkDate = new Date(
        row.getValue("sitelinkDate")
      ).toLocaleDateString();

      return <div className="ml-2 font-medium">{sitelinkDate}</div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "cash",
    id: "cash",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "cash")}
          className="ml-2 font-medium"
        >
          Cash <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const cash = parseFloat(row.getValue("cash"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cash);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "check",
    id: "check",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "check")}
          className="ml-2 font-medium"
        >
          Check <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const check = parseFloat(row.getValue("check"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(check);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
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
          <ArrowUpDown className=" h-4 " />
        </Button>
      );
    },
    cell: ({ row }) => {
      const hasCashBankTransaction = row.getValue(
        "hasCashBankTransaction"
      ) as boolean;

      return (
        <div>
          {hasCashBankTransaction ? (
            <CircleCheck className=" stroke-green-600 font-extrabold" />
          ) : (
            <CircleX className="stroke-red-600 font-extrabold" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "cashCheckDeposit",
    id: "cashCheckDeposit",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "cashCheckDeposit")}
          className="ml-2 font-medium"
        >
          Cash/Check Total <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const cashCheckDeposit = parseFloat(row.getValue("cashCheckDeposit"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cashCheckDeposit);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "visa",
    id: "visa",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "visa")}
          className="ml-2 font-medium"
        >
          Visa <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const visa = parseFloat(row.getValue("visa"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(visa);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "mastercard",
    id: "mastercard",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "mastercard")}
          className="ml-2 font-medium"
        >
          Mastercard <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const mastercard = parseFloat(row.getValue("mastercard"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(mastercard);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "americanExpress",
    id: "americanExpress",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "americanExpress")}
          className="ml-2 font-medium"
        >
          Am Ex <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const americanExpress = parseFloat(row.getValue("americanExpress"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(americanExpress);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "discover",
    id: "discover",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "discover")}
          className="ml-2 font-medium"
        >
          Discover <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const discover = parseFloat(row.getValue("discover"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(discover);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "ach",
    id: "ach",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "ach")}
          className="ml-2 font-medium"
        >
          ACH <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const ach = parseFloat(row.getValue("ach"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(ach);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "dinersClub",
    id: "dinersClub",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "dinersClub")}
          className="ml-2 font-medium"
        >
          Diners Club <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dinersClub = parseFloat(row.getValue("dinersClub"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(dinersClub);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "debit",
    id: "debit",
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "debit")}
          className="ml-2 font-medium"
        >
          Debit Card <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const debit = parseFloat(row.getValue("debit"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(debit);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
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
          className="ml-2 font-medium"
        >
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const hasCreditCardBankTransaction = row.getValue(
        "hasCreditCardBankTransaction"
      ) as boolean;

      return (
        <div className="ml-2 font-medium">
          {hasCreditCardBankTransaction ? (
            <CircleCheck className="ml-2 stroke-green-600" />
          ) : (
            <CircleX className="stroke-red-600  ml-2" />
          )}
        </div>
      );
    },
  },

  {
    id: "creditCardDeposit",
    accessorKey: "creditCardDeposit",
    enableSorting: true,
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "creditCardDeposit")}
          className="ml-2 font-medium"
        >
          Credit Card Total <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const creditCardDeposit = parseFloat(row.getValue("creditCardDeposit"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(creditCardDeposit);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },

  {
    id: "dailyTotal",
    accessorKey: "dailyTotal",
    enableSorting: true,
    header: ({ column, table }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => handleSortClick(table, column, "dailyTotal")}
          className="ml-2 font-medium"
        >
          Daily Total <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dailyTotal = parseFloat(row.getValue("dailyTotal"));

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(dailyTotal);

      return <div className="ml-2 font-medium">{formatted}</div>;
    },
  },
];
