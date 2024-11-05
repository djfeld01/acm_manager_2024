"use client";

import { LineChart, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "./ui/button";
import { useState } from "react";

export const description = "A bar chart";

// const chartData = [
//   { month: "January", desktop: 186 },
//   { month: "February", desktop: 305 },
//   { month: "March", desktop: 237 },
//   { month: "April", desktop: 73 },
//   { month: "May", desktop: 209 },
//   { month: "June", desktop: 214 },
//   { month: "July", desktop: 400 },
//   { month: "August", desktop: 700 },
// ];

interface ActivityTypes {
  [year: string]: { month: number; activity: number }[];
}
interface Location {
  facilityAbbreviation: string;
  facilityName: string;
  facilityId: string;
  activityTypes: {
    [activityType: string]: ActivityTypes;
  };
}
interface ActivityProps {
  location: Location;
  todaysRentals: number;
}
const chartConfig = {
  activity: {
    label: "Activity",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function BarChartComponent({ location, todaysRentals }: ActivityProps) {
  const [Activity, setActivity] = useState("MoveIn");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{location.facilityName}</CardTitle>
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Button onClick={() => setActivity("MoveIn")}>Move Ins</Button>
          <Button onClick={() => setActivity("MoveOut")}>Move Outs</Button>
          {/* <Button onClick={() => setActivity("Net")}>Net</Button> */}
        </div>
        <div>{Activity}</div>
        <CardDescription>January - October 2024</CardDescription>
      </CardHeader>

      <CardContent>
        <div>Daily Rentals: {todaysRentals}</div>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={location.activityTypes[Activity][2024]}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis tickLine={true} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="activity" fill="var(--chart1)" radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {/* <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div> */}
      </CardFooter>
    </Card>
  );
}
