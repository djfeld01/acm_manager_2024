"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllEmployeesCurrentCompensation, type EmployeeCurrentComp } from "@/lib/controllers/compensationController";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompensationHistorySheet } from "./CompensationHistorySheet";

function formatWage(wage: string | null, type: string | null): string {
  if (!wage) return "—";
  const amount = Number(wage).toFixed(2);
  return `$${amount}${type === "HOURLY" ? "/hr" : "/yr"}`;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const CHANGE_REASON_LABELS: Record<string, string> = {
  HIRE: "Hire",
  ANNUAL_INCREASE: "Annual Increase",
  INTERIM_RAISE: "Interim Raise",
  PROMOTION: "Promotion",
  OTHER: "Other",
};

export function CompensationTab() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeCurrentComp | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["employeesCurrentCompensation"],
    queryFn: () => getAllEmployeesCurrentCompensation(),
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Wage</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Change Reason</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No active employees found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((emp) => (
                <TableRow key={emp.employeeId}>
                  <TableCell className="font-medium">{emp.fullName ?? "—"}</TableCell>
                  <TableCell>{emp.title ?? "—"}</TableCell>
                  <TableCell>{formatWage(emp.wage, emp.compensationType)}</TableCell>
                  <TableCell>
                    {emp.compensationType ? (
                      <Badge variant="outline">{emp.compensationType}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{formatDate(emp.effectiveDate)}</TableCell>
                  <TableCell>
                    {emp.changeReason ? (
                      <Badge variant="secondary">
                        {CHANGE_REASON_LABELS[emp.changeReason] ?? emp.changeReason}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      History
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedEmployee && (
        <CompensationHistorySheet
          employee={selectedEmployee}
          open={!!selectedEmployee}
          onOpenChange={(open) => {
            if (!open) setSelectedEmployee(null);
          }}
        />
      )}
    </>
  );
}
