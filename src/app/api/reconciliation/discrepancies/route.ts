import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  reconciliationDiscrepancies,
  monthlyReconciliation,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch discrepancies
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    // TODO: Implement actual database query
    // For now, return mock data
    const mockDiscrepancies = [
      {
        discrepancyId: 1,
        reconciliationId: 1,
        discrepancyType: "multi_day_combination",
        description: "Bank deposit combines transactions from Sept 15-16",
        amount: 25.5,
        status: "pending_approval",
        createdBy: "Office Manager",
        createdAt: "2024-09-17T10:30:00Z",
        notes: "Weekend deposits were combined by bank",
        isCritical: false,
      },
      {
        discrepancyId: 2,
        reconciliationId: 1,
        discrepancyType: "bank_fee",
        description: "Bank processing fee not reflected in daily payments",
        amount: 3.5,
        status: "pending_approval",
        createdBy: "Office Manager",
        createdAt: "2024-09-16T14:20:00Z",
        notes: "Monthly processing fee",
        isCritical: false,
      },
    ];

    return NextResponse.json({ discrepancies: mockDiscrepancies });
  } catch (error) {
    console.error("Discrepancies API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new discrepancy
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      reconciliationId,
      discrepancyType,
      description,
      amount,
      notes,
      isCritical,
      referenceTransactionIds,
      referenceDailyPaymentIds,
    } = body;

    // Validate required fields
    if (!reconciliationId || !discrepancyType || !description || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Implement actual database insertion
    // For now, return success
    const mockDiscrepancy = {
      discrepancyId: Math.floor(Math.random() * 1000),
      reconciliationId,
      discrepancyType,
      description,
      amount,
      status: "pending_approval",
      createdBy: session.user.name || "Unknown User",
      createdAt: new Date().toISOString(),
      notes,
      isCritical: isCritical || false,
      referenceTransactionIds,
      referenceDailyPaymentIds,
    };

    return NextResponse.json({
      success: true,
      discrepancy: mockDiscrepancy,
    });
  } catch (error) {
    console.error("Create discrepancy API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
