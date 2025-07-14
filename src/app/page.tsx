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
import { getDashboardData } from "@/lib/controllers/manSumController";
import { Building2, TrendingUp, Target, Users } from "lucide-react";

// Helper for color coding goal completion
function getGoalBadgeVariant(percent: number, monthPercent: number) {
  if (percent >= monthPercent) return "default";
  if (percent >= monthPercent * 0.8) return "secondary";
  return "destructive";
}

export default async function DashboardPage() {
  const { response } = await getDashboardData();
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {response.map((loc) => {
          const monthlyGoal = loc.rentalGoal ?? 1;
          const monthlyRentals = loc.monthlyRentals ?? 0;
          const goalPercent = Math.round((monthlyRentals / monthlyGoal) * 100);
          const badgeVariant = getGoalBadgeVariant(
            monthlyRentals / monthlyGoal,
            monthPercent
          );

          return (
            <Link
              key={loc.sitelinkId}
              href={`/locations/${loc.sitelinkId}`}
              className="group"
            >
              <Card className="p-3 transition-all group-hover:shadow-xl group-hover:border-blue-400 border-2 border-gray-400 bg-white/90 cursor-pointer">
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
                    <span className="text-xs">Daily:</span>
                    <span className="font-semibold text-base">
                      {loc.dailyRentals}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">Weekly:</span>
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
                      <span className="text-xs">Monthly:</span>
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
                  <span className="text-xs">Net:</span>
                  <span className="font-semibold text-xs">
                    {loc.monthlyNetRentals}
                  </span>
                </div>

                <Separator />
                <CardFooter className="flex justify-between items-center pt-1">
                  <span className="text-blue-600 group-hover:underline font-medium text-xs">
                    View Details →
                  </span>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
