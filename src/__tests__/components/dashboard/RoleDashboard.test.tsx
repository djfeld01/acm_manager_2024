import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { Role } from "@/db/schema/user";
import {
  RoleDashboard,
  ManagerDashboard,
  SupervisorDashboard,
  AdminDashboard,
} from "@/components/dashboard/RoleDashboard";

// Mock the layout components
jest.mock("@/components/layout", () => ({
  GridLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="grid-layout">{children}</div>
  ),
}));

// Mock the error boundary
jest.mock("@/components/shared/ErrorBoundary", () => ({
  ComponentErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("Role Dashboard Components", () => {
  describe("RoleDashboard", () => {
    it("should render ManagerDashboard for MANAGER role", () => {
      render(
        <RoleDashboard
          userRole={Role.MANAGER}
          locationId="loc-1"
          locationName="Test Location"
        />
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Managing Test Location")).toBeInTheDocument();
    });

    it("should render ManagerDashboard for ASSISTANT role", () => {
      render(
        <RoleDashboard
          userRole={Role.ASSISTANT}
          locationId="loc-1"
          locationName="Test Location"
        />
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Managing Test Location")).toBeInTheDocument();
    });

    it("should render SupervisorDashboard for SUPERVISOR role", () => {
      const managedLocations = [
        { id: "loc-1", name: "Location 1", occupancyRate: 85, revenue: 45000 },
        { id: "loc-2", name: "Location 2", occupancyRate: 92, revenue: 52000 },
      ];

      render(
        <RoleDashboard
          userRole={Role.SUPERVISOR}
          managedLocations={managedLocations}
        />
      );

      expect(screen.getByText("Area Manager Dashboard")).toBeInTheDocument();
      expect(
        screen.getByText("Managing 2 locations with comprehensive oversight")
      ).toBeInTheDocument();
    });

    it("should render AdminDashboard for ADMIN role", () => {
      const systemStats = {
        totalLocations: 19,
        totalUsers: 45,
        totalRevenue: 892450,
        systemHealth: "good" as const,
      };

      render(<RoleDashboard userRole={Role.ADMIN} systemStats={systemStats} />);

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
      expect(
        screen.getByText("Comprehensive system oversight and management tools")
      ).toBeInTheDocument();
    });

    it("should render AdminDashboard for OWNER role", () => {
      render(<RoleDashboard userRole={Role.OWNER} />);

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    it("should render ManagerDashboard for USER role (fallback)", () => {
      render(<RoleDashboard userRole={Role.USER} />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("ManagerDashboard", () => {
    it("should render location metrics and quick actions", () => {
      render(
        <ManagerDashboard
          userRole={Role.MANAGER}
          locationId="loc-1"
          locationName="Test Facility"
        />
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Managing Test Facility")).toBeInTheDocument();
      expect(screen.getByText("Location Performance")).toBeInTheDocument();
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("should render without location name", () => {
      render(<ManagerDashboard userRole={Role.MANAGER} locationId="loc-1" />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Managing")).not.toBeInTheDocument();
    });
  });

  describe("SupervisorDashboard", () => {
    it("should render multi-location overview", () => {
      const managedLocations = [
        { id: "loc-1", name: "Location 1", occupancyRate: 85, revenue: 45000 },
        { id: "loc-2", name: "Location 2", occupancyRate: 92, revenue: 52000 },
      ];

      render(
        <SupervisorDashboard
          userRole={Role.SUPERVISOR}
          managedLocations={managedLocations}
        />
      );

      expect(screen.getByText("Area Manager Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Multi-Location Overview")).toBeInTheDocument();
      expect(screen.getByText("Location Performance")).toBeInTheDocument();
      expect(screen.getByText("Team Management")).toBeInTheDocument();
      expect(screen.getByText("Location 1")).toBeInTheDocument();
      expect(screen.getByText("Location 2")).toBeInTheDocument();
    });

    it("should handle empty managed locations", () => {
      render(
        <SupervisorDashboard userRole={Role.SUPERVISOR} managedLocations={[]} />
      );

      expect(
        screen.getByText("Managing 0 locations with comprehensive oversight")
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Location Performance")
      ).not.toBeInTheDocument();
    });
  });

  describe("AdminDashboard", () => {
    it("should render system overview and admin tools", () => {
      const systemStats = {
        totalLocations: 19,
        totalUsers: 45,
        totalRevenue: 892450,
        systemHealth: "good" as const,
      };

      render(
        <AdminDashboard userRole={Role.ADMIN} systemStats={systemStats} />
      );

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
      expect(screen.getByText("System Overview")).toBeInTheDocument();
      expect(screen.getByText("System Alerts")).toBeInTheDocument();
      expect(screen.getByText("Administration Tools")).toBeInTheDocument();
      expect(screen.getByText("Quick Statistics")).toBeInTheDocument();
    });

    it("should use default system stats when not provided", () => {
      render(<AdminDashboard userRole={Role.ADMIN} />);

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
      expect(screen.getByText("19")).toBeInTheDocument(); // Default total locations
    });

    it("should show system health warnings", () => {
      const systemStats = {
        totalLocations: 19,
        totalUsers: 45,
        totalRevenue: 892450,
        systemHealth: "warning" as const,
      };

      render(
        <AdminDashboard userRole={Role.ADMIN} systemStats={systemStats} />
      );

      expect(screen.getByText("Warning")).toBeInTheDocument();
    });
  });
});
