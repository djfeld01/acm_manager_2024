import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import {
  DashboardCard,
  MetricCard,
  AlertCard,
  DashboardQuickActionCard,
  DashboardMetric,
} from "@/components/dashboard/DashboardCard";

describe("Dashboard Card Components", () => {
  describe("DashboardCard", () => {
    const basicMetric: DashboardMetric = {
      id: "revenue",
      title: "Monthly Revenue",
      value: "$45,231",
      icon: DollarSign,
    };

    it("should render basic metric card", () => {
      render(<DashboardCard metric={basicMetric} />);

      expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
      expect(screen.getByText("$45,231")).toBeInTheDocument();
    });

    it("should render metric with change indicator", () => {
      const metricWithChange: DashboardMetric = {
        ...basicMetric,
        change: {
          value: 12.5,
          type: "increase",
          period: "last month",
        },
      };

      render(<DashboardCard metric={metricWithChange} />);

      expect(screen.getByText("+12.5% from last month")).toBeInTheDocument();
    });

    it("should render metric with alert", () => {
      const metricWithAlert: DashboardMetric = {
        ...basicMetric,
        alert: {
          level: "warning",
          message: "Revenue is below target",
        },
      };

      render(<DashboardCard metric={metricWithAlert} />);

      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText("Revenue is below target")).toBeInTheDocument();
    });

    it("should render metric with action button", () => {
      const mockAction = jest.fn();
      const metricWithAction: DashboardMetric = {
        ...basicMetric,
        action: {
          label: "View Details",
          onClick: mockAction,
        },
      };

      render(<DashboardCard metric={metricWithAction} />);

      const actionButton = screen.getByRole("button", { name: "View Details" });
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(mockAction).toHaveBeenCalled();
    });

    it("should render compact variant correctly", () => {
      render(<DashboardCard metric={basicMetric} variant="compact" />);

      expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
      expect(screen.getByText("$45,231")).toBeInTheDocument();
    });

    it("should render with custom size", () => {
      const { container } = render(
        <DashboardCard metric={basicMetric} size="lg" />
      );

      const cardContent = container.querySelector('[class*="p-8"]');
      expect(cardContent).toBeInTheDocument();
    });
  });

  describe("MetricCard", () => {
    it("should render metric card with change", () => {
      render(
        <MetricCard
          title="Occupancy Rate"
          value="87%"
          change={{ value: 5.2, period: "last week" }}
          icon={DollarSign}
        />
      );

      expect(screen.getByText("Occupancy Rate")).toBeInTheDocument();
      expect(screen.getByText("87%")).toBeInTheDocument();
      expect(screen.getByText("+5.2% from last week")).toBeInTheDocument();
    });

    it("should handle negative change", () => {
      render(
        <MetricCard
          title="New Rentals"
          value="23"
          change={{ value: -3.1, period: "last month" }}
        />
      );

      expect(screen.getByText("-3.1% from last month")).toBeInTheDocument();
    });
  });

  describe("AlertCard", () => {
    it("should render alert card with warning level", () => {
      const mockAction = jest.fn();

      render(
        <AlertCard
          title="Deposit Alert"
          message="Facility ABC has not deposited today"
          level="warning"
          action={{ label: "Check Deposits", onClick: mockAction }}
        />
      );

      expect(screen.getByText("Deposit Alert")).toBeInTheDocument();
      expect(
        screen.getByText("Facility ABC has not deposited today")
      ).toBeInTheDocument();
      expect(screen.getByText("Warning")).toBeInTheDocument();

      const actionButton = screen.getByRole("button", {
        name: "Check Deposits",
      });
      fireEvent.click(actionButton);
      expect(mockAction).toHaveBeenCalled();
    });

    it("should render error level alert with proper styling", () => {
      render(
        <AlertCard
          title="System Error"
          message="Database connection failed"
          level="error"
        />
      );

      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("DashboardQuickActionCard", () => {
    it("should render quick action with link", () => {
      render(
        <DashboardQuickActionCard
          title="Process Payroll"
          description="Start bi-weekly payroll processing"
          action={{ label: "Start Process", href: "/payroll/new" }}
          icon={DollarSign}
        />
      );

      expect(screen.getByText("Process Payroll")).toBeInTheDocument();
      expect(
        screen.getByText("Start bi-weekly payroll processing")
      ).toBeInTheDocument();
    });

    it("should render quick action with click handler", () => {
      const mockAction = jest.fn();

      render(
        <DashboardQuickActionCard
          title="Generate Report"
          description="Create monthly performance report"
          action={{ label: "Generate", onClick: mockAction }}
          icon={DollarSign}
        />
      );

      const actionButton = screen.getByRole("button", { name: "Generate" });
      fireEvent.click(actionButton);
      expect(mockAction).toHaveBeenCalled();
    });
  });
});
