"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Pencil, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import {
  addCompetitorToFacility,
  updateCompetitor,
  deleteCompetitor,
  scrapeCompetitorNow,
  type FacilityWithCompetitors,
  type CompetitorRow,
  type CompetitorFormData,
} from "@/lib/controllers/competitorController";
import { CompetitorFormDialog } from "./CompetitorFormDialog";

interface Props {
  facilities: FacilityWithCompetitors[];
}

type DialogState =
  | { mode: "add"; facilityId: string }
  | { mode: "edit"; competitor: CompetitorRow }
  | null;

function formatDate(d: Date | null | undefined) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CompetitorsClient({ facilities }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [scrapingId, setScrapingId] = useState<number | null>(null);

  async function handleSubmit(data: CompetitorFormData) {
    if (!dialog) return;
    if (dialog.mode === "add") {
      await addCompetitorToFacility(dialog.facilityId, data);
      toast.success(`Added ${data.name}`);
    } else {
      await updateCompetitor(dialog.competitor.competitorId, data);
      toast.success(`Updated ${data.name}`);
    }
    router.refresh();
  }

  async function handleDelete(competitorId: number, name: string) {
    await deleteCompetitor(competitorId);
    toast.success(`Removed ${name}`);
    router.refresh();
  }

  async function handleScrape(competitorId: number, name: string) {
    setScrapingId(competitorId);
    try {
      const result = await scrapeCompetitorNow(competitorId);
      if (result.success) {
        toast.success(`${name}: found ${result.unitsFound} units`);
      } else {
        toast.error(`${name}: ${result.error}`);
      }
      router.refresh();
    } finally {
      setScrapingId(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {facilities.map((facility) => (
          <Card key={facility.sitelinkId}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">{facility.facilityName}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDialog({ mode: "add", facilityId: facility.sitelinkId })
                }
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </CardHeader>
            <CardContent>
              {facility.competitors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No competitors added yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Pricing URL</TableHead>
                      <TableHead>Scrape</TableHead>
                      <TableHead>Last Scraped</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facility.competitors.map((c) => (
                      <TableRow key={c.competitorId}>
                        <TableCell>
                          <div className="font-medium">{c.name}</div>
                          {c.chain && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {c.chain}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[c.streetAddress, c.city, c.state]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.phone || "—"}
                        </TableCell>
                        <TableCell>
                          {c.scrapeUrl ? (
                            <a
                              href={c.scrapeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View page
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.scrapeEnabled ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {c.scrapeEnabled ? "On" : "Off"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(c.lastScrapedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {c.scrapeUrl && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Scrape now"
                                disabled={scrapingId === c.competitorId}
                                onClick={() =>
                                  handleScrape(c.competitorId, c.name)
                                }
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${scrapingId === c.competitorId ? "animate-spin" : ""}`}
                                />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Edit"
                              onClick={() =>
                                setDialog({ mode: "edit", competitor: c })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Delete"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove {c.name}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this competitor
                                    and all scraped price data. This cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() =>
                                      handleDelete(c.competitorId, c.name)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <CompetitorFormDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onSubmit={handleSubmit}
        defaultValues={dialog?.mode === "edit" ? dialog.competitor : undefined}
        title={dialog?.mode === "edit" ? "Edit Competitor" : "Add Competitor"}
      />
    </>
  );
}
