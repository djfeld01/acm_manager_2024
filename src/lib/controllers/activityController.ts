import { db } from "@/db";

export async function getActivitiesByDates(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const res = db.query.usersToFacilities.findMany({
    where: (userRelation, { eq }) => eq(userRelation.userId, userId),
    with: {
      storageFacility: true,
    },
  });
}

export async function getActivitiesByEmployee() {}
