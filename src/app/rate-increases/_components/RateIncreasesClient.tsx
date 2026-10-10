"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSnapshotStatus } from "../actions/getSnapshotStatus";
import { RentRollUpload } from "./RentRollUpload";
import { StreetPositionTab } from "./StreetPositionTab";
import { StayAnalysisTab } from "./StayAnalysisTab";
import { DemandTab } from "./DemandTab";
import { SpecialsTab } from "./SpecialsTab";
import { BatchBuilderTab } from "./BatchBuilderTab";
import type { Breakdown } from "./Breakdown";

const STALE_AFTER_DAYS = 3;

export function RateIncreasesClient({ sitelinkId }: { sitelinkId: string }) {
  const [by, setBy] = useState<Breakdown>("type");
  const {
    data: status,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rateInc", "status", sitelinkId],
    queryFn: () => getSnapshotStatus(sitelinkId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading…
      </div>
    );
  }
  if (error || !status) {
    return (
      <div className="text-sm text-destructive flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {error instanceof Error
          ? error.message
          : "Could not load rate increase data."}
      </div>
    );
  }

  const stale = status.ageDays != null && status.ageDays > STALE_AFTER_DAYS;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">{status.facilityName}</h2>
            {status.latestDate ? (
              <>
                <Badge variant="secondary">
                  Rent roll as of {status.latestDate}
                </Badge>
                {stale && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {status.ageDays} days old — upload a fresh rent roll
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {status.snapshots.length} snapshot
                  {status.snapshots.length !== 1 ? "s" : ""} stored
                </span>
              </>
            ) : (
              <Badge variant="outline">No rent roll uploaded yet</Badge>
            )}
          </div>
          <RentRollUpload
            sitelinkId={sitelinkId}
            facilityName={status.facilityName}
          />
        </CardContent>
      </Card>

      {status.latestDate ? (
        <Tabs defaultValue="street">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="street">Street-Rate Position</TabsTrigger>
              <TabsTrigger value="stay">
                Length of Stay &amp; Move-Outs
              </TabsTrigger>
              <TabsTrigger value="demand">Marketing &amp; Demand</TabsTrigger>
              <TabsTrigger value="batch">Batch Builder</TabsTrigger>
            <TabsTrigger value="specials">Specials (review)</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Break down by</span>
              <div className="inline-flex rounded-md border p-0.5">
                {(["type", "size"] as const).map((k) => (
                  <Button
                    key={k}
                    size="sm"
                    variant={by === k ? "default" : "ghost"}
                    className="h-7 px-3"
                    onClick={() => setBy(k)}
                  >
                    {k === "type" ? "Unit type" : "Size"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <TabsContent value="street" className="space-y-6 pt-4">
            <StreetPositionTab sitelinkId={sitelinkId} by={by} />
          </TabsContent>
          <TabsContent value="stay" className="space-y-6 pt-4">
            <StayAnalysisTab sitelinkId={sitelinkId} by={by} />
          </TabsContent>
          <TabsContent value="demand" className="space-y-6 pt-4">
            <DemandTab sitelinkId={sitelinkId} by={by} />
          </TabsContent>
          <TabsContent value="batch" className="space-y-6 pt-4">
            <BatchBuilderTab sitelinkId={sitelinkId} by={by} />
          </TabsContent>
          <TabsContent value="specials" className="space-y-6 pt-4">
            <SpecialsTab sitelinkId={sitelinkId} />
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-sm text-muted-foreground">
          Upload a SiteLink rent roll (.txt) to see street-rate position, length
          of stay, and demand health for {status.facilityName}.
        </p>
      )}
    </div>
  );
}
