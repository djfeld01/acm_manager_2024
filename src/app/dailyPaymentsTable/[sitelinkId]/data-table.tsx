"use client";
import * as React from "react";
import {
  SortingState,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  getExpandedRowModel,
  Row,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { subDays } from "date-fns";
import dateBetweenFilterFn from "@/lib/dateBetweenFilter";
import FilterCalendar from "./FilterCalendar";
import { commitTransactions } from "@/app/actions";

interface DataTableRow {
  dailyPaymentId: any;
  bankTransactions: any[];
  cashBankTransactions?: any[];
  creditCardTransactions?: any[];
  // add other properties as needed
}

interface DataTableProps<TData extends DataTableRow, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactElement;
}

export function DataTable<TData extends DataTableRow, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // const [rowSelection, setRowSelection] = React.useState({});
  // const [multiSelect, setMultiSelect] = React.useState();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "sitelinkDate", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "sitelinkDate",
      value: { from: subDays(new Date(), 30), to: new Date() },
    },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 100,
  });
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      cash: false,
      check: false,
      visa: false,
      mastercard: false,
      discover: false,
      ach: false,
      dinersClub: false,
      americanExpress: false,
      debit: false,
    });

  const table = useReactTable({
    data,
    columns,
    getRowCanExpand: (row) =>
      row.getValue("hasCashBankTransaction") ||
      row.getValue("hasCreditCardBankTransaction"),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getExpandedRowModel: getExpandedRowModel(),
    // onRowSelectionChange: async (value) => {
    //   await setRowSelection(value);
    //   const rows: Row<TData>[] = table.getFilteredSelectedRowModel()
    //     .rows as Row<TData>[];

    // },
    filterFns: {
      dateBetweenFilterFn: dateBetweenFilterFn,
    },
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      // rowSelection,
    },
  });

  async function handleTransactionCommit() {
    const selectedRows: Row<TData>[] = table.getSelectedRowModel().rows;
    const transactionsToCommit = selectedRows.reduce<
      Array<{
        dailyPaymentId: any;
        bankTransactionId: any;
        connectionType: any;
        amount: any;
        depositDifference: number;
      }>
    >((acc, row) => {
      const dailyPaymentId = row.original.dailyPaymentId;

      const transactionsToSubmit = row.original.bankTransactions.map(
        (transaction: any) => ({
          dailyPaymentId,
          bankTransactionId: transaction.bankTransactionId,
          connectionType: transaction.transactionType,
          amount: transaction.transactionAmount,
          depositDifference: 0,
        })
      );

      return [...acc, ...transactionsToSubmit];
    }, []);
    const result = await commitTransactions(transactionsToCommit);
    console.log("Transactions committed:", result);
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      {table.getColumn("sitelinkDate") && (
        <FilterCalendar column={table.getColumn("sitelinkDate")!} />
      )}

      <Button
        variant="secondary"
        className="ml-auto"
        disabled={table.getSelectedRowModel().rows.length === 0}
        onClick={() => handleTransactionCommit()}
      >
        Commit Transactions
      </Button>
      <div className="rounded-md border">
        <table className="w-full border">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-2 text-left">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr className="border-b">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && (
                  <tr key={`${row.id}-expanded`} className="border-b">
                    <td colSpan={row.getAllCells().length}>
                      <div className="grid grid-cols-2 gap-4">
                        <h3 className="text-lg font-bold">
                          Cash Bank Transactions
                        </h3>
                        <h3 className="text-lg font-bold">
                          Credit Card Bank Transactions
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <table className="w-full border">
                          <thead>
                            <tr>
                              <th className="p-2 text-left">Date</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.original.cashBankTransactions &&
                              row.original.cashBankTransactions.map(
                                (transaction) => (
                                  <tr key={`${transaction.transactionId}-cash`}>
                                    <td>
                                      {new Date(
                                        transaction.transactionDate
                                      ).toLocaleDateString()}
                                    </td>
                                    <td>{transaction.transactionType}</td>
                                    <td>
                                      {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                      }).format(transaction.transactionAmount)}
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>

                        <table className="w-full border">
                          <thead>
                            <tr>
                              <th className="p-2 text-left">Date</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.original.creditCardTransactions &&
                              row.original.creditCardTransactions.map(
                                (transaction) => (
                                  <tr
                                    key={`${transaction.transactionId}-credit`}
                                  >
                                    <td>
                                      {new Date(
                                        transaction.transactionDate
                                      ).toLocaleDateString()}
                                    </td>
                                    <td>{transaction.transactionType}</td>
                                    <td>
                                      {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                      }).format(transaction.transactionAmount)}
                                    </td>
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
                {/* {row.getIsExpanded() &&
                  row.original.bankTransactions.map((transaction) => (
                    <tr>
                      <td>{transaction.transactionDate}</td>
                      <td>{transaction.transactionType}</td>
                      <td>{transaction.transactionAmount}</td>
                    </tr>
                  ))} */}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
