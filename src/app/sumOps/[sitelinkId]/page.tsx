import { Card } from "@/components/ui/card";
import React from "react";
import ActivitySummary from "../components/ActivitySummary";
import Receivables from "../components/Receivables";
import DollarOccupancy from "../components/DollarOccupancy";
import Discounts from "../components/Discounts";
import UnitOccupancy from "../components/UnitOccupancy";
import SquareFootageOccupancy from "../components/SquareFootageOccupancy";
import { useParams } from "next/navigation";

async function sumOps({ params }: { params: Promise<{ sitelinkId: string }> }) {
  const sitelinkId = (await params).sitelinkId;

  return (
    <Card>
      <ActivitySummary sitelinkId={sitelinkId} />
      <Receivables />
      <DollarOccupancy />
      <Discounts />
      <UnitOccupancy />
      <SquareFootageOccupancy />
    </Card>
  );
}

export default sumOps;
