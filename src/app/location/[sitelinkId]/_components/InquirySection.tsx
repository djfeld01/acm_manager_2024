import { db } from "@/db";
import { inquiry } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InquiryTable, type InquiryRow } from "./InquiryTable";

export async function InquirySection({ sitelinkId }: { sitelinkId: string }) {
  const rows = await db
    .select({
      id: inquiry.id,
      datePlaced: inquiry.datePlaced,
      inquiryType: inquiry.inquiryType,
      callType: inquiry.callType,
      source: inquiry.source,
      marketingDesc: inquiry.marketingDesc,
      quotedRate: inquiry.quotedRate,
      rentalType: inquiry.rentalType,
      leaseDate: inquiry.leaseDate,
      cancelDate: inquiry.cancelDate,
      comment: inquiry.comment,
    })
    .from(inquiry)
    .where(eq(inquiry.sitelinkId, sitelinkId))
    .orderBy(desc(inquiry.datePlaced))
    .limit(15);

  const tableRows: InquiryRow[] = rows.map((r) => ({
    id: r.id,
    datePlaced: r.datePlaced ? r.datePlaced.toISOString() : null,
    inquiryType: r.inquiryType,
    callType: r.callType,
    source: r.source,
    marketingDesc: r.marketingDesc,
    quotedRate: r.quotedRate,
    rentalType: r.rentalType,
    leaseDate: r.leaseDate ? r.leaseDate.toISOString() : null,
    cancelDate: r.cancelDate ? r.cancelDate.toISOString() : null,
    comment: r.comment,
  }));

  return (
    <Card>
      <CardHeader className="pb-2 bg-muted/60 rounded-t-lg">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Inquiries
          <span className="ml-2 text-xs font-normal">
            (last {tableRows.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <InquiryTable rows={tableRows} />
      </CardContent>
    </Card>
  );
}
