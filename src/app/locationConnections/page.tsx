import { auth } from "@/auth";
import {
  getAllFacilities,
  getFacilityConnections,
} from "@/lib/controllers/facilityController";

export default async function locationConnections() {
  const session = await auth();
  // const facilities = await getAllFacilities(
  //   session?.user?.role ?? "UNAUTHORIZED",
  //   session?.user?.id ?? "UNAUTHORIZED"
  // );
  //console.dir(facilities, { depth: null });
  if (session?.user?.role === "ADMIN") {
    return <div>Admin Person. So fancy.</div>;
  }
  return <p>You are not authorized to view this page!</p>;
}
