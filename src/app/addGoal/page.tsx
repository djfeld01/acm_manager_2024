import { auth } from "@/auth";
import { AddMonthlyGoalForm } from "@/components/AddMonthlyGoalForm";
import { getFacilityConnections } from "@/lib/controllers/facilityController";

async function AddGoal() {
  const session = await auth();
  const facilities = await getFacilityConnections(session?.user?.id || "");
  return <AddMonthlyGoalForm facilities={facilities} />;
}

export default AddGoal;
