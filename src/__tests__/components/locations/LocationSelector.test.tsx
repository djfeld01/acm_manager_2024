import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LocationSelector,
  LocationOption,
} from "@/components/locations/LocationSelector";

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
    isActive: false,
  },
];

describe("LocationSelector", () => {
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    mockOnSelectionChange.mockClear();
  });

  it("renders with placeholder text", () => {
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
        placeholder="Select locations..."
      />
    );

    expect(screen.getByText("Select locations...")).toBeInTheDocument();
  });

  it("displays selected location name for single selection", () => {
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={false}
      />
    );

    expect(screen.getByText("Downtown Storage")).toBeInTheDocument();
  });

  it("displays abbreviations for multiple selections", () => {
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001", "1002"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
      />
    );

    expect(screen.getByText("DT, NA")).toBeInTheDocument();
  });

  it("displays count for many selections", () => {
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001", "1002", "1003"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
      />
    );

    expect(screen.getByText("3 locations selected")).toBeInTheDocument();
  });

  it("opens dropdown when clicked", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Downtown Storage")).toBeInTheDocument();
      expect(screen.getByText("North Austin Storage")).toBeInTheDocument();
    });
  });

  it("filters out inactive locations by default", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
        showInactive={false}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Downtown Storage")).toBeInTheDocument();
      expect(screen.getByText("North Austin Storage")).toBeInTheDocument();
      expect(
        screen.queryByText("South Storage Center")
      ).not.toBeInTheDocument();
    });
  });

  it("shows inactive locations when showInactive is true", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
        showInactive={true}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Downtown Storage")).toBeInTheDocument();
      expect(screen.getByText("North Austin Storage")).toBeInTheDocument();
      expect(screen.getByText("South Storage Center")).toBeInTheDocument();
    });
  });

  it("handles single selection", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={false}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const option = screen.getByText("Downtown Storage");
      fireEvent.click(option);
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(["1001"]);
  });

  it("handles multiple selection", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const option = screen.getByText("North Austin Storage");
      fireEvent.click(option);
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(["1001", "1002"]);
  });

  it("handles deselection in multiple mode", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001", "1002"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const option = screen.getByText("Downtown Storage");
      fireEvent.click(option);
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(["1002"]);
  });

  it("respects maxSelections limit", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001", "1002"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
        maxSelections={2}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      // Try to select a third location - should be disabled
      const option = screen.getByText("South Storage Center");
      expect(option.closest('[data-disabled="true"]')).toBeInTheDocument();
    });
  });

  it("shows selection limit indicator", () => {
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
        maxSelections={3}
      />
    );

    expect(screen.getByText("1 of 3 selected")).toBeInTheDocument();
  });

  it("handles select all functionality", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const selectAllOption = screen.getByText("Select All");
      fireEvent.click(selectAllOption);
    });

    // Should select only active locations by default
    expect(mockOnSelectionChange).toHaveBeenCalledWith(["1001", "1002"]);
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
        disabled={true}
      />
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
  });

  it("allows removal of selected locations via badges", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={["1001", "1002"]}
        onSelectionChange={mockOnSelectionChange}
        allowMultiple={true}
      />
    );

    // Find and click the remove button on the first badge
    const removeButton = screen.getAllByText("×")[0];
    await user.click(removeButton);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(["1002"]);
  });

  it("searches locations correctly", async () => {
    const user = userEvent.setup();

    render(
      <LocationSelector
        locations={mockLocations}
        selectedLocationIds={[]}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search locations...");
      fireEvent.change(searchInput, { target: { value: "North" } });
    });

    await waitFor(() => {
      expect(screen.getByText("North Austin Storage")).toBeInTheDocument();
      expect(screen.queryByText("Downtown Storage")).not.toBeInTheDocument();
    });
  });
});
