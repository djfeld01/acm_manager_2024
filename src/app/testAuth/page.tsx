import { auth } from "@/auth";
import { db } from "@/db";
import {
  getActivitiesByMonth,
  getActivitiesByMonth2,
} from "@/lib/controllers/activityController";

export default async function Page() {
  const session = await auth();

  const activities = await getActivitiesByMonth2(session?.user?.id || "");

  if (session?.user?.role === "ADMIN") {
    return <p>You are an ADMIN, welcome!</p>;
  }

  if (session?.user?.role === "USER") {
    return <p>You are an USER, welcome!</p>;
  }
  return <p>You are not authorized to view this page!</p>;
}
