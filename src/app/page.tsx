"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, TrendingUp, Target, Users } from "lucide-react";
import { AccountBalances } from "@/components/AccountBalances";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

// Helper for color coding goal completion
function getGoalBadgeVariant(percent: number, monthPercent: number) {
  if (percent >= monthPercent) return "default";
  if (percent >= monthPercent * 0.8) return "secondary";
  return "destructive";
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, userFacilities, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data.response);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

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

  const response = dashboardData;
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const today = now.getDate();
  const monthPercent = today / daysInMonth;

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
              ? userFacilities.map(f => f.facilityAbbreviation).join(', ')
              : 'No facilities assigned'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {response.map((loc: any) => {
          const monthlyGoal = loc.rentalGoal ?? 1;
          const monthlyRentals = loc.monthlyRentals ?? 0;
          const goalPercent = Math.round((monthlyRentals / monthlyGoal) * 100);
          const badgeVariant = getGoalBadgeVariant(
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
                </div>
                <Users className="h-4 w-4 text-gray-400" />
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
