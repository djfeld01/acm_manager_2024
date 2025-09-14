import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChartControls, ChartFilter } from "@/components/charts/ChartControls";
import {
  EnhancedTooltip,
  FinancialTooltip,
} from "@/components/charts/EnhancedTooltip";
import { ChartExporter } from "@/components/charts/chartExport";

// Mock external dependencies
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Interactive Chart Components", () => {
  describe("ChartControls", () => {
    const mockFilters: ChartFilter[] = [
      {
        id: "location",
        label: "Location",
        type: "select",
        options: [
          { value: "downtown", label: "Downtown" },
          { value: "westside", label: "Westside" },
        ],
      },
      {
        id: "search",
        label: "Search",
        type: "text",
      },
    ];

    it("should render time period buttons", () => {
      const mockOnTimePeriodChange = jest.fn();

      render(
        <ChartControls
          onTimePeriodChange={mockOnTimePeriodChange}
          selectedTimePeriod="30d"
        />
      );

      expect(screen.getByText("Last 7 days")).toBeInTheDocument();
      expect(screen.getByText("Last 30 days")).toBeInTheDocument();
      expect(screen.getByText("Last 90 days")).toBeInTheDocument();
    });

    it("should handle time period selection", () => {
      const mockOnTimePeriodChange = jest.fn();

      render(
        <ChartControls
          onTimePeriodChange={mockOnTimePeriodChange}
          selectedTimePeriod="30d"
        />
      );

      fireEvent.click(screen.getByText("Last 7 days"));
      expect(mockOnTimePeriodChange).toHaveBeenCalledWith("7d");
    });

    it("should render filter controls", () => {
      render(
        <ChartControls filters={mockFilters} onFilterChange={jest.fn()} />
      );

      expect(screen.getByText("Filters")).toBeInTheDocument();
    });

    it("should show active filter count", () => {
      render(
        <ChartControls
          filters={mockFilters}
          activeFilters={{ location: "downtown", search: "test" }}
          onFilterChange={jest.fn()}
        />
      );

      expect(screen.getByText("2")).toBeInTheDocument(); // Filter count badge
    });

    it("should handle filter changes", async () => {
      const mockOnFilterChange = jest.fn();

      render(
        <ChartControls
          filters={mockFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Open filters popover
      fireEvent.click(screen.getByText("Filters"));

      // Wait for popover to open and find select trigger
      await waitFor(() => {
        const selectTrigger = screen.getByText("Select Location");
        expect(selectTrigger).toBeInTheDocument();
      });
    });

    it("should render export options", () => {
      render(
        <ChartControls onExport={jest.fn()} exportFormats={["svg", "csv"]} />
      );

      expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("should handle refresh action", () => {
      const mockOnRefresh = jest.fn();

      render(<ChartControls onRefresh={mockOnRefresh} />);

      const refreshButton = screen.getByRole("button");
      fireEvent.click(refreshButton);
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it("should show loading state", () => {
      render(<ChartControls onRefresh={jest.fn()} isLoading={true} />);

      const refreshButton = screen.getByRole("button");
      expect(refreshButton).toBeDisabled();
    });
  });

  describe("EnhancedTooltip", () => {
    const mockPayload = [
      {
        name: "Revenue",
        value: 45000,
        color: "#22c55e",
        dataKey: "revenue",
      },
      {
        name: "Expenses",
        value: 30000,
        color: "#ef4444",
        dataKey: "expenses",
      },
    ];

    it("should render tooltip with payload data", () => {
      render(
        <EnhancedTooltip
          active={true}
          payload={mockPayload}
          label="January 2024"
        />
      );

      expect(screen.getByText("January 2024")).toBeInTheDocument();
      expect(screen.getByText("Revenue")).toBeInTheDocument();
      expect(screen.getByText("45,000")).toBeInTheDocument();
      expect(screen.getByText("Expenses")).toBeInTheDocument();
      expect(screen.getByText("30,000")).toBeInTheDocument();
    });

    it("should show total when enabled", () => {
      render(
        <EnhancedTooltip
          active={true}
          payload={mockPayload}
          label="January 2024"
          showTotal={true}
        />
      );

      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("75,000")).toBeInTheDocument();
    });

    it("should show percentages when enabled", () => {
      render(
        <EnhancedTooltip
          active={true}
          payload={mockPayload}
          label="January 2024"
          showPercentage={true}
        />
      );

      expect(screen.getByText("60.0%")).toBeInTheDocument(); // 45000/75000
      expect(screen.getByText("40.0%")).toBeInTheDocument(); // 30000/75000
    });

    it("should use custom value formatter", () => {
      const valueFormatter = (value: any) => `$${value.toLocaleString()}`;

      render(
        <EnhancedTooltip
          active={true}
          payload={mockPayload}
          label="January 2024"
          valueFormatter={valueFormatter}
        />
      );

      expect(screen.getByText("$45,000")).toBeInTheDocument();
      expect(screen.getByText("$30,000")).toBeInTheDocument();
    });

    it("should not render when inactive", () => {
      const { container } = render(
        <EnhancedTooltip
          active={false}
          payload={mockPayload}
          label="January 2024"
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("FinancialTooltip", () => {
    const mockPayload = [
      {
        name: "Revenue",
        value: 45000,
        color: "#22c55e",
        dataKey: "revenue",
      },
    ];

    it("should format values as currency", () => {
      render(
        <FinancialTooltip
          active={true}
          payload={mockPayload}
          label="January 2024"
        />
      );

      expect(screen.getByText("$45,000.00")).toBeInTheDocument();
    });
  });

  describe("ChartExporter", () => {
    // Mock DOM methods
    beforeEach(() => {
      // Mock createElement and appendChild
      const mockLink = {
        click: jest.fn(),
        download: "",
        href: "",
      };

      jest.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      jest
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => mockLink as any);
      jest
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => mockLink as any);

      // Mock URL methods
      global.URL.createObjectURL = jest.fn(() => "mock-url");
      global.URL.revokeObjectURL = jest.fn();

      // Mock Blob
      global.Blob = jest.fn(() => ({} as any));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should export data as CSV", () => {
      const data = [
        { name: "A", value: 100 },
        { name: "B", value: 200 },
      ];

      ChartExporter.exportAsCSV(data, { filename: "test-data" });

      expect(global.Blob).toHaveBeenCalledWith(["name,value\nA,100\nB,200"], {
        type: "text/csv;charset=utf-8;",
      });
    });

    it("should export data as JSON", () => {
      const data = [
        { name: "A", value: 100 },
        { name: "B", value: 200 },
      ];

      ChartExporter.exportAsJSON(data, { filename: "test-data" });

      expect(global.Blob).toHaveBeenCalledWith(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
      );
    });

    it("should handle empty data", () => {
      expect(() => {
        ChartExporter.exportAsCSV([], { filename: "empty" });
      }).toThrow("No data to export");
    });

    it("should escape CSV values with commas", () => {
      const data = [{ name: "A, B", value: 100 }];

      ChartExporter.exportAsCSV(data);

      expect(global.Blob).toHaveBeenCalledWith(['name,value\n"A, B",100'], {
        type: "text/csv;charset=utf-8;",
      });
    });
  });

  describe("Chart Export Integration", () => {
    it("should handle export errors gracefully", async () => {
      // Mock a failing export
      jest.spyOn(ChartExporter, "exportAsCSV").mockImplementation(() => {
        throw new Error("Export failed");
      });

      const mockElement = document.createElement("div");
      mockElement.id = "test-chart";
      document.body.appendChild(mockElement);

      try {
        await ChartExporter.exportChart(mockElement, [], "csv");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Export failed");
      }

      document.body.removeChild(mockElement);
    });
  });
});
