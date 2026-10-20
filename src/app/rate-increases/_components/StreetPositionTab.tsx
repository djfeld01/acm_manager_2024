"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart } from "@/components/charts";
import { getStreetPosition } from "../actions/getStreetPosition";
import { fmtMoney, fmtNum, fmtPct } from "./format";
import { Stat, TabLoading } from "./Stat";
import type { StreetBasis } from "../_lib/street";
import { breakdownNoun, breakdownTitle, type Breakdown } from "./Breakdown";

export function StreetPositionTab({ sitelinkId, by, street }: { sitelinkId: string; by: Breakdown; street: StreetBasis }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rateInc", "street", sitelinkId, street],
    queryFn: () => getStreetPosition(sitelinkId, street),
  });
  if (!data?.overall) return <TabLoading isLoading={isLoading} error={error} />;
  const { overall } = data;
  const segments = by === "size" ? data.bySize : data.byType;

  const bucketKeys = overall.buckets.map((b) => b.key);
  const chartData = segments.map((t) => ({
    label: t.label,
    ...Object.fromEntries(t.buckets.map((b) => [b.key, b.count])),
  }));
  const colors: Record<string, string> = {
    below: "#22c55e",
    at: "#3b82f6",
    over10: "#f59e0b",
    over25: "#ef4444",
  };
  const share = (key: string) => {
    const b = overall.buckets.find((x) => x.key === key);
    return overall.rented ? (b?.count ?? 0) / overall.rented : 0;
  };

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {street === "push"
          ? "Street rate is each unit's push rate, the rate currently being asked of new tenants."
          : "Street rate is each unit's standard (rate-card) rate."}{" "}
        Tenants far above street are the
        likeliest to leave when raised again, because they can rent the same unit elsewhere (or new
        at our own street rate) for less.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Occupancy (rentable)" value={fmtPct(overall.occupancy, 1)} sub={`${overall.rented} of ${overall.rentable} units`} />
        <Stat label="Median tenant vs street" value={`${fmtNum(overall.medianRatio * 100, 0)}%`} sub="100% = paying exactly street" />
        <Stat label="Over street 25%+" value={fmtPct(share("over25"))} sub={`${overall.buckets.find((b) => b.key === "over25")?.count ?? 0} tenants — highest risk`} />
        <Stat label="Rent above street" value={`${fmtMoney(overall.dollarsOverStreet)}/mo`} sub="Net of tenants below street" />
      </div>

      <BarChart
        title={`Tenants by street-rate position, by ${breakdownNoun(by)}`}
        description={`Rent roll as of ${data.snapshotDate}`}
        data={chartData}
        xAxisKey="label"
        layout="horizontal"
        height={320}
        bars={bucketKeys.map((k) => ({
          dataKey: k,
          name: overall.buckets.find((b) => b.key === k)!.label,
          color: colors[k],
          stackId: "a",
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>By {breakdownNoun(by)}</CardTitle>
          <CardDescription>Counts of rented units; rent = current monthly rent.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{breakdownTitle(by)}</TableHead>
                <TableHead className="text-right">Rented / Rentable</TableHead>
                <TableHead className="text-right">Occupancy</TableHead>
                <TableHead className="text-right">Avg rent</TableHead>
                <TableHead className="text-right">Avg street</TableHead>
                <TableHead className="text-right">Median vs street</TableHead>
                {overall.buckets.map((b) => (
                  <TableHead key={b.key} className="text-right">{b.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...segments, overall].map((t) => (
                <TableRow key={t.label} className={t === overall ? "font-semibold" : ""}>
                  <TableCell>{t === overall ? "All" : t.label}</TableCell>
                  <TableCell className="text-right">{t.rented} / {t.rentable}</TableCell>
                  <TableCell className="text-right">{fmtPct(t.occupancy, 1)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(t.avgRent)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(t.avgStreet)}</TableCell>
                  <TableCell className="text-right">{fmtNum(t.medianRatio * 100)}%</TableCell>
                  {t.buckets.map((b) => (
                    <TableCell key={b.key} className="text-right">{b.count}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
