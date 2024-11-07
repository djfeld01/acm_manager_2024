import GoalChart from "@/components/GoalChart";
import { db } from "@/db";
import { storageFacilities } from "@/db/schema";

export default async function YourPage() {
  const locations = await db.query.storageFacilities.findMany({
    where: (storageFacilities, { eq }) =>
      eq(storageFacilities.currentClient, true),
  });
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
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-6">Locations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-600">
                  Facility Name
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  City
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  State
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Website
                </th>
                <th className="text-left p-4 font-semibold text-gray-600">
                  Domain Registrar
                </th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-4 text-gray-700">{location.facilityName}</td>
                  <td className="p-4 text-gray-700">{location.city}</td>
                  <td className="p-4 text-gray-700">{location.state}</td>
                  <td className="p-4">
                    <a
                      href={location.website ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {location.website}
                    </a>
                  </td>
                  <td className="p-4 text-gray-700">
                    {location.domainRegistrar}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
