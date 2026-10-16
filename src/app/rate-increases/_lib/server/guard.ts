import { getCurrentUser } from "@/lib/auth/utils";
import { isPilotFacility } from "../config";

/** Rent roll data is financial and tenant-level: owners/admins only, and
 *  only for facilities in the pilot. */
export async function assertAccess(sitelinkId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
    throw new Error("Not authorized");
  }
  if (!isPilotFacility(sitelinkId)) {
    throw new Error("Facility is not part of the rate-increase pilot");
  }
}

/** Owners and admins only, with no facility restriction. Used for aggregate
 *  reports (no tenant information) that describe any of the company's sites. */
export async function assertOwnerOrAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
    throw new Error("Not authorized");
  }
}
