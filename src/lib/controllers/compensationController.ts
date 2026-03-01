"use server";
import { db } from "@/db";
import { userDetails, employeeCompensation } from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc, sql } from "drizzle-orm";

export type EmployeeCurrentComp = {
  employeeId: string;
  fullName: string | null;
  compensationId: number | null;
  effectiveDate: string | null;
  wage: string | null;
  compensationType: "HOURLY" | "SALARY" | null;
  title: string | null;
  changeReason:
    | "HIRE"
    | "ANNUAL_INCREASE"
    | "INTERIM_RAISE"
    | "PROMOTION"
    | "OTHER"
    | null;
  notes: string | null;
};

export type EmployeeCompensationEntry = {
  id: number;
  employeeId: string;
  effectiveDate: string;
  wage: string;
  compensationType: "HOURLY" | "SALARY";
  title: string | null;
  changeReason:
    | "HIRE"
    | "ANNUAL_INCREASE"
    | "INTERIM_RAISE"
    | "PROMOTION"
    | "OTHER";
  notes: string | null;
  createdAt: Date | null;
};

export type AddCompensationEntry = {
  employeeId: string;
  effectiveDate: string;
  wage: string;
  compensationType: "HOURLY" | "SALARY";
  title?: string;
  changeReason: "HIRE" | "ANNUAL_INCREASE" | "INTERIM_RAISE" | "PROMOTION" | "OTHER";
  notes?: string;
};

export async function getAllEmployeesCurrentCompensation(): Promise<EmployeeCurrentComp[]> {
  // Get all active employees with their latest compensation entry
  const latestComp = db
    .select({
      employeeId: employeeCompensation.employeeId,
      id: employeeCompensation.id,
      effectiveDate: employeeCompensation.effectiveDate,
      wage: employeeCompensation.wage,
      compensationType: employeeCompensation.compensationType,
      title: employeeCompensation.title,
      changeReason: employeeCompensation.changeReason,
      notes: employeeCompensation.notes,
      rn: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${employeeCompensation.employeeId} ORDER BY ${employeeCompensation.effectiveDate} DESC)`.as(
        "rn"
      ),
    })
    .from(employeeCompensation)
    .as("latest_comp");

  const rows = await db
    .select({
      employeeId: userDetails.id,
      fullName: userDetails.fullName,
      compensationId: latestComp.id,
      effectiveDate: latestComp.effectiveDate,
      wage: latestComp.wage,
      compensationType: latestComp.compensationType,
      title: latestComp.title,
      changeReason: latestComp.changeReason,
      notes: latestComp.notes,
    })
    .from(userDetails)
    .leftJoin(
      latestComp,
      sql`${latestComp.employeeId} = ${userDetails.id} AND ${latestComp.rn} = 1`
    )
    .where(eq(userDetails.isActiveEmployee, true))
    .orderBy(userDetails.fullName);

  return rows as EmployeeCurrentComp[];
}

export async function getEmployeeCompensationHistory(
  employeeId: string
): Promise<EmployeeCompensationEntry[]> {
  const rows = await db
    .select()
    .from(employeeCompensation)
    .where(eq(employeeCompensation.employeeId, employeeId))
    .orderBy(desc(employeeCompensation.effectiveDate));

  return rows as EmployeeCompensationEntry[];
}

export async function addCompensationEntry(data: AddCompensationEntry) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const createdBy = session.user.userDetailId;

  const [inserted] = await db
    .insert(employeeCompensation)
    .values({
      employeeId: data.employeeId,
      effectiveDate: data.effectiveDate,
      wage: data.wage,
      compensationType: data.compensationType,
      title: data.title ?? null,
      changeReason: data.changeReason,
      notes: data.notes ?? null,
      createdBy: createdBy ?? null,
    })
    .returning();

  return inserted;
}
