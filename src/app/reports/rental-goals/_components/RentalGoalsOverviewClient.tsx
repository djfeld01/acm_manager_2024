"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRentalOverviewData } from "@/lib/controllers/rentalGoalController";

function getNextMonths(count: number): { value: string; label: string }[] {
  const now = new Date();
  const months: { value: string; label: string }[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    months.push({ value, label });
  }
  return months;
}

function TrendBadge({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") {
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
        <TrendingUp className="h-3 w-3" />
        Up
      </Badge>
    );
  }
  if (trend === "down") {
    return (
      <Badge variant="destructive" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        Down
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Minus className="h-3 w-3" />
      Stable
    </Badge>
  );
}

export function RentalGoalsOverviewClient() {
  const months = getNextMonths(3);
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["rentalGoalsOverview", selectedMonth],
    queryFn: () => getRentalOverviewData(selectedMonth),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Select month…" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Occ %</TableHead>
              <TableHead className="text-right">Vacant</TableHead>
              <TableHead className="text-right">Last 3 Mo Avg</TableHead>
              <TableHead className="text-right">Stat Prediction</TableHead>
              <TableHead className="text-right">Prior Year Goal</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No data available.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.sitelinkId}>
                  <TableCell className="font-medium">{row.facilityName}</TableCell>
                  <TableCell className="text-right">
                    {row.occupancyPct != null
                      ? `${Math.round(row.occupancyPct * 100)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.vacantUnits != null ? row.vacantUnits : "—"}
                  </TableCell>
                  <TableCell className="text-right">{row.last3MonthAvg}</TableCell>
                  <TableCell className="text-right font-semibold">{row.statPrediction}</TableCell>
                  <TableCell className="text-right">
                    {row.priorYearGoal != null ? row.priorYearGoal : "—"}
                  </TableCell>
                  <TableCell>
                    <TrendBadge trend={row.trend} />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/reports/rental-goals/${row.sitelinkId}?month=${selectedMonth}`}
                      >
                        Detail
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
