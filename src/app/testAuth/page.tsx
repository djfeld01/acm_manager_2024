import { auth } from "@/auth";
import { db } from "@/db";
import { getActivitiesByMonth2 } from "@/lib/controllers/activityController";
import { Protected, ROLES } from "@/contexts/AuthContext";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.userDetailId) {
    return <div>Access denied. Please contact an administrator.</div>;
  }

  const activities = await getActivitiesByMonth2(session?.user?.id || "");

  return (
    <div>
      <Protected roles={[ROLES.ADMIN]} fallback={null}>
        <p>You are an ADMIN, welcome!</p>
      </Protected>

      <Protected roles={[ROLES.USER]} fallback={null}>
        <p>You are a USER, welcome!</p>
      </Protected>

      <Protected
        roles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.USER]}
        fallback={<p>You are not authorized to view this page!</p>}
      >
        <div>
          <p>Authenticated user content here</p>
          {/* You can display activities or other authenticated content */}
        </div>
      </Protected>
    </div>
  );
}
