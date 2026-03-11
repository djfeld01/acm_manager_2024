import { Suspense } from "react";
import { LocationRentalsBanner } from "@/components/LocationRentalsBanner";
import { DashboardClient } from "./_components/DashboardClient";

export default function DashboardPage() {
  return (
    <>
      <Suspense>
        <LocationRentalsBanner />
      </Suspense>
      <DashboardClient />
    </>
  );
}
