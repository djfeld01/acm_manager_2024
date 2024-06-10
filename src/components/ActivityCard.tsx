import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface activityProps {
  facilityAbbreviation: string;
  totalRentals: number;
}

export default function ActivityCard({
  facilityAbbreviation,
  totalRentals,
}: activityProps) {
  return (
    <Card x-chunk="dashboard-01-chunk-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {facilityAbbreviation}
        </CardTitle>
        {/* <DollarSign className="h-4 w-4 text-muted-foreground" /> */}
      </CardHeader>
      <CardContent>
        {/* <div className="text-xl">{data[0].activities[0].dateRange}</div> */}
        <div className="text-xl">Move-Ins</div>
        <div className="text-2xl font-bold">{totalRentals}</div>
      </CardContent>
    </Card>
  );
}
