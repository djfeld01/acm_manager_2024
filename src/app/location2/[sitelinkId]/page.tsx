import EmployeeContainer from "@/components/EmployeeContainer";
import { auth } from "@/auth";
import LocationHeader from "../_components/LocationHeader";
import RentalGoalContainer from "../_components/RentalGoalContainer";

export default async function Page({
  params,
}: {
  params: Promise<{ sitelinkId: string }>;
}) {
  const sitelinkId = (await params).sitelinkId;
  const session = await auth();
  if (!session || !session.user) {
    return <p>Please Log On</p>;
  }
  const { user } = session;

  return (
    <div className="container mx-auto p-4">
      <LocationHeader facilityId={sitelinkId} />
      <div className="flex flex-col lg:flex-row justify-between gap-2 mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex-1 text-center">
          <RentalGoalContainer facilityId={sitelinkId} />
        </div>
        {/* <div className="bg-gray-100 p-1 rounded-lg flex-1 text-center">
          <RentalGoalChart facilityId={sitelinkId} />
        </div>
        <div className="bg-gray-100 p-1 rounded-lg flex-1 text-center">
          <RentalGoalChart facilityId={sitelinkId} />
        </div> */}
      </div>
    </div>
  );
}
