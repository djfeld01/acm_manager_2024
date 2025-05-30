import { Card, CardHeader } from "@/components/ui/card";
import React from "react";

type ActivitySummaryProps = {
  sitelinkId: string;
};
function ActivitySummary({ sitelinkId }: ActivitySummaryProps) {
  return (
    <Card>
      <CardHeader>Activity Summary for {sitelinkId}</CardHeader>
    </Card>
  );
}

export default ActivitySummary;
