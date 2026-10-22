"use client";
import { useEffect, useState } from "react";
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
import { TrackingTab } from "./TrackingTab";
import { IncomeOutlookTab } from "./IncomeOutlookTab";
import { PastIncreasesTab } from "./PastIncreasesTab";
import type { Breakdown } from "./Breakdown";
import { STREET_BASIS_LABEL, type StreetBasis } from "../_lib/street";

const STREET_KEY = "rateInc.streetBasis";

const STALE_AFTER_DAYS = 3;

/** One store's workspace. Keyed by store in the parent, so switching stores
 *  starts everything fresh (no batch or filter carried over from the other store). */
function FacilityWorkspace({ sitelinkId }: { sitelinkId: string }) {
  const [by, setBy] = useState<Breakdown>("type");
  // Which rate counts as street. Remembered in this browser as a convenience.
  const [street, setStreetState] = useState<StreetBasis>("standard");
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STREET_KEY) === "push")
        setStreetState("push");
    } catch {
      /* storage can be unavailable; the default is fine */
    }
  }, []);
  const setStreet = (basis: StreetBasis) => {
    setStreetState(basis);
    try {
      window.localStorage.setItem(STREET_KEY, basis);
    } catch {
      /* ignore */
    }
  };
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
              <TabsTrigger value="outlook">Income Outlook</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="past">Past Increases</TabsTrigger>
              <TabsTrigger value="specials">Specials (review)</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="text-muted-foreground"
                  title="Which rate counts as street when judging whether a tenant is above or below the market"
                >
                  Street rate
                </span>
                <div className="inline-flex rounded-md border p-0.5">
                  {(["standard", "push"] as const).map((k) => (
                    <Button
                      key={k}
                      size="sm"
                      variant={street === k ? "default" : "ghost"}
                      className="h-7 px-3"
                      onClick={() => setStreet(k)}
                    >
                      {STREET_BASIS_LABEL[k]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
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
          </div>
          <TabsContent value="street" className="space-y-6 pt-4">
            <StreetPositionTab
              sitelinkId={sitelinkId}
              by={by}
              street={street}
            />
          </TabsContent>
          <TabsContent value="stay" className="space-y-6 pt-4">
            <StayAnalysisTab sitelinkId={sitelinkId} by={by} />
          </TabsContent>
          <TabsContent value="demand" className="space-y-6 pt-4">
            <DemandTab sitelinkId={sitelinkId} by={by} />
          </TabsContent>
          <TabsContent value="batch" className="space-y-6 pt-4">
            <BatchBuilderTab
              sitelinkId={sitelinkId}
              facilityName={status.facilityName}
              by={by}
              street={street}
              onStreetChange={setStreet}
            />
          </TabsContent>
          <TabsContent value="outlook" className="space-y-6 pt-4">
            <IncomeOutlookTab sitelinkId={sitelinkId} street={street} />
          </TabsContent>
          <TabsContent value="tracking" className="space-y-6 pt-4">
            <TrackingTab sitelinkId={sitelinkId} by={by} />
          </TabsContent>
          <TabsContent value="past" className="space-y-6 pt-4">
            <PastIncreasesTab by={by} />
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

export interface FacilityChoice {
  id: string;
  name: string;
}

export function RateIncreasesClient({
  facilities,
  initialSitelinkId,
}: {
  facilities: FacilityChoice[];
  initialSitelinkId: string;
}) {
  const [site, setSite] = useState(initialSitelinkId);

  function choose(id: string) {
    setSite(id);
    // Remember the store in the address so a reload or a shared link opens it.
    const url = new URL(window.location.href);
    url.searchParams.set("site", id);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="space-y-6">
      {facilities.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Store</span>
          {facilities.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={f.id === site ? "default" : "outline"}
              onClick={() => choose(f.id)}
            >
              {f.name}
            </Button>
          ))}
        </div>
      )}
      <FacilityWorkspace key={site} sitelinkId={site} />
    </div>
  );
}
