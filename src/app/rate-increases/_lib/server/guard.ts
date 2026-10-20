import { getCurrentUser } from "@/lib/auth/utils";
import { isRateIncreaseFacility } from "../config";

/** Rent roll data is financial and tenant-level: owners/admins only, and
 *  only for facilities the tools are switched on for. */
export async function assertAccess(sitelinkId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
    throw new Error("Not authorized");
  }
  if (!isRateIncreaseFacility(sitelinkId)) {
    throw new Error("Rate increases aren't switched on for this facility");
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
