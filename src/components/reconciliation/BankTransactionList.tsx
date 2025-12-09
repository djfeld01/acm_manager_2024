"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, CreditCard, Banknote } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/reconciliation/clientUtils";

interface BankTransaction {
  bankTransactionId: number;
  transactionDate: string;
  transactionAmount: number;
  transactionType: string;
  isMatched: boolean;
}

interface BankTransactionListProps {
  transactions: BankTransaction[];
  selectedTransaction: BankTransaction | null;
  onTransactionSelect: (transaction: BankTransaction) => void;
  title: string;
}

export function BankTransactionList({
  transactions,
  selectedTransaction,
  onTransactionSelect,
  title,
}: BankTransactionListProps) {
  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "creditcard":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "creditcard":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {transactions.length} transactions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions to display</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.bankTransactionId}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTransaction?.bankTransactionId ===
                  transaction.bankTransactionId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => onTransactionSelect(transaction)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.transactionType)}
                      <Badge
                        className={getTransactionTypeColor(
                          transaction.transactionType
                        )}
                      >
                        {transaction.transactionType}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(transaction.transactionAmount)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(transaction.transactionDate)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {transaction.bankTransactionId}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {transactions.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total Amount:</span>
              <span className="font-semibold">
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + t.transactionAmount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
