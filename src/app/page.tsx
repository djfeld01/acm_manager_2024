"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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

// Types for dashboard data
interface AccountBalance {
  accountName: string;
  balance: number;
  // Add other account balance properties as needed
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

interface UserFacility {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
}

// Sort options for location cards
type SortOption =
  | "dailyRentals"
  | "monthlyRentals"
  | "monthlyNetRentals"
  | "facilityName"
  | "unitOccupancy";

type SortDirection = "asc" | "desc";

type BadgeVariant = "default" | "secondary" | "destructive";

// Helper for color coding goal completion
function getGoalBadgeVariant(
  percent: number,
  monthPercent: number
): BadgeVariant {
  if (percent >= monthPercent) return "default";
  if (percent >= monthPercent * 0.8) return "secondary";
  return "destructive";
}

/**
 * Main dashboard page component that displays location cards with rental data.
 * Includes search and sorting functionality for managing multiple facilities.
 *
 * Features:
 * - Search by facility name, abbreviation, Sitelink ID, city, or state
 * - Sort by daily rentals, monthly rentals, net rentals, occupancy, or name
 * - Real-time filtering and sorting
 * - Responsive design for mobile and desktop
 */
export default function DashboardPage() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    userFacilities,
    isAdmin,
  } = useAuth();
  const [dashboardData, setDashboardData] = useState<LocationData[] | null>(
    null
  );
  const [dataLastUpdated, setDataLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("dailyRentals");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data: DashboardResponse = await response.json();
        setDashboardData(data.response);
        setDataLastUpdated(data.lastUpdated);
      } catch (error: unknown) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Filter and sort locations - moved outside conditional returns
  const filteredAndSortedLocations = useMemo((): LocationData[] => {
    if (!dashboardData) return [];

    let filtered: LocationData[] = dashboardData;

    // Apply fuzzy search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = dashboardData.filter(
        (loc: LocationData) =>
          loc.facilityName?.toLowerCase().includes(query) ||
          loc.facilityAbbreviation?.toLowerCase().includes(query) ||
          loc.sitelinkId?.toString().includes(query) ||
          loc.city?.toLowerCase().includes(query) ||
          loc.state?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a: LocationData, b: LocationData) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "dailyRentals":
          aValue = a.dailyRentals ?? 0;
          bValue = b.dailyRentals ?? 0;
          break;
        case "monthlyRentals":
          aValue = a.monthlyRentals ?? 0;
          bValue = b.monthlyRentals ?? 0;
          break;
        case "monthlyNetRentals":
          aValue = a.monthlyNetRentals ?? 0;
          bValue = b.monthlyNetRentals ?? 0;
          break;
        case "unitOccupancy":
          aValue = a.unitOccupancy ?? 0;
          bValue = b.unitOccupancy ?? 0;
          break;
        case "facilityName":
          aValue = a.facilityName ?? "";
          bValue = b.facilityName ?? "";
          break;
        default:
          aValue = a.dailyRentals ?? 0;
          bValue = b.dailyRentals ?? 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [dashboardData, searchQuery, sortBy, sortDirection]);

  // Toggle sort direction when clicking the same sort option
  const handleSortChange = (newSortBy: SortOption): void => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("desc"); // Default to descending for new sorts
    }
  };

  // Clear search
  const clearSearch = (): void => {
    setSearchQuery("");
  };

  if (authLoading) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Locations Overview</h1>
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Locations Overview</h1>
        <div className="text-center">Please sign in to view the dashboard.</div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Locations Overview</h1>
        <div className="text-center">Loading dashboard data...</div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Locations Overview</h1>
        <div className="text-center">No data available</div>
      </main>
    );
  }

  const response: LocationData[] = dashboardData || [];
  const now: Date = new Date();
  const daysInMonth: number = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const today: number = now.getDate();
  const monthPercent: number = today / daysInMonth;

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Locations Overview</h1>

      {/* User facility access summary */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          {isAdmin ? (
            <span className="font-semibold">Admin Access: </span>
          ) : (
            <span className="font-semibold">Your Facilities: </span>
          )}
          {isAdmin
            ? `Viewing all ${response.length} facilities`
            : userFacilities.length > 0
            ? userFacilities.map((f) => f.facilityAbbreviation).join(", ")
            : "No facilities assigned"}
        </p>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">
            Data Last Updated: {dataLastUpdated}{" "}
          </span>
        </p>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 space-y-3">
        {/* Main Controls Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search facilities, cities, or states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => handleSortChange(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dailyRentals">Daily Rentals</SelectItem>
                <SelectItem value="monthlyRentals">Monthly Rentals</SelectItem>
                <SelectItem value="monthlyNetRentals">Net Rentals</SelectItem>
                <SelectItem value="unitOccupancy">Occupancy</SelectItem>
                <SelectItem value="facilityName">Facility Name</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="px-2"
            >
              {sortDirection === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Hint */}
        <div className="text-xs text-gray-400">
          💡 Search by name, abbreviation, city, state, or Sitelink ID
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredAndSortedLocations.length} of{" "}
            {response?.length || 0} facilities
            {searchQuery && (
              <span className="ml-2 text-blue-600">
                (filtered by &ldquo;{searchQuery}&rdquo;)
              </span>
            )}
          </span>
          <span>
            Sorted by {sortBy.replace(/([A-Z])/g, " $1").toLowerCase()} (
            {sortDirection === "asc" ? "ascending" : "descending"})
          </span>
        </div>
      </div>

      {filteredAndSortedLocations.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No facilities found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? (
              <>
                No facilities match &ldquo;{searchQuery}&rdquo;. Try searching
                by facility name, city, state, or abbreviation.
              </>
            ) : (
              "No facilities available to display."
            )}
          </p>
          {searchQuery && (
            <Button onClick={clearSearch} variant="outline">
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {filteredAndSortedLocations.map((loc: LocationData) => {
            const monthlyGoal: number = loc.rentalGoal ?? 1;
            const monthlyRentals: number = loc.monthlyRentals ?? 0;
            const goalPercent: number = Math.round(
              (monthlyRentals / monthlyGoal) * 100
            );
            const badgeVariant: BadgeVariant = getGoalBadgeVariant(
              monthlyRentals / monthlyGoal,
              monthPercent
            );

            return (
              <Card
                key={loc.sitelinkId}
                className="p-1 transition-all group-hover:shadow-xl group-hover:border-blue-400 border-2 border-gray-400 bg-white/90 cursor-pointer"
              >
                <CardHeader className="pb-1">
                  <div className="flex items-center gap-2 w-full">
                    <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
                    <CardTitle className="text-lg truncate w-full">
                      {loc.facilityName}
                    </CardTitle>
                  </div>
                  <div className="mt-1 flex justify-start">
                    <Badge
                      variant={
                        (loc.unitOccupancy ?? 0) >= 0.9
                          ? "default"
                          : (loc.unitOccupancy ?? 0) >= 0.75
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {Math.round((loc.unitOccupancy ?? 0) * 100)}% Occupied
                    </Badge>
                  </div>
                </CardHeader>
                <Separator />

                {/* Group 1: Daily & Weekly Rentals */}
                <div className="bg-gray-100 rounded-lg p-2 mb-1 flex gap-4 items-center justify-between">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">Daily Rentals:</span>
                    <span className="font-semibold text-base">
                      {loc.dailyRentals}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">Weekly Rentals:</span>
                    <span className="font-semibold text-base">
                      {loc.weeklyRentals}
                    </span>
                  </div>
                </div>

                {/* Group 2: Monthly Rentals & Goal, % Completed */}
                <div className="bg-gray-200 rounded-lg p-2 mb-1">
                  <div className="flex items-center gap-4 mb-1 justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-xs">Monthly Rentals:</span>
                      <span className="font-semibold text-base">
                        {monthlyRentals}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-xs">Goal:</span>
                      <span className="font-semibold text-base">
                        {monthlyGoal}
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar Chart */}
                  <div className="relative h-3 w-full bg-gray-300 rounded overflow-hidden mt-1 mb-1">
                    {/* Progress so far */}
                    <div
                      className="absolute left-0 top-0 h-full rounded bg-green-500 transition-all"
                      style={{ width: `${Math.min(goalPercent, 100)}%` }}
                    />
                    {/* On pace marker */}
                    <div
                      className="absolute top-0 h-full border-l-4 border-blue-600"
                      style={{ left: `${Math.min(monthPercent * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={badgeVariant} className="text-xs">
                      {goalPercent}% of Goal
                    </Badge>
                    <span className="text-xs text-gray-500">
                      ({Math.round(monthPercent * 100)}% month)
                    </span>
                  </div>
                </div>

                {/* Group 3: Net Rentals */}
                <div className="bg-gray-300 rounded-lg p-2 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs">Monthly Net:</span>
                  <span className="font-semibold text-xs">
                    {loc.monthlyNetRentals}
                  </span>
                </div>

                {/* Account Balances - Only show for users who can manage finances */}
                <AccountBalances accountBalances={loc.accountBalances || []} />

                <Separator />
                <CardFooter className="flex justify-between items-center pt-1">
                  <div className="flex gap-2">
                    <Link
                      href={`/payroll/${loc.sitelinkId}`}
                      className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
                    >
                      Payroll
                    </Link>
                    <Link
                      href={`/dailyPaymentsTable/${loc.sitelinkId}`}
                      className="px-2 py-1 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition"
                    >
                      Deposits
                    </Link>
                    <Link
                      href={`/monthlyCompare/deposits/${loc.sitelinkId}`}
                      className="px-2 py-1 rounded bg-orange-700 text-white text-xs font-medium hover:bg-orange-800 transition"
                    >
                      Income Compare
                    </Link>
                    {/* <Link
                    href={`/monthlyCompare/activity/${loc.sitelinkId}`}
                    className="px-2 py-1 rounded bg-orange-700 text-white text-xs font-medium hover:bg-orange-800 transition"
                  >
                    Activity Compare
                  </Link> */}
                  </div>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
