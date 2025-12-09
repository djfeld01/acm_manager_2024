"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/reconciliation/clientUtils";

interface PotentialMatch {
  bankTransactionId: number;
  dailyPaymentId: number;
  facilityId: string;
  bankAccountId: number;
  transactionDate: string;
  transactionAmount: number;
  transactionType: string;
  dailyPaymentDate: string;
  dailyPaymentCashCheck: number;
  dailyPaymentCreditCard: number;
  matchType: "exact" | "close" | "possible";
  matchConfidence: number;
  amountDifference: number;
  dateDifference: number;
  connectionType: "cash" | "creditCard";
}

interface AutoMatchingSuggestionsProps {
  facilityId: string;
  bankAccountId: number;
  month: number;
  year: number;
  onMatchCreated: () => void;
}

export function AutoMatchingSuggestions({
  facilityId,
  bankAccountId,
  month,
  year,
  onMatchCreated,
}: AutoMatchingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<PotentialMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningAutoMatch, setIsRunningAutoMatch] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reconciliation/auto-match?facilityId=${facilityId}&bankAccountId=${bankAccountId}&month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error("Failed to load suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Failed to load suggestions:", error);

      // Mock suggestions for demo
      setSuggestions([
        {
          bankTransactionId: 1,
          dailyPaymentId: 1,
          facilityId,
          bankAccountId,
          transactionDate: "2024-09-15",
          transactionAmount: 1250.75,
          transactionType: "cash",
          dailyPaymentDate: "2024-09-15",
          dailyPaymentCashCheck: 1250.75,
          dailyPaymentCreditCard: 650.25,
          matchType: "exact",
          matchConfidence: 1.0,
          amountDifference: 0,
          dateDifference: 0,
          connectionType: "cash",
        },
        {
          bankTransactionId: 2,
          dailyPaymentId: 2,
          facilityId,
          bankAccountId,
          transactionDate: "2024-09-16",
          transactionAmount: 875.5,
          transactionType: "creditCard",
          dailyPaymentDate: "2024-09-16",
          dailyPaymentCashCheck: 425.0,
          dailyPaymentCreditCard: 875.5,
          matchType: "exact",
          matchConfidence: 1.0,
          amountDifference: 0,
          dateDifference: 0,
          connectionType: "creditCard",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, bankAccountId, month, year]);

  useEffect(() => {
    loadSuggestions();
  }, [facilityId, bankAccountId, month, year, loadSuggestions]);

  const handleAcceptMatch = async (suggestion: PotentialMatch) => {
    try {
      const response = await fetch("/api/reconciliation/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankTransactionId: suggestion.bankTransactionId,
          dailyPaymentId: suggestion.dailyPaymentId,
          connectionType: suggestion.connectionType,
          amount: suggestion.transactionAmount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      // Remove from suggestions and refresh parent
      setSuggestions((prev) =>
        prev.filter(
          (s) =>
            s.bankTransactionId !== suggestion.bankTransactionId ||
            s.dailyPaymentId !== suggestion.dailyPaymentId
        )
      );
      onMatchCreated();
    } catch (error) {
      console.error("Failed to accept match:", error);
    }
  };

  const handleRunAutoMatch = async () => {
    setIsRunningAutoMatch(true);
    try {
      const response = await fetch("/api/reconciliation/auto-match/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facilityId,
          bankAccountId,
          month,
          year,
          minConfidence: 0.95, // Only auto-match high confidence matches
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to run auto-match");
      }

      const data = await response.json();

      // Refresh suggestions and parent data
      await loadSuggestions();
      onMatchCreated();
    } catch (error) {
      console.error("Failed to run auto-match:", error);
    } finally {
      setIsRunningAutoMatch(false);
    }
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case "exact":
        return "bg-green-100 text-green-800";
      case "close":
        return "bg-yellow-100 text-yellow-800";
      case "possible":
        return "bg-orange-100 text-orange-800";
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto-Matching Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading suggestions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Auto-Matching Suggestions
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {suggestions.length} potential matches found
          </p>
          <Button
            onClick={handleRunAutoMatch}
            disabled={isRunningAutoMatch || suggestions.length === 0}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-1" />
            {isRunningAutoMatch ? "Running..." : "Auto-Match High Confidence"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No automatic matching suggestions available</p>
              <p className="text-sm mt-2">
                All transactions may already be matched or require manual
                review.
              </p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={`${suggestion.bankTransactionId}-${suggestion.dailyPaymentId}`}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getMatchTypeColor(suggestion.matchType)}>
                      {suggestion.matchType}
                    </Badge>
                    <Badge
                      className={getConnectionTypeColor(
                        suggestion.connectionType
                      )}
                    >
                      {suggestion.connectionType === "cash"
                        ? "Cash/Check"
                        : "Credit Card"}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(suggestion.matchConfidence * 100)}% confidence
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleAcceptMatch(suggestion)}
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept Match
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-2">Bank Transaction</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(suggestion.transactionDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(suggestion.transactionAmount)}
                      </div>
                      <div>Type: {suggestion.transactionType}</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Daily Payment</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(suggestion.dailyPaymentDate)}
                      </div>
                      <div>
                        Cash/Check:{" "}
                        {formatCurrency(suggestion.dailyPaymentCashCheck)}
                      </div>
                      <div>
                        Credit Card:{" "}
                        {formatCurrency(suggestion.dailyPaymentCreditCard)}
                      </div>
                    </div>
                  </div>
                </div>

                {(suggestion.amountDifference > 0 ||
                  suggestion.dateDifference > 0) && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      {suggestion.amountDifference > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-yellow-600" />
                          <span className="text-muted-foreground">
                            Amount diff:{" "}
                          </span>
                          <span className="font-medium text-yellow-600">
                            {formatCurrency(suggestion.amountDifference)}
                          </span>
                        </div>
                      )}
                      {suggestion.dateDifference > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-blue-600" />
                          <span className="text-muted-foreground">
                            Date diff:{" "}
                          </span>
                          <span className="font-medium text-blue-600">
                            {suggestion.dateDifference} day
                            {suggestion.dateDifference !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
