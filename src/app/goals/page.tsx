import { auth } from "@/auth";
import { AddMonthlyGoalForm } from "@/components/AddMonthlyGoalForm";
import { Table } from "@/components/ui/table";
import { getFacilityConnections } from "@/lib/controllers/facilityController";
import { Protected, ROLES } from "@/contexts/AuthContext";
async function AddGoal() {
  const session = await auth();
  if (!session?.user?.userDetailId) {
    return <div>Access denied. Please contact an administrator.</div>;
  }
  const facilities = await getFacilityConnections(
    session?.user?.userDetailId || ""
  );
  return (
    <Protected
      roles={[ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.MANAGER]}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          {" "}
          <p className="text-lg">
            You do not have permission to view this page.
          </p>{" "}
        </div>
      }
    >
      {" "}
      <AddMonthlyGoalForm facilities={facilities} />{" "}
    </Protected>
  );
}
export default AddGoal;
