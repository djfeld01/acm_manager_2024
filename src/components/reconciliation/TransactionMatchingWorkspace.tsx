"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Eye,
  Link,
  Unlink,
  FileText,
} from "lucide-react";
import { BankTransactionList } from "./BankTransactionList";
import { DailyPaymentList } from "./DailyPaymentList";
import { MatchedTransactionsList } from "./MatchedTransactionsList";
import { AutoMatchingSuggestions } from "./AutoMatchingSuggestions";
import { DiscrepancyManager } from "./DiscrepancyManager";
import { formatCurrency } from "@/lib/reconciliation/clientUtils";

// Types for workspace data
interface WorkspaceStats {
  totalBankTransactions: number;
  totalDailyPayments: number;
  matchedTransactions: number;
  unmatchedBankTransactions: number;
  unmatchedDailyPayments: number;
  totalDiscrepancies: number;
  matchingAccuracy: number;
  totalBankAmount: number;
  totalDailyAmount: number;
}

interface BankTransaction {
  bankTransactionId: number;
  transactionDate: string;
  transactionAmount: number;
  transactionType: string;
  isMatched: boolean;
}

interface DailyPayment {
  dailyPaymentId: number;
  date: string;
  cashCheckTotal: number;
  creditCardTotal: number;
  totalAmount: number;
  isMatched: boolean;
}

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

interface TransactionMatchingWorkspaceProps {
  facilityId: string;
  facilityName: string;
  bankAccountId: number;
  month: number;
  year: number;
  userId: string;
  userRole: string;
}

