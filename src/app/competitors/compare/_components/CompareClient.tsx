"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload } from "lucide-react";
import {
  getComparisonData,
  importRateCard,
  type ComparisonRow,
} from "@/lib/controllers/rateCardController";

interface Props {
  facilities: { sitelinkId: string; facilityName: string }[];
}

function fmt(n: number | null) {
  if (n === null) return "—";
  return `$${n.toFixed(2)}`;
}

function DeltaBadge({
  ourRate,
  competitorRate,
}: {
  ourRate: number | null;
  competitorRate: number | null;
}) {
  if (ourRate === null || competitorRate === null) return null;
  const delta = ourRate - competitorRate;
  if (Math.abs(delta) < 1) return null;
  const color =
    delta > 0
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  const label = delta > 0 ? `+$${delta.toFixed(0)}` : `-$${Math.abs(delta).toFixed(0)}`;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>
      {label}
    </span>
  );
}

export function CompareClient({ facilities }: Props) {
  const router = useRouter();
  const [facilityId, setFacilityId] = useState<string>("");
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, startUpload] = useTransition();

  async function handleFacilityChange(id: string) {
    setFacilityId(id);
    setLoading(true);
    try {
      const data = await getComparisonData(id);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    startUpload(async () => {
      try {
        const result = await importRateCard(text);
        if (result.unmatched.length > 0) {
          toast.warning(
            `Imported ${result.upserted} rows. Unmatched SiteIDs: ${result.unmatched.join(", ")}`
          );
        } else {
          toast.success(`Imported ${result.upserted} rate rows`);
        }
        if (facilityId) {
          const data = await getComparisonData(facilityId);
          setRows(data);
        }
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      }
    });
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  // Collect unique competitor names across all rows
  const allCompetitors = Array.from(
    new Map(
      rows
        .flatMap((r) => r.competitors)
        .map((c) => [c.competitorId, c])
    ).values()
  );

  const unitTypes = Array.from(new Set(rows.map((r) => r.unitType))).sort();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={facilityId} onValueChange={handleFacilityChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a facility…" />
          </SelectTrigger>
          <SelectContent>
            {facilities.map((f) => (
              <SelectItem key={f.sitelinkId} value={f.sitelinkId}>
                {f.facilityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={uploading}
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Importing…" : "Import Rate Card"}
            </span>
          </Button>
          <input
            type="file"
            accept=".tsv,.csv,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Export the Unit Mix report from SiteLink as tab-separated (.tsv or .txt)
        </p>
      </div>

      {/* No facility selected */}
      {!facilityId && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a facility above to see the price comparison.
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {facilityId && loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      )}

      {/* No rate card yet */}
      {facilityId && !loading && rows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No rate card imported for this facility yet. Use the Import button
            above.
          </CardContent>
        </Card>
      )}

      {/* Comparison tables — one per unit type */}
      {!loading &&
        unitTypes.map((type) => {
          const typeRows = rows.filter((r) => r.unitType === type);
          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{type}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">
                        Our Standard
                      </TableHead>
                      <TableHead className="text-right">Our Web</TableHead>
                      <TableHead className="text-right">
                        Vacant / Total
                      </TableHead>
                      {allCompetitors.map((c) => (
                        <TableHead
                          key={c.competitorId}
                          className="text-right"
                          colSpan={2}
                        >
                          <div className="font-medium">{c.name}</div>
                          {c.chain && (
                            <div className="text-xs font-normal text-muted-foreground">
                              {c.chain}
                            </div>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                    {allCompetitors.length > 0 && (
                      <TableRow className="text-xs text-muted-foreground">
                        <TableHead colSpan={4} />
                        {allCompetitors.map((c) => (
                          <>
                            <TableHead
                              key={`${c.competitorId}-street`}
                              className="text-right"
                            >
                              Street
                            </TableHead>
                            <TableHead
                              key={`${c.competitorId}-web`}
                              className="text-right"
                            >
                              Web
                            </TableHead>
                          </>
                        ))}
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {typeRows.map((row) => (
                      <TableRow key={`${row.unitType}-${row.unitSize}`}>
                        <TableCell className="font-medium">
                          {row.unitSize}
                          {row.pushRateUsed && row.ourPushRate && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-xs"
                            >
                              Push {fmt(row.ourPushRate)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {fmt(row.ourStandardRate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {fmt(row.ourWebRate)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {row.totalVacant ?? "—"} /{" "}
                          {row.totalUnits ?? "—"}
                        </TableCell>
                        {row.competitors.map((c) => (
                          <>
                            <TableCell
                              key={`${c.competitorId}-street`}
                              className="text-right"
                            >
                              <div className="flex items-center justify-end gap-1">
                                {fmt(c.streetRate)}
                                <DeltaBadge
                                  ourRate={row.ourStandardRate}
                                  competitorRate={c.streetRate}
                                />
                              </div>
                            </TableCell>
                            <TableCell
                              key={`${c.competitorId}-web`}
                              className="text-right text-muted-foreground"
                            >
                              {fmt(c.webRate)}
                            </TableCell>
                          </>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}
