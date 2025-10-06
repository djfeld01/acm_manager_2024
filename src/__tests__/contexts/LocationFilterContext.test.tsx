import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  LocationFilterProvider,
  useLocationFilter,
} from "@/contexts/LocationFilterContext";
import { LocationOption } from "@/components/locations/LocationSelector";
import { UserLocationAccess } from "@/lib/permissions/locationPermissions";
import { Role } from "@/db/schema/user";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";

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
];

const mockUserAccess: UserLocationAccess = {
  userId: "user123",
  role: Role.MANAGER,
  assignedFacilities: ["1001", "1002"],
  permissions: [
    {
      sitelinkId: "1001",
      canRead: true,
      canWrite: true,
      canManage: false,
      canViewPayroll: false,
      canViewReports: true,
    },
    {
      sitelinkId: "1002",
      canRead: true,
      canWrite: true,
      canManage: false,
      canViewPayroll: false,
      canViewReports: true,
    },
  ],
};

// Test component that uses the context
function TestComponent() {
  const {
    availableLocations,
    selectedLocationIds,
    setSelectedLocations,
    addLocation,
    removeLocation,
    clearSelection,
    selectAll,
  } = useLocationFilter();

  return (
    <div>
      <div data-testid="available-count">{availableLocations.length}</div>
      <div data-testid="selected-count">{selectedLocationIds.length}</div>
      <div data-testid="selected-ids">{selectedLocationIds.join(",")}</div>

      <button onClick={() => setSelectedLocations(["1001"])}>
        Set Location 1001
      </button>
      <button onClick={() => addLocation("1002")}>Add Location 1002</button>
      <button onClick={() => removeLocation("1001")}>
        Remove Location 1001
      </button>
      <button onClick={clearSelection}>Clear Selection</button>
      <button onClick={selectAll}>Select All</button>
    </div>
  );
}

describe("LocationFilterContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("provides initial state correctly", () => {
    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={["1001"]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    expect(screen.getByTestId("available-count")).toHaveTextContent("2");
    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("1001");
  });

  it("handles setSelectedLocations correctly", () => {
    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={[]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    fireEvent.click(screen.getByText("Set Location 1001"));

    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("1001");
  });

  it("handles addLocation correctly", () => {
    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={["1001"]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    fireEvent.click(screen.getByText("Add Location 1002"));

    expect(screen.getByTestId("selected-count")).toHaveTextContent("2");
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("1001,1002");
  });

  it("handles removeLocation correctly", () => {
    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={["1001", "1002"]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    fireEvent.click(screen.getByText("Remove Location 1001"));

    expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("1002");
  });

  it("handles clearSelection correctly", () => {
    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={["1001", "1002"]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    fireEvent.click(screen.getByText("Clear Selection"));

    expect(screen.getByTestId("selected-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("");
  });

  it("handles selectAll correctly", () => {
    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={[]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    fireEvent.click(screen.getByText("Select All"));

    expect(screen.getByTestId("selected-count")).toHaveTextContent("2");
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("1001,1002");
  });

  it("persists selection to localStorage", async () => {
    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={[]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    fireEvent.click(screen.getByText("Set Location 1001"));

    await waitFor(() => {
      const stored = localStorage.getItem("selectedLocationIds");
      expect(stored).toBe('["1001"]');
    });
  });

  it("loads selection from localStorage", () => {
    // Pre-populate localStorage
    localStorage.setItem("selectedLocationIds", '["1002"]');

    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={[]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    // Should load from localStorage since initialSelectedIds is empty
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("1002");
  });

  it("filters out invalid location IDs from localStorage", () => {
    // Pre-populate localStorage with invalid ID
    localStorage.setItem("selectedLocationIds", '["1001", "9999"]');

    render(
      <LocationFilterProvider
        initialLocations={mockLocations}
        initialSelectedIds={[]}
        userAccess={mockUserAccess}
      >
        <TestComponent />
      </LocationFilterProvider>
    );

    // Should only load valid location ID
    expect(screen.getByTestId("selected-ids")).toHaveTextContent("1001");
  });

  it("throws error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow(
      "useLocationFilter must be used within a LocationFilterProvider"
    );

    consoleSpy.mockRestore();
  });
});