export function TransactionMatchingWorkspace({
  facilityId,
  facilityName,
  bankAccountId,
  month,
  year,
  userId,
  userRole,
}: TransactionMatchingWorkspaceProps) {
  const [stats, setStats] = useState<WorkspaceStats>({
    totalBankTransactions: 0,
    totalDailyPayments: 0,
    matchedTransactions: 0,
    unmatchedBankTransactions: 0,
    unmatchedDailyPayments: 0,
    totalDiscrepancies: 0,
    matchingAccuracy: 0,
    totalBankAmount: 0,
    totalDailyAmount: 0,
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(
    []
  );
  const [dailyPayments, setDailyPayments] = useState<DailyPayment[]>([]);
  const [matchedTransactions, setMatchedTransactions] = useState<
    MatchedTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBankTransaction, setSelectedBankTransaction] =
    useState<BankTransaction | null>(null);
  const [selectedDailyPayment, setSelectedDailyPayment] =
    useState<DailyPayment | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("unmatched");
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Load workspace data
  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/reconciliation/workspace?facilityId=${facilityId}&bankAccountId=${bankAccountId}&month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error("Failed to load workspace data");
      }

      const data = await response.json();

      setStats(data.stats || {});
      setBankTransactions(data.bankTransactions || []);
      setDailyPayments(data.dailyPayments || []);
      setMatchedTransactions(data.matchedTransactions || []);
      setIsUsingMockData(false);
    } catch (error) {
      console.error("Failed to load workspace data:", error);

      // Fallback to mock data
      const mockStats: WorkspaceStats = {
        totalBankTransactions: 25,
        totalDailyPayments: 30,
        matchedTransactions: 18,
        unmatchedBankTransactions: 7,
        unmatchedDailyPayments: 12,
        totalDiscrepancies: 2,
        matchingAccuracy: 72,
        totalBankAmount: 15750.5,
        totalDailyAmount: 15825.75,
      };

      setStats(mockStats);
      setBankTransactions([
        {
          bankTransactionId: 1,
          transactionDate: "2024-09-15",
          transactionAmount: 1250.75,
          transactionType: "cash",
          isMatched: false,
        },
        {
          bankTransactionId: 2,
          transactionDate: "2024-09-16",
          transactionAmount: 875.5,
          transactionType: "creditCard",
          isMatched: false,
        },
      ]);
      setDailyPayments([
        {
          dailyPaymentId: 1,
          date: "2024-09-15",
          cashCheckTotal: 1250.75,
          creditCardTotal: 650.25,
          totalAmount: 1901.0,
          isMatched: false,
        },
        {
          dailyPaymentId: 2,
          date: "2024-09-16",
          cashCheckTotal: 425.0,
          creditCardTotal: 875.5,
          totalAmount: 1300.5,
          isMatched: false,
        },
      ]);
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, bankAccountId, month, year]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleBankTransactionSelect = (transaction: BankTransaction) => {
    setSelectedBankTransaction(transaction);
    if (selectedDailyPayment) {
      setShowMatchDialog(true);
    }
  };

  const handleDailyPaymentSelect = (payment: DailyPayment) => {
    setSelectedDailyPayment(payment);
    if (selectedBankTransaction) {
      setShowMatchDialog(true);
    }
  };

  const handleCreateMatch = async () => {
    if (!selectedBankTransaction || !selectedDailyPayment) return;

    // Check if we're using mock data
    if (isUsingMockData) {
      alert(
        "Cannot create matches with demo data. Please ensure the reconciliation workspace API is working properly."
      );
      return;
    }

    try {
      // Determine connection type based on amounts
      const cashDiff = Math.abs(
        selectedBankTransaction.transactionAmount -
          selectedDailyPayment.cashCheckTotal
      );
      const creditDiff = Math.abs(
        selectedBankTransaction.transactionAmount -
          selectedDailyPayment.creditCardTotal
      );
      const connectionType = cashDiff < creditDiff ? "cash" : "creditCard";

      const response = await fetch("/api/reconciliation/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankTransactionId: selectedBankTransaction.bankTransactionId,
          dailyPaymentId: selectedDailyPayment.dailyPaymentId,
          connectionType,
          amount: selectedBankTransaction.transactionAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Match API error:", response.status, errorData);
        throw new Error(
          `Failed to create match: ${errorData.error || response.statusText}`
        );
      }

      // Refresh data
      await loadWorkspaceData();
      setShowMatchDialog(false);
      setSelectedBankTransaction(null);
      setSelectedDailyPayment(null);
    } catch (error) {
      console.error("Failed to create match:", error);
      // Show user-friendly error message
      alert(
        `Failed to create match: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleUnmatch = async (
    bankTransactionId: number,
    dailyPaymentId: number
  ) => {
    try {
      const response = await fetch("/api/reconciliation/unmatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankTransactionId,
          dailyPaymentId,
          reason: "Manual unmatch by user",
          unmatchedBy: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to unmatch");
      }

      // Refresh data
      await loadWorkspaceData();
    } catch (error) {
      console.error("Failed to unmatch:", error);
    }
  };

  const getProgressPercentage = () => {
    if (stats.totalBankTransactions === 0) return 0;
    return Math.round(
      (stats.matchedTransactions / stats.totalBankTransactions) * 100
    );
  };

  const getAmountDifference = () => {
    return stats.totalBankAmount - stats.totalDailyAmount;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mock Data Warning */}
      {isUsingMockData && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-800">Demo Mode</div>
              <div className="text-sm text-yellow-700">
                You are viewing demo data. Match creation is disabled. Please
                check that the reconciliation workspace API is working properly.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getProgressPercentage()}%</div>
            <div className="mt-2">
              <Progress value={getProgressPercentage()} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.matchedTransactions} of {stats.totalBankTransactions}{" "}
              matched
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.unmatchedBankTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              Bank transactions remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalDiscrepancies}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Amount Difference
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                Math.abs(getAmountDifference()) < 1
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(getAmountDifference())}
            </div>
            <p className="text-xs text-muted-foreground">
              Bank vs Daily Payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="unmatched">
            Unmatched ({stats.unmatchedBankTransactions})
          </TabsTrigger>
          <TabsTrigger value="matched">
            Matched ({stats.matchedTransactions})
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Zap className="h-4 w-4 mr-1" />
            Auto Match
          </TabsTrigger>
          <TabsTrigger value="discrepancies">
            Discrepancies ({stats.totalDiscrepancies})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unmatched" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BankTransactionList
              transactions={bankTransactions.filter((t) => !t.isMatched)}
              selectedTransaction={selectedBankTransaction}
              onTransactionSelect={handleBankTransactionSelect}
              title="Unmatched Bank Transactions"
            />

            <DailyPaymentList
              payments={dailyPayments.filter((p) => !p.isMatched)}
              selectedPayment={selectedDailyPayment}
              onPaymentSelect={handleDailyPaymentSelect}
              title="Unmatched Daily Payments"
            />
          </div>
        </TabsContent>

        <TabsContent value="matched" className="space-y-6">
          <MatchedTransactionsList
            matches={matchedTransactions}
            onUnmatch={handleUnmatch}
          />
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-6">
          <AutoMatchingSuggestions
            facilityId={facilityId}
            bankAccountId={bankAccountId}
            month={month}
            year={year}
            onMatchCreated={loadWorkspaceData}
          />
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-6">
          <DiscrepancyManager
            facilityId={facilityId}
            month={month}
            year={year}
            userRole={userRole}
            onDiscrepancyResolved={loadWorkspaceData}
          />
        </TabsContent>
      </Tabs>

      {/* Match Confirmation Dialog */}
      <AlertDialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transaction Match</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to match these transactions?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedBankTransaction && selectedDailyPayment && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Bank Transaction</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>Date: {selectedBankTransaction.transactionDate}</div>
                    <div>
                      Amount:{" "}
                      {formatCurrency(
                        selectedBankTransaction.transactionAmount
                      )}
                    </div>
                    <div>Type: {selectedBankTransaction.transactionType}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Daily Payment</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>Date: {selectedDailyPayment.date}</div>
                    <div>
                      Cash/Check:{" "}
                      {formatCurrency(selectedDailyPayment.cashCheckTotal)}
                    </div>
                    <div>
                      Credit Card:{" "}
                      {formatCurrency(selectedDailyPayment.creditCardTotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Show potential discrepancy warning */}
              {(() => {
                const cashDiff = Math.abs(
                  selectedBankTransaction.transactionAmount -
                    selectedDailyPayment.cashCheckTotal
                );
                const creditDiff = Math.abs(
                  selectedBankTransaction.transactionAmount -
                    selectedDailyPayment.creditCardTotal
                );
                const minDiff = Math.min(cashDiff, creditDiff);

                if (minDiff > 1) {
                  return (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Amount Difference: {formatCurrency(minDiff)}
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        This match will create a discrepancy that may need
                        approval.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateMatch}>
              Create Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
