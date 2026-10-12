"use client";
import { useState } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EarlyClockIn } from "@/lib/parseTimecardCsv";

export interface EmployeeEarlyClockIns {
  employeeNumber: string;
  lastName: string;
  firstName: string;
  departments: string[];
  punches: EarlyClockIn[];
}

/** One entry per employee, sorted by name, punches in file order. */
export function groupEarlyClockIns(
  clockIns: EarlyClockIn[],
): EmployeeEarlyClockIns[] {
  const byEmployee = new Map<string, EmployeeEarlyClockIns>();
  for (const c of clockIns) {
    let emp = byEmployee.get(c.employeeNumber);
    if (!emp) {
      emp = {
        employeeNumber: c.employeeNumber,
        lastName: c.lastName,
        firstName: c.firstName,
        departments: [],
        punches: [],
      };
      byEmployee.set(c.employeeNumber, emp);
    }
    if (c.workedDepartment && !emp.departments.includes(c.workedDepartment)) {
      emp.departments.push(c.workedDepartment);
    }
    emp.punches.push(c);
  }
  return Array.from(byEmployee.values()).sort((a, b) =>
    `${a.lastName}, ${a.firstName}`.localeCompare(
      `${b.lastName}, ${b.firstName}`,
    ),
  );
}

function formatEarly(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function EarlyClockIns({ clockIns }: { clockIns: EarlyClockIn[] }) {
  const [open, setOpen] = useState(true);

  const employees = groupEarlyClockIns(clockIns);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="group flex items-center gap-2 text-left">
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Clock-ins before 9:00 AM
              <span className="text-sm font-normal text-muted-foreground">
                {clockIns.length} punch{clockIns.length !== 1 ? "es" : ""},{" "}
                {employees.length} employee{employees.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one clocked in before the store opened.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Early Punches</TableHead>
                    <TableHead>Punches (time before open)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.employeeNumber}>
                      <TableCell className="font-medium align-top">
                        {emp.lastName}, {emp.firstName}
                      </TableCell>
                      <TableCell className="align-top">
                        {emp.departments.join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        {emp.punches.length}
                      </TableCell>
                      <TableCell>
                        <ul className="space-y-0.5 text-sm">
                          {emp.punches.map((p) => (
                            <li key={`${p.date}|${p.inPunch}`}>
                              {p.date} · {p.inPunch}{" "}
                              <span className="text-muted-foreground">
                                ({formatEarly(p.minutesEarly)})
                              </span>
                              {emp.departments.length > 1 && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {p.workedDepartment}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
