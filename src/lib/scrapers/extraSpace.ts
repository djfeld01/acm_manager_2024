import type { ParsedUnit } from "./types";

// Maps Extra Space feature name strings to human-readable unit type labels
const FEATURE_LABELS: Record<string, string> = {
  ClimateControlled: "climate",
  DriveUpAccess: "drive-up",
  ElevatorAccess: "elevator",
  "1stFloorAccess": "1st floor",
};

// Recursively searches an object for a key, returning the first match.
// Used as a fallback when the unitClasses path varies across page layouts.
function findKey(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  if (key in (obj as Record<string, unknown>))
    return (obj as Record<string, unknown>)[key];
  for (const val of Object.values(obj as Record<string, unknown>)) {
    const found = findKey(val, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

export async function scrapeExtraSpace(url: string): Promise<ParsedUnit[]> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const html = await response.text();

  // Extract the __NEXT_DATA__ JSON blob
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/
  );
  if (!match) throw new Error("__NEXT_DATA__ not found on page");

  const nextData = JSON.parse(match[1]);

  // Primary path: props.pageProps.unitClasses.data.unitClasses
  const pageProps = nextData?.props?.pageProps;
  const unitClasses: unknown[] =
    pageProps?.unitClasses?.data?.unitClasses ??
    // Fallback: search the whole tree for a "unitClasses" array
    (findKey(nextData, "unitClasses") as unknown[]) ??
    [];

  if (!Array.isArray(unitClasses) || unitClasses.length === 0) {
    throw new Error("No unitClasses array found in __NEXT_DATA__");
  }

  return unitClasses.map((unit: unknown) => {
    const u = unit as Record<string, unknown>;
    const dims = u.dimensions as Record<string, number> | undefined;
    const rates = u.rates as Record<string, number> | undefined;
    const avail = u.availability as Record<string, number> | undefined;
    const features = (u.features as Array<{ name: string }> | undefined) ?? [];

    const width = dims?.width ?? null;
    const depth = dims?.depth ?? null;
    const unitSize = width && depth ? `${width}x${depth}` : "unknown";

    const unitType =
      features
        .map((f) => FEATURE_LABELS[f.name] ?? f.name)
        .filter(Boolean)
        .join(", ") || null;

    const available = avail?.available ?? 0;

    return {
      unitSize,
      unitType,
      width,
      depth,
      streetRate: rates?.street ?? null,
      webRate: rates?.web ?? null,
      promotion: null, // Extra Space promos are handled at checkout, not on listing page
      availability: available > 0 ? "AVAILABLE" : "UNAVAILABLE",
    } satisfies ParsedUnit;
  });
}
