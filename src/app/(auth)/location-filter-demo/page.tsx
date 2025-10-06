"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocationFilterProvider } from "@/contexts/LocationFilterContext";
import { LocationFilterBar } from "@/components/locations/LocationFilterBar";
import { useLocationFilteredData } from "@/lib/permissions/withLocationFilter";
import { LocationOption } from "@/components/locations/LocationSelector";
import { UserLocationAccess } from "@/lib/permissions/locationPermissions";
import { Role } from "@/db/schema/user";

// Mock data for demonstration
const mockLocations: LocationOption[] = [
  {
    sitelinkId: "1001",
    facilityName: "Downtown Storage",
    facilityAbbreviation: "DT",
    city: "Austin",
    state: "TX",
    isActive: true,
  },
  {
    sitelinkId: "1002",
    facilityName: "North Austin Storage",
    facilityAbbreviation: "NA",
    city: "Austin",
    state: "TX",
    isActive: true,
  },
  {
    sitelinkId: "1003",
    facilityName: "South Storage Center",
    facilityAbbreviation: "SC",
    city: "Austin",
    state: "TX",
    isActive: true,
  },
  {
    sitelinkId: "1004",
    facilityName: "West Side Storage",
    facilityAbbreviation: "WS",
    city: "Austin",
    state: "TX",
    isActive: false,
  },
];

const mockUserAccess: UserLocationAccess = {
  userId: "user123",
  role: Role.SUPERVISOR,
  assignedFacilities: ["1001", "1002", "1003"],
  permissions: [
    {
      sitelinkId: "1001",
      canRead: true,
      canWrite: true,
      canManage: false,
      canViewPayroll: true,
      canViewReports: true,
    },
    {
      sitelinkId: "1002",
      canRead: true,
      canWrite: true,
      canManage: false,
      canViewPayroll: true,
      canViewReports: true,
    },
    {
      sitelinkId: "1003",
      canRead: true,
      canWrite: true,
      canManage: false,
      canViewPayroll: true,
      canViewReports: true,
    },
  ],
};

interface MockDataItem {
  id: string;
  sitelinkId: string;
  name: string;
  value: number;
  date: string;
}

const mockData: MockDataItem[] = [
  {
    id: "1",
    sitelinkId: "1001",
    name: "Revenue Report",
    value: 15000,
    date: "2024-01-15",
  },
  {
    id: "2",
    sitelinkId: "1001",
    name: "Occupancy Report",
    value: 85,
    date: "2024-01-15",
  },
  {
    id: "3",
    sitelinkId: "1002",
    name: "Revenue Report",
    value: 12000,
    date: "2024-01-15",
  },
  {
    id: "4",
    sitelinkId: "1002",
    name: "Occupancy Report",
    value: 78,
    date: "2024-01-15",
  },
  {
    id: "5",
    sitelinkId: "1003",
    name: "Revenue Report",
    value: 18000,
    date: "2024-01-15",
  },
  {
    id: "6",
    sitelinkId: "1003",
    name: "Occupancy Report",
    value: 92,
    date: "2024-01-15",
  },
  {
    id: "7",
    sitelinkId: "1004",
    name: "Revenue Report",
    value: 8000,
    date: "2024-01-15",
  },
  {
    id: "8",
    sitelinkId: "1004",
    name: "Occupancy Report",
    value: 45,
    date: "2024-01-15",
  },
];

function FilteredDataDisplay({ data }: { data: MockDataItem[] }) {
  const locationFilteredData = useLocationFilteredData(data, {
    getLocationId: (item) => item.sitelinkId,
    requireSelection: false,
    checkReadPermissions: true,
  });

  const { filteredData, hasLocationFilter, isFiltering } = locationFilteredData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Filtered Data Results</span>
          <div className="text-sm font-normal text-muted-foreground">
            {hasLocationFilter
              ? `${filteredData.length} items (filtered)`
              : `${filteredData.length} items (all)`}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No data available for selected locations</p>
            {isFiltering && (
              <p className="text-xs mt-1">
                Try selecting different locations or clearing the filter
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredData.map((item) => {
              const location = mockLocations.find(
                (loc) => loc.sitelinkId === item.sitelinkId
              );
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {location?.facilityAbbreviation} -{" "}
                      {location?.facilityName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LocationFilterDemoPage() {
  const [showQuickActions, setShowQuickActions] = useState(true);

  const handleViewReports = (locationIds: string[]) => {
    alert(`View reports for locations: ${locationIds.join(", ")}`);
  };

  const handleCompareLocations = (locationIds: string[]) => {
    alert(`Compare locations: ${locationIds.join(", ")}`);
  };

  const handleManageLocations = () => {
    alert("Manage locations clicked");
  };

  return (
    <LocationFilterProvider
      initialLocations={mockLocations}
      userAccess={mockUserAccess}
    >
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Location Filter Demo
          </h1>
          <p className="text-muted-foreground">
            Demonstration of location-based data filtering functionality
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQuickActions(!showQuickActions)}
              >
                {showQuickActions ? "Hide" : "Show"} Quick Actions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location Filter Bar */}
        <LocationFilterBar
          showQuickActions={showQuickActions}
          onViewReports={handleViewReports}
          onCompareLocations={handleCompareLocations}
          onManageLocations={handleManageLocations}
        />

        {/* Filtered Data Display */}
        <FilteredDataDisplay data={mockData} />

        {/* User Access Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Role:</strong> {mockUserAccess.role}
              </div>
              <div>
                <strong>Assigned Facilities:</strong>{" "}
                {mockUserAccess.assignedFacilities.join(", ")}
              </div>
              <div>
                <strong>Available Locations:</strong>
              </div>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {mockLocations
                  .filter((loc) =>
                    mockUserAccess.assignedFacilities.includes(loc.sitelinkId)
                  )
                  .map((loc) => (
                    <li key={loc.sitelinkId}>
                      {loc.facilityName} ({loc.facilityAbbreviation}) -{" "}
                      {loc.city}, {loc.state}
                    </li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </LocationFilterProvider>
  );
}
