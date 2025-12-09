"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, Banknote, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/reconciliation/clientUtils";

interface DailyPayment {
  dailyPaymentId: number;
  date: string;
  cashCheckTotal: number;
  creditCardTotal: number;
  totalAmount: number;
  isMatched: boolean;
}

interface DailyPaymentListProps {
  payments: DailyPayment[];
  selectedPayment: DailyPayment | null;
  onPaymentSelect: (payment: DailyPayment) => void;
  title: string;
}

export function DailyPaymentList({
  payments,
  selectedPayment,
  onPaymentSelect,
  title,
}: DailyPaymentListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {payments.length} daily payments
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No daily payments to display</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div
                key={payment.dailyPaymentId}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPayment?.dailyPaymentId === payment.dailyPaymentId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => onPaymentSelect(payment)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(payment.date)}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(payment.totalAmount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-3 w-3 text-green-600" />
                    <span className="text-muted-foreground">Cash/Check:</span>
                    <span className="font-medium">
                      {formatCurrency(payment.cashCheckTotal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3 text-blue-600" />
                    <span className="text-muted-foreground">Credit:</span>
                    <span className="font-medium">
                      {formatCurrency(payment.creditCardTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted-foreground text-right">
                  ID: {payment.dailyPaymentId}
                </div>
              </div>
            ))
          )}
        </div>

        {payments.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total Cash/Check:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(
                  payments.reduce((sum, p) => sum + p.cashCheckTotal, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Total Credit Card:</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(
                  payments.reduce((sum, p) => sum + p.creditCardTotal, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>Grand Total:</span>
              <span>
                {formatCurrency(
                  payments.reduce((sum, p) => sum + p.totalAmount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
