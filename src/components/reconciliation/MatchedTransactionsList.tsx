"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, Unlink, Calendar, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/reconciliation/clientUtils";

interface MatchedTransaction {
  bankTransactionId: number;
  dailyPaymentId: number;
  amount: number;
  connectionType: "cash" | "creditCard";
  matchType: "automatic" | "manual" | "partial";
  matchConfidence: number;
  depositDifference: number;
  matchedBy: string;
  matchedAt: string;
  notes?: string;
}

interface MatchedTransactionsListProps {
  matches: MatchedTransaction[];
  onUnmatch: (bankTransactionId: number, dailyPaymentId: number) => void;
}

export function MatchedTransactionsList({
  matches,
  onUnmatch,
}: MatchedTransactionsListProps) {
  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case "automatic":
        return "bg-green-100 text-green-800";
      case "manual":
        return "bg-blue-100 text-blue-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "creditCard":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Matched Transactions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {matches.length} matched transactions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No matched transactions yet</p>
            </div>
          ) : (
            matches.map((match) => (
              <div
                key={`${match.bankTransactionId}-${match.dailyPaymentId}`}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getMatchTypeColor(match.matchType)}>
                      {match.matchType}
                    </Badge>
                    <Badge
                      className={getConnectionTypeColor(match.connectionType)}
                    >
                      {match.connectionType === "cash"
                        ? "Cash/Check"
                        : "Credit Card"}
                    </Badge>
                    {match.matchConfidence && (
                      <Badge variant="outline">
                        {Math.round(match.matchConfidence * 100)}% confidence
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onUnmatch(match.bankTransactionId, match.dailyPaymentId)
                    }
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Unmatch
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-1">Bank Transaction</div>
                    <div className="text-muted-foreground">
                      ID: {match.bankTransactionId}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Daily Payment</div>
                    <div className="text-muted-foreground">
                      ID: {match.dailyPaymentId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Amount: </span>
                      <span className="font-medium">
                        {formatCurrency(match.amount)}
                      </span>
                    </div>
                    {match.depositDifference !== 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          Difference:{" "}
                        </span>
                        <span
                          className={`font-medium ${
                            match.depositDifference > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {formatCurrency(match.depositDifference)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Matched {formatDate(match.matchedAt)} by {match.matchedBy}
                  </div>
                </div>

                {match.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">Notes: </span>
                    {match.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {matches.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Total Matched Amount:</span>
                <span className="font-semibold">
                  {formatCurrency(
                    matches.reduce((sum, m) => sum + m.amount, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Differences:</span>
                <span
                  className={`font-semibold ${
                    matches.reduce((sum, m) => sum + m.depositDifference, 0) ===
                    0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(
                    matches.reduce((sum, m) => sum + m.depositDifference, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
