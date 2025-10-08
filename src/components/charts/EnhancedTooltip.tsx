"use client";

import { TooltipProps } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

export interface EnhancedTooltipProps extends TooltipProps<any, any> {
  // Custom formatting options
  valueFormatter?: (value: any, name: string) => string;
  labelFormatter?: (label: any) => string;

  // Additional data to display
  showTotal?: boolean;
  showPercentage?: boolean;
  showTrend?: boolean;

  // Styling options
  showBorder?: boolean;
  showShadow?: boolean;

  // Custom content
  customContent?: (data: any) => React.ReactNode;
}

export function EnhancedTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  showTotal = false,
  showPercentage = false,
  showTrend = false,
  showBorder = true,
  showShadow = true,
  customContent,
}: EnhancedTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Calculate total if needed
  const total = showTotal
    ? payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0)
    : 0;

  // Format label
  const formattedLabel = labelFormatter
    ? labelFormatter(label)
    : typeof label === "string" && label.includes("T")
    ? format(new Date(label), "MMM dd, yyyy")
    : label;

  // Custom content override
  if (customContent) {
    return (
      <Card
        className={`${showBorder ? "border" : "border-0"} ${
          showShadow ? "shadow-lg" : ""
        }`}
      >
        <CardContent className="p-3">
          {customContent({ payload, label, total })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${showBorder ? "border" : "border-0"} ${
        showShadow ? "shadow-lg" : ""
      } max-w-xs`}
    >
      <CardContent className="p-3 space-y-2">
        {/* Label */}
        {formattedLabel && (
          <div className="font-medium text-sm text-foreground">
            {formattedLabel}
          </div>
        )}

        {/* Values */}
        <div className="space-y-1">
          {payload.map((entry, index) => {
            const value = valueFormatter
              ? valueFormatter(entry.value, entry.name || entry.dataKey)
              : typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value;

            const percentage =
              showPercentage && total > 0
                ? ((Number(entry.value) / total) * 100).toFixed(1)
                : null;

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name || entry.dataKey}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{value}</span>
                  {percentage && (
                    <Badge variant="secondary" className="text-xs">
                      {percentage}%
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        {showTotal && payload.length > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-bold">
                {total.toLocaleString()}
              </span>
            </div>
          </>
        )}

        {/* Trend indicator (placeholder for future enhancement) */}
        {showTrend && (
          <div className="text-xs text-muted-foreground">
            {/* Trend calculation would go here */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized tooltip for financial data
export function FinancialTooltip(props: EnhancedTooltipProps) {
  const valueFormatter = (value: any, name: string) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value);
    }
    return value;
  };

  return (
    <EnhancedTooltip
      {...props}
      valueFormatter={valueFormatter}
      showTotal={true}
      showPercentage={true}
    />
  );
}

// Specialized tooltip for percentage data
export function PercentageTooltip(props: EnhancedTooltipProps) {
  const valueFormatter = (value: any, name: string) => {
    if (typeof value === "number") {
      return `${value.toFixed(1)}%`;
    }
    return value;
  };

  return (
    <EnhancedTooltip
      {...props}
      valueFormatter={valueFormatter}
      showPercentage={false} // Already showing as percentage
    />
  );
}

// Specialized tooltip for count/quantity data
export function CountTooltip(props: EnhancedTooltipProps) {
  const valueFormatter = (value: any, name: string) => {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <EnhancedTooltip
      {...props}
      valueFormatter={valueFormatter}
      showTotal={true}
    />
  );
}
