import GoalChart from "@/components/GoalChart";

export default function YourPage() {
  return (
    <div className="container mx-auto p-4">
      {/* Banner Section */}
      <div className="bg-blue-600 text-white p-6 rounded-lg mb-8 text-center">
        <h1 className="text-2xl font-bold">Storage Facility Name</h1>
        <p>1234 Main Street, City, State</p>
        <p>Email: facility@example.com | Phone: (123) 456-7890</p>
      </div>

      {/* Stats Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          <GoalChart
            facilityName={"TEST DATA"}
            monthlyRentals={23}
            rentalGoal={24}
          />
        </div>
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          Stat2 Component
        </div>
        <div className="bg-gray-100 p-6 rounded-lg flex-1 text-center">
          Stat3 Component
        </div>
      </div>

      {/* Graph Section */}
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Graph Component</h2>
        {/* Graph content goes here */}
      </div>
    </div>
  );
}
