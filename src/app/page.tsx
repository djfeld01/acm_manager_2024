"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  TrendingUp,
  Target,
  Users,
  Search,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import { AccountBalances } from "@/components/AccountBalances";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";

interface AccountBalance {
  accountName: string;
  balance: number;
}

interface LocationData {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation?: string;
  city?: string;
  state?: string;
  dailyRentals: number;
  weeklyRentals: number;
  monthlyRentals: number;
  monthlyNetRentals: number;
  unitOccupancy: number;
  rentalGoal: number;
  accountBalances?: AccountBalance[];
}

interface DashboardResponse {
  response: LocationData[];
  lastUpdated: string;
}

type SortOption =
  | "dailyRentals"
  | "monthlyRentals"
  | "monthlyNetRentals"
  | "facilityName"
  | "unitOccupancy";

type SortDirection = "asc" | "desc";

type BadgeVariant = "default" | "secondary" | "destructive";

function getGoalBadgeVariant(
  percent: number,
  monthPercent: number
): BadgeVariant {
  if (percent >= monthPercent) return "default";
  if (percent >= monthPercent * 0.8) return "secondary";
  return "destructive";
}

function OccupancyBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const variant: BadgeVariant =
    value >= 0.9 ? "default" : value >= 0.75 ? "secondary" : "destructive";
  return (
    <Badge variant={variant} className="text-xs tabular-nums">
      {pct}% occupied
    </Badge>
  );
}

export default function DashboardPage() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    userFacilities,
    isAdmin,
  } = useAuth();
  const [dashboardData, setDashboardData] = useState<LocationData[] | null>(null);
  const [dataLastUpdated, setDataLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("dailyRentals");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data: DashboardResponse = await response.json();
        setDashboardData(data.response);
        setDataLastUpdated(data.lastUpdated);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const filteredAndSortedLocations = useMemo((): LocationData[] => {
    if (!dashboardData) return [];
    let filtered = dashboardData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = dashboardData.filter(
        (loc) =>
          loc.facilityName?.toLowerCase().includes(q) ||
          loc.facilityAbbreviation?.toLowerCase().includes(q) ||
          loc.sitelinkId?.toString().includes(q) ||
          loc.city?.toLowerCase().includes(q) ||
          loc.state?.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortBy) {
        case "dailyRentals":     aVal = a.dailyRentals ?? 0;      bVal = b.dailyRentals ?? 0;      break;
        case "monthlyRentals":   aVal = a.monthlyRentals ?? 0;    bVal = b.monthlyRentals ?? 0;    break;
        case "monthlyNetRentals":aVal = a.monthlyNetRentals ?? 0; bVal = b.monthlyNetRentals ?? 0; break;
        case "unitOccupancy":    aVal = a.unitOccupancy ?? 0;     bVal = b.unitOccupancy ?? 0;     break;
        case "facilityName":     aVal = a.facilityName ?? "";     bVal = b.facilityName ?? "";     break;
        default:                 aVal = a.dailyRentals ?? 0;      bVal = b.dailyRentals ?? 0;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [dashboardData, searchQuery, sortBy, sortDirection]);

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("desc");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Locations Overview</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated || !dashboardData) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Locations Overview</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    );
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthPercent = now.getDate() / daysInMonth;

  return (
    <div className="space-y-4">
      {/* Page header band */}
      <div className="bg-muted/60 border-b border-border px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-primary">Locations Overview</h1>
          {dataLastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {dataLastUpdated}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? `Admin — all ${dashboardData.length} facilities`
            : userFacilities.length > 0
            ? `Your facilities: ${userFacilities.map((f) => f.facilityAbbreviation).join(", ")}`
            : "No facilities assigned"}
        </p>

        {/* Search + sort toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search facilities…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={sortBy}
            onValueChange={(v: SortOption) => handleSortChange(v)}
          >
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dailyRentals">Daily Rentals</SelectItem>
              <SelectItem value="monthlyRentals">Monthly Rentals</SelectItem>
              <SelectItem value="monthlyNetRentals">Net Rentals</SelectItem>
              <SelectItem value="unitOccupancy">Occupancy</SelectItem>
              <SelectItem value="facilityName">Name</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="h-9 w-9 p-0"
          >
            {sortDirection === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {filteredAndSortedLocations.length} / {dashboardData.length}
        </span>
        </div>{/* end toolbar */}
      </div>{/* end header band */}

      {/* Cards grid */}
      <div className="px-6 pb-6">
      {filteredAndSortedLocations.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `No facilities match "${searchQuery}"`
              : "No facilities available"}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-3"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredAndSortedLocations.map((loc) => {
            const goal = loc.rentalGoal ?? 1;
            const monthly = loc.monthlyRentals ?? 0;
            const goalPct = Math.round((monthly / goal) * 100);
            const badgeVariant = getGoalBadgeVariant(monthly / goal, monthPercent);

            return (
              <Card key={loc.sitelinkId} className="flex flex-col">
                {/* Header: name + occupancy */}
                <CardHeader className="pb-2 pt-3 px-3 bg-muted/60 rounded-t-lg">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                      {loc.facilityName}
                    </CardTitle>
                    <OccupancyBadge value={loc.unitOccupancy ?? 0} />
                  </div>
                </CardHeader>

                <Separator />

                {/* Stats */}
                <div className="px-3 py-2 flex-1 space-y-2">
                  {/* Daily / Weekly */}
                  <div className="grid grid-cols-2 gap-x-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Daily</p>
                      <p className="font-semibold tabular-nums">{loc.dailyRentals}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weekly</p>
                      <p className="font-semibold tabular-nums">{loc.weeklyRentals}</p>
                    </div>
                  </div>

                  {/* Monthly goal progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Monthly</span>
                      <span className="text-muted-foreground">
                        {monthly} / {goal}
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(goalPct, 100)}%` }}
                      />
                      <div
                        className="absolute top-0 h-full w-0.5 bg-primary/30"
                        style={{ left: `${Math.min(monthPercent * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={badgeVariant} className="text-xs px-1.5 py-0">
                        {goalPct}% of goal
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(monthPercent * 100)}% of month)
                      </span>
                    </div>
                  </div>

                  {/* Net */}
                  <div className="text-sm">
                    <span className="text-xs text-muted-foreground">Net MTD: </span>
                    <span className="font-medium tabular-nums">{loc.monthlyNetRentals}</span>
                  </div>

                  {/* Account balances (admin only) */}
                  <AccountBalances accountBalances={loc.accountBalances || []} />
                </div>

                <Separator />

                {/* Action links */}
                <CardFooter className="px-3 py-2 gap-1.5 flex-wrap">
                  <Button variant="default" size="sm" asChild className="h-7 text-xs px-2">
                    <Link href={`/location/${loc.sitelinkId}`}>Details</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                    <Link href={`/payroll/${loc.sitelinkId}`}>Payroll</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                    <Link href={`/dailyPaymentsTable/${loc.sitelinkId}`}>Deposits</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2">
                    <Link href={`/monthlyCompare/deposits/${loc.sitelinkId}`}>Income</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      </div>{/* end cards px-6 */}
    </div>
  );
}
