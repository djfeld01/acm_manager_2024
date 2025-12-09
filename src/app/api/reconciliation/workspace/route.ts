import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has appropriate role
    const userRole = session.user.role || "";
    if (!["ADMIN", "OWNER", "SUPERVISOR", "MANAGER"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const bankAccountId = parseInt(searchParams.get("bankAccountId") || "0");
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");

    if (!facilityId || !bankAccountId || !month || !year) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database queries
    // For now, return mock data
    const mockData = {
      stats: {
        totalBankTransactions: 25,
        totalDailyPayments: 30,
        matchedTransactions: 18,
        unmatchedBankTransactions: 7,
        unmatchedDailyPayments: 12,
        totalDiscrepancies: 2,
        matchingAccuracy: 72,
        totalBankAmount: 15750.5,
        totalDailyAmount: 15825.75,
      },
      bankTransactions: [
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
        {
          bankTransactionId: 3,
          transactionDate: "2024-09-17",
          transactionAmount: 2100.25,
          transactionType: "cash",
          isMatched: false,
        },
      ],
      dailyPayments: [
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
        {
          dailyPaymentId: 3,
          date: "2024-09-17",
          cashCheckTotal: 2100.25,
          creditCardTotal: 1200.75,
          totalAmount: 3301.0,
          isMatched: false,
        },
      ],
      matchedTransactions: [
        {
          bankTransactionId: 10,
          dailyPaymentId: 10,
          amount: 850.0,
          connectionType: "cash",
          matchType: "automatic",
          matchConfidence: 1.0,
          depositDifference: 0,
          matchedBy: "mock-user-id",
          matchedAt: "2024-09-14T10:30:00Z",
          notes: "Exact match found automatically",
        },
      ],
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error("Workspace API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
