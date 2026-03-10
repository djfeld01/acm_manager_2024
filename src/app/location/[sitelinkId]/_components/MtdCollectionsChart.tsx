"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";

export type MonthCollectionData = {
  monthLabel: string; // "Mar '24"
  mtdAmount: number | null; // collected as of day X
  fullMonthTotal: number | null; // full month total (null for current month)
  isCurrentMonth: boolean;
};

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value != null ? fmt$(entry.value) : "—"}</span>
        </div>
      ))}
    </div>
  );
}

export function MtdCollectionsChart({
  data,
  dayOfMonth,
}: {
  data: MonthCollectionData[];
  dayOfMonth: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(v) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              notation: "compact",
              maximumFractionDigits: 0,
            }).format(v)
          }
          tick={{ fontSize: 12 }}
          width={72}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="fullMonthTotal"
          name="Full Month Total"
          fill="hsl(var(--muted-foreground))"
          opacity={0.4}
          radius={[3, 3, 0, 0]}
        />
        <Line
          dataKey="mtdAmount"
          name={`MTD thru day ${dayOfMonth}`}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 6 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
