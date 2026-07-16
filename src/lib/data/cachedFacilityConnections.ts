import { cache } from "react";
import { getFacilityConnections } from "@/lib/controllers/facilityController";

/**
 * Request-scoped memoization of getFacilityConnections.
 *
 * Both <Sidebar> and <PageHeader> render on every single page load (they're
 * part of the root layout) and each independently called
 * getFacilityConnections(userDetailId) — the exact same query, run twice,
 * on every request across the whole site. React's `cache()` dedupes calls
 * with the same arguments within a single render pass, so this collapses
 * those two DB round trips into one without changing behavior.
 *
 * Import this instead of the raw controller function from any Server
 * Component that needs a user's facility list.
 */
export const getCachedFacilityConnections = cache(getFacilityConnections);
