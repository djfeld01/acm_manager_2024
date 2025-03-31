"use client";
import { TrendingUp } from "lucide-react";
import {
  Label,
  LabelList,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
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

const chartConfig = {
  rentals: {
    label: "Rentals",
  },
  actualRentals: {
    label: "Actual Rentals",
    color: "hsl(var(--chart-1))",
  },
  expectedRentals: {
    label: "Expected Rentals",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

type RentalGoalChartProps = { rentalGoal: number; monthlyRentals: number };
export default function RentalGoalChart({
  rentalGoal,
  monthlyRentals,
}: RentalGoalChartProps) {
  const percentageToGoal = (monthlyRentals / 25) * 100;
  const endAngle = (percentageToGoal / 100) * 360;

  const chartData = [
    {
      rentalType: "actualRentals",
      rentals: monthlyRentals,
      fill: "var(--color-actualRentals)",
    },
    {
      rentalType: "expectedRentals",
      rentals: 2,
      fill: "var(--color-expectedRentals)",
    },
  ];
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0"></CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={endAngle}
            innerRadius={90}
            outerRadius={110}
          >
            {/* <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            /> */}
            <RadialBar dataKey="rentals" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-4xl font-bold"
                        >
                          {chartData[0].rentals.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Rentals
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="rentalType" />}
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
