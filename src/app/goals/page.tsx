import { auth } from "@/auth";
import { AddMonthlyGoalForm } from "@/components/AddMonthlyGoalForm";
import { Table } from "@/components/ui/table";
import { getFacilityConnections } from "@/lib/controllers/facilityController";

async function AddGoal() {
  const session = await auth();
  console.log(session);
  const facilities = await getFacilityConnections(session?.user?.id || "");

  return <Table></Table>;

  // return <AddMonthlyGoalForm facilities={facilities} />;
}

export default AddGoal;
