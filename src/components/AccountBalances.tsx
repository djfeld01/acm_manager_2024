"use client";

import { useAuth } from "@/contexts/AuthContext";

interface AccountBalancesProps {
  accountBalances: any[];
}

export function AccountBalances({ accountBalances }: AccountBalancesProps) {
  const { canManageFinances } = useAuth();

  if (!canManageFinances || !accountBalances || accountBalances.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2 w-full">
      {accountBalances.map((bal: any, i: number) => (
        <span
          key={i}
          className="bg-gray-100 rounded px-2 py-0.5 text-xs font-semibold text-gray-700"
          title={
            bal.latestBalanceDate
              ? `Updated: ${new Date(
                  bal.latestBalanceDate
                ).toLocaleDateString()}`
              : undefined
          }
        >
          {bal.bankName ? `${bal.bankName}: ` : ""}$
          {Math.round(Number(bal.latestBalance)).toLocaleString()}
        </span>
      ))}
    </div>
  );
}
