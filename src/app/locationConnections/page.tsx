import { auth } from "@/auth";
import {
  getAllFacilities,
  getFacilityConnections,
} from "@/lib/controllers/facilityController";
import { Protected, ROLES } from "@/contexts/AuthContext";
export default async function locationConnections() {
  const session = await auth();
  if (!session?.user?.userDetailId) {
    return <div>Access denied. Please contact an administrator.</div>;
  }
  return (
    <Protected
      roles={[ROLES.ADMIN]}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          {" "}
          <p className="text-lg">
            You are not authorized to view this page!
          </p>{" "}
        </div>
      }
    >
      {" "}
      <div>Admin Person. So fancy.</div>{" "}
    </Protected>
  );
}
