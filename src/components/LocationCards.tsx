import React from "react";
import ActivityCard from "./ActivityCard";

type LocationNumbersType = {
  facilityAbbreviation: string | null;
  facilityName: string | null;
  facilityId: string | null;
  activityType: "MoveIn" | "MoveOut" | "Transfer" | null;
  total: number;
  month: number;
  year: number;
};

interface LocationCardsPropsType {
  locationsNumbers: LocationNumbersType[];
}
interface ActivityTypes {
  [year: string]: { [month: string]: number };
}
interface Location {
  facilityAbbreviation: string;
  facilityName: string;
  facilityId: string;
  activityTypes: {
    [activityType: string]: ActivityTypes;
  };
}
function LocationCards({ locationsNumbers }: LocationCardsPropsType) {
  const formattedLocationsNumbers = locationsNumbers.reduce<Location[]>(
    (acc, currResult) => {
      // Find the existing location
      let location = acc.find(
        (location) => location.facilityName === currResult.facilityName
      );

      // If location doesn't exist, initialize it
      if (!location) {
        location = {
          facilityName: currResult.facilityName || "",
          facilityAbbreviation: currResult.facilityAbbreviation || "",
          facilityId: currResult.facilityId || "",
          activityTypes: {},
        };
        acc.push(location);
      }

      // If activityType doesn't exist, initialize it
      if (!location.activityTypes[currResult.activityType || "MoveIn"]) {
        location.activityTypes[currResult.activityType || "MoveIn"] = {};
      }

      // If year doesn't exist, initialize it
      if (
        !location.activityTypes[currResult.activityType || "MoveIn"][
          currResult.year
        ]
      ) {
        location.activityTypes[currResult.activityType || "MoveIn"][
          currResult.year
        ] = {};
      }

      // Assign total to the correct month
      location.activityTypes[currResult.activityType || "MoveIn"][
        currResult.year
      ][currResult.month] = currResult.total;

      return acc;
    },
    []
  );
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-3">
        {formattedLocationsNumbers.map((locationNumbers) => {
          return (
            <ActivityCard
              facilityAbbreviation={locationNumbers.facilityName}
              totalRentals={locationNumbers?.activityTypes.MoveIn[2024][10]}
              key={locationNumbers?.facilityId}
            />
          );
        })}
      </div>
    </main>
  );
}

export default LocationCards;
