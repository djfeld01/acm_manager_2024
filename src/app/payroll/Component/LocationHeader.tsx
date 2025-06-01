import { facilityPageDataOptions } from "@/app/queryHelpers/queryOptions";
import { getDateSentence } from "@/lib/utils";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import React from "react";

type LocationHeaderProps = {
  sitelinkId: string;
};
function LocationHeader({ sitelinkId }: LocationHeaderProps) {
  const queryClient = useQueryClient();

  const { data: facilityData } = useSuspenseQuery(
    facilityPageDataOptions(sitelinkId)
  );
  const { facility, latestLogons } = facilityData;
  const latestLogonDate = latestLogons[0].logonDate;
  const latestLogonFormatted = getDateSentence(
    latestLogonDate || new Date(2024, 1, 1)
  );
  return (
    <div className="bg-blue-600 text-white p-6 rounded-lg mb-1 text-center">
      <h1 className="text-2xl font-bold">{facility?.facilityName}</h1>
      <p>Paycor: {facility?.paycorNumber}</p>
      <p>{facility?.streetAddress}</p>
      <p>
        {facility?.city}, {facility?.state}
      </p>
      <p>
        Email: {facility?.email} | Phone: {facility?.phoneNumber}
      </p>
      <p>
        Last Logon: {latestLogonFormatted} - {latestLogons[0].firstName}{" "}
        {latestLogons[0].lastName}
      </p>
    </div>
  );
}

export default LocationHeader;
