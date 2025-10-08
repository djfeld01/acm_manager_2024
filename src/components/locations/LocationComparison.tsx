"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { LocationData } from "./LocationCard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComparisonMetric {
  key: keyof LocationData;
  label: string;
  format: "currency" | "percentage" | "number";
  icon: React.ComponentType<{ className?: string }>;
  higherIsBetter: boolean;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    key: "occupancyRate",
    label: "Occupancy Rate",
    format: "percentage",
    icon: Building2,
    higherIsBetter: true,
  },
  {
    key: "monthlyRevenue",
    label: "Monthly Revenue",
    format: "currency",
    icon: DollarSign,
    higherIsBetter: true,
  },
  {
    key: "rentalsThisMonth",
    label: "Rentals This Month",
    format: "number",
    icon: Target,
    higherIsBetter: true,
  },
  {
    key: "employeeCount",
    label: "Staff Count",
    format: "number",
    icon: Users,
    higherIsBetter: true,
  },
  {
    key: "alertCount",
    label: "Active Alerts",
    format: "number",
    icon: AlertTriangle,
    higherIsBetter: false,
  },
];

interface LocationComparisonProps {
  locations: LocationData[];
  selectedLocationIds: string[];
  onRemoveLocation?: (sitelinkId: string) => void;
  onAddLocation?: () => void;
  onExportComparison?: (format: "csv" | "pdf") => void;
  className?: string;
}

export function LocationComparison({
  locations,
  selectedLocationIds,
  onRemoveLocation,
  onAddLocation,
  onExportComparison,
  className,
}: LocationComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>("occupancyRate");
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  const selectedLocations = locations.filter((loc) =>
    selectedLocationIds.includes(loc.sitelinkId)
  );

  const formatValue = (value: any, format: ComparisonMetric["format"]) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(value);
      case "percentage":
        return `${Number(value).toFixed(1)}%`;
      case "number":
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  };

  const getRankingColor = (rank: number, total: number) => {
    const percentage = rank / total;
    if (percentage <= 0.33) return "text-green-600 bg-green-50";
    if (percentage <= 0.66) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getMetricRanking = (metric: ComparisonMetric) => {
    const sortedLocations = [...selectedLocations].sort((a, b) => {
      const aValue = Number(a[metric.key]);
      const bValue = Number(b[metric.key]);
      return metric.higherIsBetter ? bValue - aValue : aValue - bValue;
    });

    return sortedLocations.map((location, index) => ({
      location,
      rank: index + 1,
      value: location[metric.key],
    }));
  };

  if (selectedLocations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium">
            No locations selected for comparison
          </p>
          <p className="text-xs text-muted-foreground">
            Select 2 or more locations to compare their performance
          </p>
          {onAddLocation && (
            <Button variant="outline" onClick={onAddLocation} className="mt-4">
              Select Locations
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const selectedMetricData = COMPARISON_METRICS.find(
    (m) => m.key === selectedMetric
  );
  const rankings = selectedMetricData
    ? getMetricRanking(selectedMetricData)
    : [];

  return (
    <ComponentErrorBoundary>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Location Comparison
            </h2>
            <p className="text-muted-foreground">
              Comparing {selectedLocations.length} locations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {COMPARISON_METRICS.map((metric) => (
                  <SelectItem key={metric.key} value={metric.key}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={viewMode}
              onValueChange={(value: "table" | "chart") => setViewMode(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="chart">Chart</SelectItem>
              </SelectContent>
            </Select>

            {onExportComparison && (
              <Button
                variant="outline"
                onClick={() => onExportComparison("csv")}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Selected Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedLocations.map((location) => (
                <Badge
                  key={location.sitelinkId}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {location.facilityAbbreviation}
                  {onRemoveLocation && (
                    <button
                      onClick={() => onRemoveLocation(location.sitelinkId)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {viewMode === "table" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    {COMPARISON_METRICS.map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <TableHead key={metric.key} className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Icon className="h-4 w-4" />
                            {metric.label}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLocations.map((location) => (
                    <TableRow key={location.sitelinkId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{location.facilityName}</div>
                            <div className="text-xs text-muted-foreground">
                              {location.city}, {location.state}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {COMPARISON_METRICS.map((metric) => (
                        <TableCell key={metric.key} className="text-center">
                          <div className="font-medium">
                            {formatValue(location[metric.key], metric.format)}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedMetricData?.label} Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankings.map((item, index) => (
                  <div
                    key={item.location.sitelinkId}
                    className="flex items-center gap-4"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        getRankingColor(item.rank, selectedLocations.length)
                      )}
                    >
                      {item.rank}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {item.location.facilityName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.location.city}, {item.location.state}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatValue(
                              item.value,
                              selectedMetricData?.format || "number"
                            )}
                          </p>
                        </div>
                      </div>

                      {selectedMetricData?.format === "percentage" && (
                        <Progress
                          value={Number(item.value)}
                          className="h-2 mt-2"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {selectedLocations.reduce(
                  (sum, loc) => sum + loc.occupancyRate,
                  0
                ) / selectedLocations.length || 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">
                Average Occupancy
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {formatValue(
                  selectedLocations.reduce(
                    (sum, loc) => sum + loc.monthlyRevenue,
                    0
                  ),
                  "currency"
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Combined Revenue
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {selectedLocations.reduce(
                  (sum, loc) => sum + loc.totalUnits,
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Total Units</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}
