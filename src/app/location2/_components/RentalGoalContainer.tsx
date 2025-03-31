import { getRentalGoalData } from "@/app/actions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import React from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
} from "recharts";
import RentalGoalChart from "./RentalGoalChart";
type RentalGoalContainerProps = {
  facilityId: string;
};
async function RentalGoalContainer({ facilityId }: RentalGoalContainerProps) {
  const rentalGoalData = await getRentalGoalData(facilityId);
  const rentalGoal = rentalGoalData?.rentalGoal || 0;
  const monthlyRentals = rentalGoalData?.monthlyRentals || 0;

  const percentageToGoal = (monthlyRentals / rentalGoal) * 100;

  return (
    // <Card className="w-full">
    //   <CardHeader className="text-center p-2">
    //     <CardTitle>Rentals Progress</CardTitle>
    //   </CardHeader>
    //   <CardContent className="p-1">
    <div className="h-40 w-full">
      <RentalGoalChart
        rentalGoal={rentalGoal}
        monthlyRentals={monthlyRentals}
      />
    </div>
    //   </CardContent>
    //   <CardFooter className="flex flex-col items-center  text-sm">
    //     <div className="flex items-center gap-1 font-medium">
    //       {percentageToGoal.toFixed(1)}% of goal reached
    //       <TrendingUp className="h-4 w-4 text-primary" />
    //     </div>
    //     <div className="text-muted-foreground">
    //       {rentalGoal - monthlyRentals} more rentals to reach the goal
    //     </div>
    //   </CardFooter>
    // </Card>
  );
}

export default RentalGoalContainer;
