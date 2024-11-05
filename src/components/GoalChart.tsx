"use client";
import { TrendingUp } from "lucide-react";
import {
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GoalChartProps {
  rentalGoal: number;
  monthlyRentals: number;
  facilityName: string;
}
export default function GoalChart({
  monthlyRentals,
  rentalGoal,
  facilityName,
}: GoalChartProps) {
  const percentageToGoal = (monthlyRentals / rentalGoal) * 100;
  const endAngle = (percentageToGoal / 100) * 360;

  const chartData = [
    { name: "rentals", value: monthlyRentals, fill: "hsl(var(--primary))" },
  ];

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle>{facilityName}</CardTitle>
        <CardDescription>Monthly Rentals Progress</CardDescription>
        <CardDescription>Towards {rentalGoal} Goal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="100%"
              barSize={50}
              data={chartData}
              startAngle={0}
              endAngle={endAngle}
            >
              <PolarGrid gridType="circle" radialLines={false} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={4}
                fill="hsl(var(--primary))"
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-primary text-4xl font-bold"
              >
                {monthlyRentals}
              </text>
              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-sm"
              >
                /{rentalGoal} Rentals
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium">
          {percentageToGoal.toFixed(1)}% of goal reached
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div className="text-muted-foreground">
          {rentalGoal - monthlyRentals} more rentals to reach the goal
        </div>
      </CardFooter>
    </Card>
  );
}
