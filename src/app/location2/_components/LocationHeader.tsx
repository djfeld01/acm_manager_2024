"use server";
import { getFacilityHeaderData } from "@/app/actions";
import React from "react";

type LocationHeaderProps = {
  facilityId: string;
};
async function LocationHeader({ facilityId }: LocationHeaderProps) {
  const facility = await getFacilityHeaderData(facilityId);

  return (
    <div className="bg-blue-600 text-white p-6 rounded-lg mb-1 text-center">
      <h1 className="text-2xl font-bold">{facility?.facilityName}</h1>
      <p>{facility?.streetAddress}</p>
      <p>
        {facility?.city}, {facility?.state}
      </p>
      <p>
        Email: {facility?.email} | Phone: {facility?.phoneNumber}
      </p>
      {/* <p>
        Last Logon: {latestLogonFormatted} - {latestLogons[0].firstName}{" "}
        {latestLogons[0].lastName}
      </p> */}
    </div>
  );
}

export default LocationHeader;
