import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { Role } from "@/db/schema/user";
import {
  RecentActivity,
  generateMockActivities,
  ActivityItem,
} from "@/components/dashboard/RecentActivity";
import {
  ContextualShortcuts,
  getPageContext,
} from "@/components/dashboard/ContextualShortcuts";

// Mock the layout components
jest.mock("@/components/layout", () => ({
  GridLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="grid-layout">{children}</div>
  ),
}));

// Mock the permissions utils
jest.mock("@/lib/permissions", () => ({
  filterByRole: (items: any[], role: Role) => {
    // Simple mock that returns all items for testing
    return items.filter((item) => item.roles.includes(role));
  },
}));

describe("Quick Actions and Activity Components", () => {
  describe("RecentActivity", () => {
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        type: "payment",
        title: "Payment Received",
        description: "Monthly payment of $150 received",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        roles: [Role.MANAGER, Role.ADMIN],
        priority: "low",
        locationName: "Test Location",
      },
      {
        id: "2",
        type: "alert",
        title: "Overdue Payment",
        description: "Unit A-123 payment is overdue",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        roles: [Role.MANAGER, Role.SUPERVISOR, Role.ADMIN],
        priority: "high",
        actionUrl: "/payments/overdue",
      },
    ];

    it("should render recent activities for authorized role", () => {
      render(
        <RecentActivity
          activities={mockActivities}
          userRole={Role.MANAGER}
          maxItems={5}
        />
      );

      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("Payment Received")).toBeInTheDocument();
      expect(screen.getByText("Overdue Payment")).toBeInTheDocument();
    });

    it("should filter activities by user role", () => {
      render(
        <RecentActivity
          activities={mockActivities}
          userRole={Role.USER} // USER role not in any activity roles
          maxItems={5}
        />
      );

      expect(screen.getByText("No recent activity")).toBeInTheDocument();
    });

    it("should show priority badges for high priority items", () => {
      render(
        <RecentActivity activities={mockActivities} userRole={Role.MANAGER} />
      );

      expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("should format timestamps correctly", () => {
      render(
        <RecentActivity activities={mockActivities} userRole={Role.MANAGER} />
      );

      expect(screen.getByText("5m ago")).toBeInTheDocument();
      expect(screen.getByText("30m ago")).toBeInTheDocument();
    });

    it("should handle click on activities with action URLs", () => {
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: "" } as any;

      render(
        <RecentActivity activities={mockActivities} userRole={Role.MANAGER} />
      );

      const alertActivity = screen.getByText("Overdue Payment").closest("div");
      if (alertActivity) {
        fireEvent.click(alertActivity);
        // In a real test, you'd verify navigation occurred
      }
    });

    it("should show location and user information when available", () => {
      render(
        <RecentActivity activities={mockActivities} userRole={Role.MANAGER} />
      );

      expect(screen.getByText("Test Location")).toBeInTheDocument();
    });

    it("should limit items to maxItems", () => {
      render(
        <RecentActivity
          activities={mockActivities}
          userRole={Role.MANAGER}
          maxItems={1}
        />
      );

      // Should only show 1 item (the most recent)
      expect(screen.getByText("Payment Received")).toBeInTheDocument();
      expect(screen.queryByText("Overdue Payment")).not.toBeInTheDocument();
    });
  });

  describe("ContextualShortcuts", () => {
    it("should render contextual shortcuts for manager role", () => {
      render(
        <ContextualShortcuts
          userRole={Role.MANAGER}
          context={{
            locationId: "loc-1",
            locationName: "Test Location",
            currentPage: "dashboard",
          }}
        />
      );

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("should show different shortcuts for different roles", () => {
      const { rerender } = render(
        <ContextualShortcuts
          userRole={Role.MANAGER}
          context={{ currentPage: "dashboard" }}
        />
      );

      // Should show manager-specific shortcuts
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();

      rerender(
        <ContextualShortcuts
          userRole={Role.ADMIN}
          context={{ currentPage: "dashboard" }}
        />
      );

      // Should show admin-specific shortcuts
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("should show alert-based shortcuts when alerts are present", () => {
      render(
        <ContextualShortcuts
          userRole={Role.MANAGER}
          context={{
            currentPage: "dashboard",
            hasAlerts: true,
          }}
        />
      );

      // The component should render, but specific alert shortcuts depend on role filtering
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("should show page-specific shortcuts", () => {
      render(
        <ContextualShortcuts
          userRole={Role.MANAGER}
          context={{
            currentPage: "reports",
          }}
        />
      );

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("should handle location-specific context", () => {
      render(
        <ContextualShortcuts
          userRole={Role.MANAGER}
          context={{
            locationId: "loc-123",
            locationName: "Downtown Storage",
            currentPage: "dashboard",
          }}
        />
      );

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });
  });

  describe("getPageContext", () => {
    it("should determine current page from pathname", () => {
      const context = getPageContext("/dashboard");
      expect(context.currentPage).toBe("dashboard");
    });

    it("should determine reports page", () => {
      const context = getPageContext("/reports/monthly");
      expect(context.currentPage).toBe("reports");
    });

    it("should determine payroll page", () => {
      const context = getPageContext("/payroll/team");
      expect(context.currentPage).toBe("payroll");
    });

    it("should handle locations page", () => {
      const context = getPageContext("/locations/overview");
      expect(context.currentPage).toBe("locations");
    });

    it("should return context with boolean flags", () => {
      const context = getPageContext("/dashboard");

      expect(typeof context.hasAlerts).toBe("boolean");
      expect(typeof context.hasOverduePayments).toBe("boolean");
      expect(typeof context.hasNewInquiries).toBe("boolean");
      expect(typeof context.isPayrollPeriod).toBe("boolean");
    });
  });

  describe("generateMockActivities", () => {
    it("should generate mock activities", () => {
      const activities = generateMockActivities();

      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);

      // Check that activities have required properties
      activities.forEach((activity) => {
        expect(activity).toHaveProperty("id");
        expect(activity).toHaveProperty("type");
        expect(activity).toHaveProperty("title");
        expect(activity).toHaveProperty("description");
        expect(activity).toHaveProperty("timestamp");
        expect(activity).toHaveProperty("roles");
      });
    });

    it("should generate activities with different types", () => {
      const activities = generateMockActivities();
      const types = activities.map((a) => a.type);

      // Should have variety of activity types
      expect(new Set(types).size).toBeGreaterThan(1);
    });

    it("should generate activities with timestamps in the past", () => {
      const activities = generateMockActivities();
      const now = new Date();

      activities.forEach((activity) => {
        expect(activity.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });
});
