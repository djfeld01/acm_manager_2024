import { auth } from "@/auth";
import { getFacilityConnections } from "@/lib/controllers/facilityController";

export default async function locationConnections() {
  const session = await auth();
  const facilities = await getFacilityConnections(session?.user?.id || "");

  return (
    <div>
      {facilities.map((facility, index) => (
        <div key={index}>{facility.storageFacility.facilityAbbreviation}</div>
      ))}
    </div>
  );
}
