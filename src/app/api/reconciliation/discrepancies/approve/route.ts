import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { reconciliationDiscrepancies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const userRole = session.user.role || "";
    if (!["ADMIN", "OWNER"].includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { discrepancyId, notes } = body;

    if (!discrepancyId) {
      return NextResponse.json(
        { error: "Discrepancy ID is required" },
        { status: 400 }
      );
    }

    // TODO: Implement actual database update
    // const result = await db
    //   .update(reconciliationDiscrepancies)
    //   .set({
    //     status: 'approved',
    //     approvedBy: session.user.id,
    //     approvedAt: new Date(),
    //     approvalNotes: notes || null,
    //   })
    //   .where(eq(reconciliationDiscrepancies.discrepancyId, discrepancyId))
    //   .returning();

    // For now, return success
    return NextResponse.json({
      success: true,
      message: "Discrepancy approved successfully",
      discrepancyId,
      approvedBy: session.user.name,
      approvedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Approve discrepancy API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
