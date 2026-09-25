"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
import { getPortfolioMarketingOverview } from "../actions/getPortfolioMarketingOverview";

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

function fmtPct(v: number | null) {
  return v != null ? `${Math.round(v * 100)}%` : "—";
}

export function MarketingOverviewClient() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["marketingOverview"],
    queryFn: () => getPortfolioMarketingOverview(8),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">This Week Inquiries</TableHead>
            <TableHead className="text-right">Trailing 4-Wk Avg</TableHead>
            <TableHead>Trend</TableHead>
            <TableHead className="text-right">Conv. Rate (This Wk)</TableHead>
            <TableHead className="text-right">Trailing Avg Conv.</TableHead>
            <TableHead className="text-right">Occupancy</TableHead>
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
                <TableCell className="text-right">{row.thisWeekInquiries}</TableCell>
                <TableCell className="text-right">{row.trailingAvgInquiries}</TableCell>
                <TableCell>
                  <TrendBadge trend={row.inquiryTrend} />
                </TableCell>
                <TableCell className="text-right">
                  {fmtPct(row.thisWeekConversionRate)}
                </TableCell>
                <TableCell className="text-right">
                  {fmtPct(row.trailingAvgConversionRate)}
                </TableCell>
                <TableCell className="text-right">
                  {row.currentOccupancyPct != null
                    ? `${Math.round(row.currentOccupancyPct * 100)}%`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/marketing/${row.sitelinkId}`}>Detail</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
