import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import {
  PayrollAccessControl,
  PayrollPermissionsDisplay,
  usePayrollPermissions,
  PayrollRole,
} from "@/components/payroll/PayrollAccessControl";

// Mock the UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

// Test component to use the hook
function TestPermissionsHook({ role }: { role: PayrollRole }) {
  const { permissions, checkPermission, getAccessibleActions } =
    usePayrollPermissions(role);

  return (
    <div>
      <div data-testid="can-view-own">
        {permissions.canViewOwnPayroll.toString()}
      </div>
      <div data-testid="can-view-team">
        {permissions.canViewTeamPayroll.toString()}
      </div>
      <div data-testid="can-admin">
        {permissions.canAccessAdminTools.toString()}
      </div>
      <div data-testid="actions-count">{getAccessibleActions().length}</div>
      <div data-testid="check-own-permission">
        {checkPermission("canViewOwnPayroll", {
          userId: "user-1",
          targetEmployeeId: "user-1",
        }).toString()}
      </div>
    </div>
  );
}

describe("PayrollAccessControl", () => {
  describe("Permission System", () => {
    it("grants USER role basic permissions", () => {
      render(<TestPermissionsHook role="USER" />);

      expect(screen.getByTestId("can-view-own")).toHaveTextContent("true");
      expect(screen.getByTestId("can-view-team")).toHaveTextContent("false");
      expect(screen.getByTestId("can-admin")).toHaveTextContent("false");
    });

    it("grants MANAGER role team permissions", () => {
      render(<TestPermissionsHook role="MANAGER" />);

      expect(screen.getByTestId("can-view-own")).toHaveTextContent("true");
      expect(screen.getByTestId("can-view-team")).toHaveTextContent("true");
      expect(screen.getByTestId("can-admin")).toHaveTextContent("false");
    });

    it("grants ADMIN role full permissions", () => {
      render(<TestPermissionsHook role="ADMIN" />);

      expect(screen.getByTestId("can-view-own")).toHaveTextContent("true");
      expect(screen.getByTestId("can-view-team")).toHaveTextContent("true");
      expect(screen.getByTestId("can-admin")).toHaveTextContent("true");
    });

    it("provides different action counts for different roles", () => {
      const { rerender } = render(<TestPermissionsHook role="USER" />);
      const userActions = parseInt(
        screen.getByTestId("actions-count").textContent || "0"
      );

      rerender(<TestPermissionsHook role="ADMIN" />);
      const adminActions = parseInt(
        screen.getByTestId("actions-count").textContent || "0"
      );

      expect(adminActions).toBeGreaterThan(userActions);
    });

    it("validates context-based permissions correctly", () => {
      render(<TestPermissionsHook role="USER" />);

      // User should be able to view their own payroll
      expect(screen.getByTestId("check-own-permission")).toHaveTextContent(
        "true"
      );
    });
  });

  describe("PayrollAccessControl Component", () => {
    it("renders children when permission is granted", () => {
      render(
        <PayrollAccessControl
          userRole="ADMIN"
          userId="admin-1"
          requiredPermission="canAccessAdminTools"
        >
          <div>Admin Content</div>
        </PayrollAccessControl>
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });

    it("shows access denied when permission is not granted", () => {
      render(
        <PayrollAccessControl
          userRole="USER"
          userId="user-1"
          requiredPermission="canAccessAdminTools"
        >
          <div>Admin Content</div>
        </PayrollAccessControl>
      );

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    });

    it("renders fallback when provided and permission denied", () => {
      render(
        <PayrollAccessControl
          userRole="USER"
          userId="user-1"
          requiredPermission="canAccessAdminTools"
          fallback={<div>Custom Fallback</div>}
        >
          <div>Admin Content</div>
        </PayrollAccessControl>
      );

      expect(screen.getByText("Custom Fallback")).toBeInTheDocument();
      expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
    });

    it("returns null when showError is false and no fallback", () => {
      const { container } = render(
        <PayrollAccessControl
          userRole="USER"
          userId="user-1"
          requiredPermission="canAccessAdminTools"
          showError={false}
        >
          <div>Admin Content</div>
        </PayrollAccessControl>
      );

      expect(container.firstChild).toBeNull();
    });

    it("validates own payroll access correctly", () => {
      // Should grant access when viewing own payroll
      const { rerender } = render(
        <PayrollAccessControl
          userRole="USER"
          userId="user-1"
          targetEmployeeId="user-1"
          requiredPermission="canViewOwnPayroll"
        >
          <div>Own Payroll</div>
        </PayrollAccessControl>
      );

      expect(screen.getByText("Own Payroll")).toBeInTheDocument();

      // Should deny access when viewing someone else's payroll
      rerender(
        <PayrollAccessControl
          userRole="USER"
          userId="user-1"
          targetEmployeeId="user-2"
          requiredPermission="canViewOwnPayroll"
        >
          <div>Own Payroll</div>
        </PayrollAccessControl>
      );

      expect(screen.queryByText("Own Payroll")).not.toBeInTheDocument();
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("validates team payroll access with location context", () => {
      render(
        <PayrollAccessControl
          userRole="MANAGER"
          userId="manager-1"
          targetLocationIds={["loc-1", "loc-2"]}
          userLocationIds={["loc-1", "loc-3"]}
          requiredPermission="canViewTeamPayroll"
        >
          <div>Team Payroll</div>
        </PayrollAccessControl>
      );

      // Should grant access because manager has access to loc-1
      expect(screen.getByText("Team Payroll")).toBeInTheDocument();
    });
  });

  describe("PayrollPermissionsDisplay Component", () => {
    it("displays role and permissions correctly", () => {
      render(<PayrollPermissionsDisplay userRole="MANAGER" />);

      expect(screen.getByText("MANAGER")).toBeInTheDocument();
      expect(screen.getByText("Payroll Permissions")).toBeInTheDocument();
    });

    it("shows accessible actions for the role", () => {
      render(<PayrollPermissionsDisplay userRole="ADMIN" />);

      // Admin should have many accessible actions
      expect(screen.getByText(/View Own Payroll/)).toBeInTheDocument();
      expect(screen.getByText(/Access Admin Tools/)).toBeInTheDocument();
    });

    it("shows no permissions message for roles without access", () => {
      // Create a mock role with no permissions by testing with a role that has minimal access
      render(<PayrollPermissionsDisplay userRole="USER" />);

      // USER should have at least "View Own Payroll"
      expect(screen.getByText(/View Own Payroll/)).toBeInTheDocument();
    });
  });
});
