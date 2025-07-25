"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function TestAuthPage() {
  const {
    user,
    isLoading,
    isAuthenticated,
    userFacilities,
    isAdmin,
    getUserFacilityIds,
    hasAccessToFacility,
  } = useAuth();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Please sign in to test auth.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Test Page</h1>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">User Info</h2>
          <p>
            <strong>Name:</strong> {user?.name || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {user?.email || "N/A"}
          </p>
          <p>
            <strong>Role:</strong> {user?.role || "N/A"}
          </p>
          <p>
            <strong>User Detail ID:</strong> {user?.userDetailId || "N/A"}
          </p>
          <p>
            <strong>Is Admin:</strong> {isAdmin ? "Yes" : "No"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Facility Access</h2>
          <p>
            <strong>Number of Facilities:</strong> {userFacilities.length}
          </p>
          <p>
            <strong>Facility IDs:</strong>{" "}
            {getUserFacilityIds().join(", ") || "All (Admin)"}
          </p>

          {userFacilities.length > 0 && (
            <div className="mt-2">
              <strong>Facilities:</strong>
              <ul className="mt-1 space-y-1">
                {userFacilities.map((facility, index) => (
                  <li key={index} className="text-sm bg-gray-100 p-2 rounded">
                    <span className="font-medium">{facility.facilityName}</span>
                    <span className="text-gray-600">
                      {" "}
                      ({facility.facilityAbbreviation})
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      Position: {facility.position || "N/A"} | Primary:{" "}
                      {facility.primarySite ? "Yes" : "No"} | Rents Units:{" "}
                      {facility.rentsUnits ? "Yes" : "No"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Access Test</h2>
          <p>
            Test access to facility ID &quot;1001&quot;:{" "}
            {hasAccessToFacility("1001") ? "Yes" : "No"}
          </p>
          <p>
            Test access to facility ID &quot;2001&quot;:{" "}
            {hasAccessToFacility("2001") ? "Yes" : "No"}
          </p>
        </div>
      </div>
    </div>
  );
}
