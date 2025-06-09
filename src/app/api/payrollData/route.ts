import { db } from "@/db";
import { getEmployeePayrollData } from "@/lib/controllers/payrollController/getEmployeePayrollData";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await getEmployeePayrollData();
  return NextResponse.json({ message: "Hello from payrollData API!", result });
}
