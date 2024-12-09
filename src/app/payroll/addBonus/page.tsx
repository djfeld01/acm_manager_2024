import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import React from "react";
import LocationCard from "./_components/LocationCard";

async function page() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    const locations = await getFacilityConnections(
      session?.user?.userDetailId || ""
    );
    console.log(locations);
    return (
      <div className="grid grid-cols-3">
        {locations.map((location) => (
          <LocationCard
            sitelinkId={location.sitelinkId}
            facilityName={location.facilityName}
            key={location.sitelinkId}
          />
        ))}
      </div>
    );
  }
  return <p>You are not authorized to view this page!</p>;
}

export default page;
