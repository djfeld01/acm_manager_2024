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
    <Card className="w-full">
      <CardHeader className="text-center p-2">
        <CardTitle>Rentals Progress</CardTitle>
      </CardHeader>
      <CardContent className="p-1">
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="35%"
              innerRadius="65%"
              outerRadius="100%"
              barSize={70}
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
                y="25%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-primary text-2xl font-bold"
              >
                {monthlyRentals}
              </text>
              <text
                x="50%"
                y="40%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-base"
              >
                /{rentalGoal} Rentals
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center  text-sm">
        <div className="flex items-center gap-1 font-medium">
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
