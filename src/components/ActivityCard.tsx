"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChartComponent } from "./BarChartComponent";
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
interface activityProps {
  facilityAbbreviation: string;
  totalRentals: number;
  location: Location;
}

export default function ActivityCard({
  facilityAbbreviation,
  totalRentals,
  location,
}: activityProps) {
  const [selectedFacility, setSelectedFacility] = useState("");
  return (
    <div>This is nothing</div>
    // <Card
    //   x-chunk="dashboard-01-chunk-0"
    //   onClick={() => setSelectedFacility(facilityAbbreviation)}
    // >
    //   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    //     <CardTitle className="text-sm font-medium">
    //       {facilityAbbreviation}
    //     </CardTitle>
    //     {/* <DollarSign className="h-4 w-4 text-muted-foreground" /> */}
    //   </CardHeader>
    //   <CardContent>
    //     {/* <div className="text-xl">{data[0].activities[0].dateRange}</div> */}
    //     <div className="text-xl">Move-Ins</div>
    //     <div className="text-2xl font-bold">{totalRentals}</div>
    //   </CardContent>
    //<BarChartComponent chartData={location} />
    // </Card>
  );
}
