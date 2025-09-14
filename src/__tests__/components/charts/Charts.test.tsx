import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ChartWrapper,
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  TrendLineChart,
  HorizontalBarChart,
  DonutChart,
} from "@/components/charts";

// Mock Recharts components
jest.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock the error boundary and loading components
jest.mock("@/components/shared/ErrorBoundary", () => ({
  ComponentErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/components/shared/LoadingStates", () => ({
  CardSkeleton: ({ style }: { style?: React.CSSProperties }) => (
    <div data-testid="card-skeleton" style={style} />
  ),
}));

describe("Chart Components", () => {
  const mockData = [
    { name: "Jan", value: 100, revenue: 1000 },
    { name: "Feb", value: 150, revenue: 1500 },
    { name: "Mar", value: 120, revenue: 1200 },
  ];

  const mockPieData = [
    { name: "Active", value: 60 },
    { name: "Inactive", value: 30 },
    { name: "Pending", value: 10 },
  ];

  describe("ChartWrapper", () => {
    it("should render chart wrapper with title and description", () => {
      render(
        <ChartWrapper title="Test Chart" description="This is a test chart">
          <div>Chart Content</div>
        </ChartWrapper>
      );

      expect(screen.getByText("Test Chart")).toBeInTheDocument();
      expect(screen.getByText("This is a test chart")).toBeInTheDocument();
      expect(screen.getByText("Chart Content")).toBeInTheDocument();
    });

    it("should show loading state", () => {
      render(
        <ChartWrapper title="Loading Chart" isLoading={true}>
          <div>Chart Content</div>
        </ChartWrapper>
      );

      expect(screen.getByTestId("card-skeleton")).toBeInTheDocument();
      expect(screen.queryByText("Chart Content")).not.toBeInTheDocument();
    });

    it("should show error state", () => {
      const error = new Error("Chart failed to load");

      render(
        <ChartWrapper title="Error Chart" error={error}>
          <div>Chart Content</div>
        </ChartWrapper>
      );

      expect(screen.getByText("Failed to load chart")).toBeInTheDocument();
      expect(screen.getByText("Chart failed to load")).toBeInTheDocument();
      expect(screen.queryByText("Chart Content")).not.toBeInTheDocument();
    });

    it("should handle retry action", () => {
      const mockRetry = jest.fn();
      const error = new Error("Chart failed to load");

      render(
        <ChartWrapper title="Error Chart" error={error} onRetry={mockRetry}>
          <div>Chart Content</div>
        </ChartWrapper>
      );

      const retryButton = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });

    it("should render action buttons", () => {
      const mockExport = jest.fn();
      const mockFullscreen = jest.fn();

      render(
        <ChartWrapper
          title="Chart with Actions"
          onExport={mockExport}
          onFullscreen={mockFullscreen}
        >
          <div>Chart Content</div>
        </ChartWrapper>
      );

      const exportButton = screen.getByTitle("Export");
      const fullscreenButton = screen.getByTitle("Fullscreen");

      fireEvent.click(exportButton);
      fireEvent.click(fullscreenButton);

      expect(mockExport).toHaveBeenCalled();
      expect(mockFullscreen).toHaveBeenCalled();
    });

    it("should render badge when provided", () => {
      render(
        <ChartWrapper
          title="Chart with Badge"
          badge={{ text: "New", variant: "default" }}
        >
          <div>Chart Content</div>
        </ChartWrapper>
      );

      expect(screen.getByText("New")).toBeInTheDocument();
    });
  });

  describe("LineChart", () => {
    it("should render line chart with data", () => {
      render(
        <LineChart
          title="Revenue Trend"
          data={mockData}
          lines={[{ dataKey: "revenue", name: "Revenue" }]}
          xAxisKey="name"
        />
      );

      expect(screen.getByText("Revenue Trend")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should render grid when showGrid is true", () => {
      render(
        <LineChart
          title="Chart with Grid"
          data={mockData}
          lines={[{ dataKey: "value" }]}
          xAxisKey="name"
          showGrid={true}
        />
      );

      expect(screen.getByTestId("grid")).toBeInTheDocument();
    });

    it("should render legend when showLegend is true", () => {
      render(
        <LineChart
          title="Chart with Legend"
          data={mockData}
          lines={[{ dataKey: "value" }]}
          xAxisKey="name"
          showLegend={true}
        />
      );

      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });
  });

  describe("TrendLineChart", () => {
    it("should render trend chart with up trend", () => {
      render(
        <TrendLineChart
          title="Upward Trend"
          data={mockData}
          valueKey="value"
          xAxisKey="name"
          trend="up"
        />
      );

      expect(screen.getByText("Upward Trend")).toBeInTheDocument();
      expect(screen.getByText("up")).toBeInTheDocument();
    });

    it("should render trend chart with down trend", () => {
      render(
        <TrendLineChart
          title="Downward Trend"
          data={mockData}
          valueKey="value"
          xAxisKey="name"
          trend="down"
        />
      );

      expect(screen.getByText("down")).toBeInTheDocument();
    });
  });

  describe("BarChart", () => {
    it("should render bar chart with data", () => {
      render(
        <BarChart
          title="Revenue by Month"
          data={mockData}
          bars={[{ dataKey: "revenue", name: "Revenue" }]}
          xAxisKey="name"
        />
      );

      expect(screen.getByText("Revenue by Month")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  describe("HorizontalBarChart", () => {
    it("should render horizontal bar chart", () => {
      render(
        <HorizontalBarChart
          title="Horizontal Chart"
          data={mockData}
          valueKey="value"
          labelKey="name"
        />
      );

      expect(screen.getByText("Horizontal Chart")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  describe("AreaChart", () => {
    it("should render area chart with data", () => {
      render(
        <AreaChart
          title="Area Chart"
          data={mockData}
          areas={[{ dataKey: "value", name: "Value" }]}
          xAxisKey="name"
        />
      );

      expect(screen.getByText("Area Chart")).toBeInTheDocument();
      expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    });
  });

  describe("PieChart", () => {
    it("should render pie chart with data", () => {
      render(<PieChart title="Status Distribution" data={mockPieData} />);

      expect(screen.getByText("Status Distribution")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("should render legend when showLegend is true", () => {
      render(
        <PieChart
          title="Pie with Legend"
          data={mockPieData}
          showLegend={true}
        />
      );

      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });
  });

  describe("DonutChart", () => {
    it("should render donut chart with center label", () => {
      render(
        <DonutChart
          title="Donut Chart"
          data={mockPieData}
          centerLabel="Total"
          centerValue="100"
        />
      );

      expect(screen.getByText("Donut Chart")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
    });
  });

  describe("Chart Error Handling", () => {
    it("should handle empty data gracefully", () => {
      render(
        <LineChart
          title="Empty Chart"
          data={[]}
          lines={[{ dataKey: "value" }]}
          xAxisKey="name"
        />
      );

      expect(screen.getByText("Empty Chart")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("should handle missing dataKey gracefully", () => {
      render(
        <LineChart
          title="Missing Data"
          data={mockData}
          lines={[{ dataKey: "nonexistent" }]}
          xAxisKey="name"
        />
      );

      expect(screen.getByText("Missing Data")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });
  });

  describe("Chart Responsiveness", () => {
    it("should render responsive container", () => {
      render(
        <LineChart
          title="Responsive Chart"
          data={mockData}
          lines={[{ dataKey: "value" }]}
          xAxisKey="name"
        />
      );

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should apply custom height", () => {
      render(
        <ChartWrapper title="Custom Height Chart" height={500}>
          <div>Chart Content</div>
        </ChartWrapper>
      );

      const chartContainer = screen.getByText("Chart Content").parentElement;
      expect(chartContainer).toHaveStyle({ height: "500px" });
    });
  });
});
