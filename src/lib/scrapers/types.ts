export interface ParsedUnit {
  unitSize: string; // e.g. "10x10"
  unitType: string | null; // e.g. "climate, drive-up"
  width: number | null;
  depth: number | null;
  streetRate: number | null;
  webRate: number | null;
  promotion: string | null;
  availability: "AVAILABLE" | "LIMITED" | "WAITLIST" | "UNAVAILABLE";
}

export interface ScrapeResult {
  competitorId: number;
  competitorName: string;
  success: boolean;
  unitsFound: number;
  error?: string;
}
