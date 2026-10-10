"use client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSpecialMappings } from "../actions/getSpecialMappings";
import { TabLoading } from "./Stat";

export function SpecialsTab({ sitelinkId }: { sitelinkId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["rateInc", "specials", sitelinkId],
    queryFn: () => getSpecialMappings(sitelinkId),
  });
  if (!data) return <TabLoading isLoading={isLoading} error={error} />;
  const unparsed = data.filter((d) => d.months === null);
  const total = data.reduce((s, d) => s + d.moveIns, 0);
  const unparsedCount = unparsed.reduce((s, d) => s + d.moveIns, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>How move-in specials are read</CardTitle>
        <CardDescription>
          The first rate increase happens 6 months after a tenant&apos;s special ends, so each special text is
          converted to &quot;months of discount&quot;. Manual, prepay, referral and blank = 0. Please scan this list and
          tell me anything that looks wrong.{" "}
          {unparsed.length === 0
            ? `All ${data.length} variants recognized.`
            : `${unparsed.length} variants (${unparsedCount} of ${total} move-ins) not recognized — treated as no special.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Special text (as entered)</TableHead>
              <TableHead className="text-right">Move-ins</TableHead>
              <TableHead className="text-right">Months of discount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.plan}>
                <TableCell>{d.plan}</TableCell>
                <TableCell className="text-right">{d.moveIns}</TableCell>
                <TableCell className="text-right">
                  {d.months === null ? <Badge variant="destructive">not recognized</Badge> : d.months}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
