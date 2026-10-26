"use client";
import { useState } from "react";
import { ChevronDown, AlarmClockOff } from "lucide-react";
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
import type { MissedPunch } from "@/lib/parseTimecardCsv";

export function MissedPunches({ punches }: { punches: MissedPunch[] }) {
  const [open, setOpen] = useState(true);
  const leftoverCount = punches.filter((p) => p.leftover).length;
  const missedCount = punches.length - leftoverCount;

  const sorted = [...punches].sort((a, b) =>
    `${a.lastName}, ${a.firstName}`.localeCompare(
      `${b.lastName}, ${b.firstName}`,
    ),
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card className={punches.length > 0 ? "border-destructive/50" : ""}>
        <CardHeader>
          <CollapsibleTrigger className="group flex items-center gap-2 text-left">
            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
            <CardTitle className="text-lg flex items-center gap-2">
              <AlarmClockOff
                className={`h-5 w-5 ${punches.length > 0 ? "text-destructive" : ""}`}
              />
              Missed punches
              <span className="text-sm font-normal text-muted-foreground">
                {leftoverCount > 0
                  ? `${missedCount} missed, ${leftoverCount} leftover`
                  : punches.length}
              </span>
            </CardTitle>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {punches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No missed punches found — every in punch has an out punch.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>In Punch</TableHead>
                    <TableHead>Out Punch</TableHead>
                    <TableHead>Problem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((p) => (
                    <TableRow
                      key={`${p.employeeNumber}|${p.date}|${p.inPunch}|${p.outPunch}`}
                    >
                      <TableCell className="font-medium">
                        {p.lastName}, {p.firstName}
                      </TableCell>
                      <TableCell>{p.workedDepartment || "—"}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{p.inPunch || "—"}</TableCell>
                      <TableCell>{p.outPunch || "—"}</TableCell>
                      {p.leftover ? (
                        <TableCell className="text-amber-600 dark:text-amber-400">
                          Leftover punch
                          <div className="text-xs text-muted-foreground">
                            Day already has shifts {p.leftover.shiftsStart}–
                            {p.leftover.shiftsEnd}
                          </div>
                        </TableCell>
                      ) : (
                        <TableCell className="text-destructive">
                          {p.missing === "out" ? "No out punch" : "No in punch"}
                        </TableCell>
                      )}
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
