import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  reconciliationDiscrepancies,
  monthlyReconciliation,
  storageFacilities,
  users,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role (Director of Accounting)
    const userRole = session.user.role || "";
    if (!["ADMIN", "OWNER"].includes(userRole)) {
      return NextResponse.json(
        {
          error: "Only administrators can access the review dashboard",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending_approval";
    const facilityId = searchParams.get("facilityId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const priority = searchParams.get("priority"); // "critical" or "all"

    // Build where conditions
    const whereConditions = [
      eq(reconciliationDiscrepancies.status, status as any),
    ];

    if (facilityId) {
      whereConditions.push(eq(monthlyReconciliation.facilityId, facilityId));
    }

    if (month && year) {
      whereConditions.push(
        eq(monthlyReconciliation.reconciliationMonth, parseInt(month))
      );
      whereConditions.push(
        eq(monthlyReconciliation.reconciliationYear, parseInt(year))
      );
    }

    if (priority === "critical") {
      whereConditions.push(eq(reconciliationDiscrepancies.isCritical, true));
    }

    // Build the query to get discrepancies with related data
    const query = db
      .select({
        discrepancyId: reconciliationDiscrepancies.discrepancyId,
        reconciliationId: reconciliationDiscrepancies.reconciliationId,
        discrepancyType: reconciliationDiscrepancies.discrepancyType,
        description: reconciliationDiscrepancies.description,
        amount: reconciliationDiscrepancies.amount,
        status: reconciliationDiscrepancies.status,
        createdBy: reconciliationDiscrepancies.createdBy,
        createdAt: reconciliationDiscrepancies.createdAt,
        notes: reconciliationDiscrepancies.notes,
        isCritical: reconciliationDiscrepancies.isCritical,
        referenceTransactionIds:
          reconciliationDiscrepancies.referenceTransactionIds,
        referenceDailyPaymentIds:
          reconciliationDiscrepancies.referenceDailyPaymentIds,
        // Reconciliation details
        facilityId: monthlyReconciliation.facilityId,
        reconciliationMonth: monthlyReconciliation.reconciliationMonth,
        reconciliationYear: monthlyReconciliation.reconciliationYear,
        reconciliationStatus: monthlyReconciliation.status,
        // Facility details
        facilityName: storageFacilities.facilityName,
        // Creator details
        creatorName: users.name,
        creatorEmail: users.email,
      })
      .from(reconciliationDiscrepancies)
      .innerJoin(
        monthlyReconciliation,
        eq(
          reconciliationDiscrepancies.reconciliationId,
          monthlyReconciliation.reconciliationId
        )
      )
      .innerJoin(
        storageFacilities,
        eq(monthlyReconciliation.facilityId, storageFacilities.sitelinkId)
      )
      .leftJoin(users, eq(reconciliationDiscrepancies.createdBy, users.id))
      .where(and(...whereConditions))
      .orderBy(
        desc(reconciliationDiscrepancies.isCritical),
        desc(reconciliationDiscrepancies.createdAt)
      );

    const discrepancies = await query;

    // Format the response
    const formattedDiscrepancies = discrepancies.map((d) => ({
      ...d,
      amount: parseFloat(d.amount || "0"),
      createdAt: d.createdAt?.toISOString(),
      referenceTransactionIds: d.referenceTransactionIds
        ? JSON.parse(d.referenceTransactionIds)
        : null,
      referenceDailyPaymentIds: d.referenceDailyPaymentIds
        ? JSON.parse(d.referenceDailyPaymentIds)
        : null,
    }));

    // Get summary statistics
    const totalDiscrepancies = formattedDiscrepancies.length;
    const criticalCount = formattedDiscrepancies.filter(
      (d) => d.isCritical
    ).length;
    const totalAmount = formattedDiscrepancies.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    // Group by facility for summary
    const facilitySummary = formattedDiscrepancies.reduce((acc, d) => {
      const key = d.facilityId;
      if (!acc[key]) {
        acc[key] = {
          facilityId: d.facilityId,
          facilityName: d.facilityName,
          count: 0,
          amount: 0,
          criticalCount: 0,
        };
      }
      acc[key].count++;
      acc[key].amount += d.amount;
      if (d.isCritical) acc[key].criticalCount++;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      discrepancies: formattedDiscrepancies,
      summary: {
        totalDiscrepancies,
        criticalCount,
        totalAmount,
        facilitySummary: Object.values(facilitySummary),
      },
    });
  } catch (error) {
    console.error("Review dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role (Director of Accounting)
    const userRole = session.user.role || "";
    if (!["ADMIN", "OWNER"].includes(userRole)) {
      return NextResponse.json(
        {
          error: "Only administrators can perform bulk actions",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, discrepancyIds, notes } = body;

    if (!action || !discrepancyIds || !Array.isArray(discrepancyIds)) {
      return NextResponse.json(
        {
          error: "Missing required fields: action and discrepancyIds",
        },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          error: "Invalid action. Must be 'approve' or 'reject'",
        },
        { status: 400 }
      );
    }

    // Verify all discrepancies exist and are pending approval
    const existingDiscrepancies = await db
      .select({
        discrepancyId: reconciliationDiscrepancies.discrepancyId,
        status: reconciliationDiscrepancies.status,
      })
      .from(reconciliationDiscrepancies)
      .where(
        inArray(reconciliationDiscrepancies.discrepancyId, discrepancyIds)
      );

    if (existingDiscrepancies.length !== discrepancyIds.length) {
      return NextResponse.json(
        {
          error: "Some discrepancies not found",
        },
        { status: 404 }
      );
    }

    const nonPendingDiscrepancies = existingDiscrepancies.filter(
      (d) => d.status !== "pending_approval"
    );

    if (nonPendingDiscrepancies.length > 0) {
      return NextResponse.json(
        {
          error: "Some discrepancies are not pending approval",
        },
        { status: 400 }
      );
    }

    // Perform bulk update
    const updateData = {
      status: (action === "approve" ? "approved" : "rejected") as
        | "approved"
        | "rejected",
      approvedBy: session.user.id,
      approvedAt: new Date(),
      approvalNotes: notes || null,
    };

    await db
      .update(reconciliationDiscrepancies)
      .set(updateData)
      .where(
        inArray(reconciliationDiscrepancies.discrepancyId, discrepancyIds)
      );

    return NextResponse.json({
      success: true,
      processedCount: discrepancyIds.length,
      action: action === "approve" ? "approved" : "rejected",
    });
  } catch (error) {
    console.error("Bulk action API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
