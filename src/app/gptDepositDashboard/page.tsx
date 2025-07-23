import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getDailyPaymentMatchLists } from "@/lib/controllers/dailyPaymentController/dailyPaymentController";
import { redirect } from "next/navigation";
import {
  createMatch,
  attemptAutoMatching,
} from "@/lib/controllers/dailyPaymentController/dailyPaymentController";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchedItem {
  dailyPayment: any;
  bankTransaction: any;
}

interface UnmatchedItem {
  dailyPayment: any;
  amount: number;
}

interface DepositData {
  matchedCash: MatchedItem[];
  matchedCC: MatchedItem[];
  unmatchedCash: UnmatchedItem[];
  unmatchedCC: UnmatchedItem[];
  unmatchedBankTransactions: any[];
}

// Pagination component
function PaginationControls({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set(basePath, page.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <a
        href={createPageUrl(Math.max(1, currentPage - 1))}
        className={`p-2 rounded ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </a>
      <span className="px-4 py-2 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <a
        href={createPageUrl(Math.min(totalPages, currentPage + 1))}
        className={`p-2 rounded ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </a>
    </div>
  );
}

// Paginated section component
function PaginatedSection({
  title,
  items,
  renderItem,
  currentPage,
  searchParams,
  pageParamName,
  icon,
  bgColor,
}: {
  title: string;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  currentPage: number;
  searchParams: URLSearchParams;
  pageParamName: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  const itemsPerPage = 15;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {paginatedItems.map((item, i) => (
            <div
              key={startIndex + i}
              className={`${bgColor} p-3 rounded border`}
            >
              {renderItem(item, i)}
            </div>
          ))}
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={pageParamName}
          searchParams={searchParams}
        />
      </CardContent>
    </Card>
  );
}

async function handleAutoMatch(formData: FormData) {
  "use server";
  const sitelinkId = formData.get("sitelinkId") as string;
  await attemptAutoMatching(sitelinkId);
  redirect(`/gptDepositDashboard?sitelinkId=${sitelinkId}`);
}

async function handleManualMatch(formData: FormData) {
  "use server";
  const dailyPaymentId = parseInt(formData.get("dailyPaymentId") as string);
  const bankTransactionId = parseInt(
    formData.get("bankTransactionId") as string
  );
  const type = formData.get("type") as "cashCheck" | "creditCard";
  const sitelinkId = formData.get("sitelinkId") as string;

  await createMatch(dailyPaymentId, bankTransactionId, type, sitelinkId);
  redirect(`/gptDepositDashboard?sitelinkId=${sitelinkId}`);
}

function MatchingControls({
  sitelinkId,
  unmatchedBankTransactions,
}: {
  sitelinkId: string;
  unmatchedBankTransactions: any[];
}) {
  return (
    <div className="mb-6 p-4 bg-white rounded-lg border">
      <h2 className="text-lg font-semibold mb-3">Matching Tools</h2>
      <div className="flex gap-4">
        <form action={handleAutoMatch}>
          <input type="hidden" name="sitelinkId" value={sitelinkId} />
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            Auto-Match Transactions
          </Button>
        </form>
        <span className="text-sm text-gray-600 self-center">
          {unmatchedBankTransactions.length} unmatched bank transactions
          available
        </span>
      </div>
    </div>
  );
}

function UnmatchedCashSection({
  item,
  sitelinkId,
  unmatchedBankTransactions,
}: {
  item: any;
  sitelinkId: string;
  unmatchedBankTransactions: any[];
}) {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium">
            {new Date(item.dailyPayment.date).toLocaleDateString()}
          </span>
        </div>
        <Badge variant="destructive" className="text-xs">
          ${item.amount.toLocaleString()}
        </Badge>
      </div>
      <div className="text-xs text-gray-600 mt-1">
        Cash: ${item.dailyPayment.cash ?? 0} | Check: $
        {item.dailyPayment.check ?? 0}
      </div>

      {/* Manual matching form */}
      <form action={handleManualMatch} className="mt-2">
        <input
          type="hidden"
          name="dailyPaymentId"
          value={item.dailyPayment.Id}
        />
        <input type="hidden" name="type" value="cashCheck" />
        <input type="hidden" name="sitelinkId" value={sitelinkId} />
        <div className="flex gap-2">
          <select
            name="bankTransactionId"
            className="text-xs border rounded px-2 py-1 flex-1"
            required
          >
            <option value="">Select bank transaction...</option>
            {unmatchedBankTransactions
              .filter((bt) => Math.abs(bt.transactionAmount - item.amount) < 50) // Show close amounts
              .map((bt) => (
                <option key={bt.bankTransactionId} value={bt.bankTransactionId}>
                  ${bt.transactionAmount} on{" "}
                  {new Date(bt.transactionDate).toLocaleDateString()}
                </option>
              ))}
          </select>
          <Button type="submit" size="sm" className="text-xs">
            Match
          </Button>
        </div>
      </form>
    </>
  );
}

export default async function DepositDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    sitelinkId?: string;
    matchedCashPage?: string;
    matchedCCPage?: string;
    unmatchedCashPage?: string;
    unmatchedCCPage?: string;
    bankTransPage?: string;
  }>;
}) {
  // Await searchParams before using it
  const params = await searchParams;
  const sitelinkId = params.sitelinkId || "35";

  // Get page numbers from search params
  const matchedCashPage = parseInt(params.matchedCashPage || "1");
  const matchedCCPage = parseInt(params.matchedCCPage || "1");
  const unmatchedCashPage = parseInt(params.unmatchedCashPage || "1");
  const unmatchedCCPage = parseInt(params.unmatchedCCPage || "1");
  const bankTransPage = parseInt(params.bankTransPage || "1");

  const data = await getDailyPaymentMatchLists(sitelinkId);
  const urlSearchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      urlSearchParams.set(key, value);
    }
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Deposit Matching Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Facility: {sitelinkId}</span>
          <a
            href="?sitelinkId=35"
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Facility 35
          </a>
          <a
            href="?sitelinkId=36"
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Facility 36
          </a>
        </div>
      </div>

      {/* Matching Controls */}
      <MatchingControls
        sitelinkId={sitelinkId}
        unmatchedBankTransactions={data.unmatchedBankTransactions}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Cash Deposits */}
        <PaginatedSection
          title="Matched Cash/Check Deposits"
          items={data.matchedCash}
          currentPage={matchedCashPage}
          searchParams={urlSearchParams}
          pageParamName="matchedCashPage"
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          bgColor="bg-green-50"
          renderItem={(item) => (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {new Date(item.dailyPayment.date).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant="default" className="text-xs">
                  $
                  {(
                    (item.dailyPayment.cash ?? 0) +
                    (item.dailyPayment.check ?? 0)
                  ).toLocaleString()}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Bank Transaction: $
                {item.bankTransaction.transactionAmount?.toLocaleString()}
                on{" "}
                {new Date(
                  item.bankTransaction.transactionDate
                ).toLocaleDateString()}
              </div>
            </>
          )}
        />

        {/* Matched Credit Card Deposits */}
        <PaginatedSection
          title="Matched Credit Card Deposits"
          items={data.matchedCC}
          currentPage={matchedCCPage}
          searchParams={urlSearchParams}
          pageParamName="matchedCCPage"
          icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
          bgColor="bg-blue-50"
          renderItem={(item) => (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    {new Date(item.dailyPayment.date).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  $
                  {(
                    (item.dailyPayment.visa ?? 0) +
                    (item.dailyPayment.mastercard ?? 0) +
                    (item.dailyPayment.americanExpress ?? 0) +
                    (item.dailyPayment.discover ?? 0) +
                    (item.dailyPayment.dinersClub ?? 0) +
                    (item.dailyPayment.debit ?? 0) +
                    (item.dailyPayment.ach ?? 0)
                  ).toLocaleString()}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Bank Transaction: $
                {item.bankTransaction.transactionAmount?.toLocaleString()}
                on{" "}
                {new Date(
                  item.bankTransaction.transactionDate
                ).toLocaleDateString()}
              </div>
            </>
          )}
        />

        {/* Unmatched Cash Deposits */}
        <PaginatedSection
          title="Unmatched Cash/Check Deposits"
          items={data.unmatchedCash}
          currentPage={unmatchedCashPage}
          searchParams={urlSearchParams}
          pageParamName="unmatchedCashPage"
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          bgColor="bg-red-50"
          renderItem={(item) => (
            <UnmatchedCashSection
              item={item}
              sitelinkId={sitelinkId}
              unmatchedBankTransactions={data.unmatchedBankTransactions}
            />
          )}
        />

        {/* Unmatched Credit Card Deposits */}
        <PaginatedSection
          title="Unmatched Credit Card Deposits"
          items={data.unmatchedCC}
          currentPage={unmatchedCCPage}
          searchParams={urlSearchParams}
          pageParamName="unmatchedCCPage"
          icon={<XCircle className="h-5 w-5 text-orange-600" />}
          bgColor="bg-orange-50"
          renderItem={(item) => (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">
                    {new Date(item.dailyPayment.date).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  ${item.amount.toLocaleString()}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Visa: ${item.dailyPayment.visa ?? 0} | MC: $
                {item.dailyPayment.mastercard ?? 0} | Amex: $
                {item.dailyPayment.americanExpress ?? 0}
              </div>
            </>
          )}
        />
      </div>

      {/* Unmatched Bank Transactions */}
      <div className="mt-6">
        <PaginatedSection
          title="Unmatched Bank Transactions"
          items={data.unmatchedBankTransactions}
          currentPage={bankTransPage}
          searchParams={urlSearchParams}
          pageParamName="bankTransPage"
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          bgColor="bg-purple-50"
          renderItem={(transaction) => (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  ${transaction.transactionAmount?.toLocaleString()}
                </Badge>
              </div>
              <div className="text-xs text-gray-600">
                Type: {transaction.transactionType || "Unknown"}
              </div>
              <div className="text-xs text-gray-600">
                Account: {transaction.bankAccountId}
              </div>
            </>
          )}
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-100 p-4 rounded text-center">
          <div className="text-2xl font-bold text-green-700">
            {data.matchedCash.length}
          </div>
          <div className="text-sm text-green-600">Cash Matched</div>
        </div>
        <div className="bg-blue-100 p-4 rounded text-center">
          <div className="text-2xl font-bold text-blue-700">
            {data.matchedCC.length}
          </div>
          <div className="text-sm text-blue-600">CC Matched</div>
        </div>
        <div className="bg-red-100 p-4 rounded text-center">
          <div className="text-2xl font-bold text-red-700">
            {data.unmatchedCash.length + data.unmatchedCC.length}
          </div>
          <div className="text-sm text-red-600">Unmatched Deposits</div>
        </div>
        <div className="bg-purple-100 p-4 rounded text-center">
          <div className="text-2xl font-bold text-purple-700">
            {data.unmatchedBankTransactions.length}
          </div>
          <div className="text-sm text-purple-600">Unmatched Bank</div>
        </div>
      </div>
    </div>
  );
}
