import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import AppShell from "@/components/layout/AppShell";

// Mock the mobile hook
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(),
}));

// Mock navigation components
jest.mock("@/components/layout/Navigation", () => ({
  DesktopSidebarV2: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="desktop-sidebar">{children}</div>
  ),
  MobileNavigation: () => <div data-testid="mobile-navigation">Mobile Nav</div>,
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

// Mock navigation context
jest.mock("@/lib/navigation/NavigationContext", () => ({
  NavigationProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="navigation-provider">{children}</div>
  ),
}));

// Mock sidebar components
jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-provider">{children}</div>
  ),
  SidebarInset: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="sidebar-inset" className={className}>
      {children}
    </div>
  ),
  SidebarTrigger: ({ className }: { className?: string }) => (
    <button data-testid="sidebar-trigger" className={className}>
      Toggle
    </button>
  ),
}));

import { useIsMobile } from "@/hooks/use-mobile";

const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>;

describe("AppShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Desktop Layout", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it("should render desktop layout when not mobile", () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByTestId("navigation-provider")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
      expect(screen.getByTestId("desktop-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-inset")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.queryByTestId("mobile-navigation")).not.toBeInTheDocument();
    });

    it("should show header with breadcrumbs and sidebar trigger by default", () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    });

    it("should hide breadcrumbs when showBreadcrumbs is false", () => {
      render(
        <AppShell showBreadcrumbs={false}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.queryByTestId("breadcrumbs")).not.toBeInTheDocument();
      expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    });

    it("should hide sidebar trigger when showSidebarTrigger is false", () => {
      render(
        <AppShell showSidebarTrigger={false}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
      expect(screen.queryByTestId("sidebar-trigger")).not.toBeInTheDocument();
    });

    it("should render header content when provided", () => {
      render(
        <AppShell headerContent={<div>Header Actions</div>}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByText("Header Actions")).toBeInTheDocument();
    });

    it("should apply custom className to SidebarInset", () => {
      render(
        <AppShell className="custom-class">
          <div>Test Content</div>
        </AppShell>
      );

      const sidebarInset = screen.getByTestId("sidebar-inset");
      expect(sidebarInset).toHaveClass("custom-class");
    });

    it("should not render header when all header options are disabled", () => {
      render(
        <AppShell
          showBreadcrumbs={false}
          showSidebarTrigger={false}
          headerContent={undefined}
        >
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.queryByRole("banner")).not.toBeInTheDocument();
      expect(screen.queryByTestId("breadcrumbs")).not.toBeInTheDocument();
      expect(screen.queryByTestId("sidebar-trigger")).not.toBeInTheDocument();
    });
  });

  describe("Mobile Layout", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it("should render mobile layout when on mobile", () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByTestId("navigation-provider")).toBeInTheDocument();
      expect(screen.getByTestId("mobile-navigation")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
      expect(screen.queryByTestId("desktop-sidebar")).not.toBeInTheDocument();
      expect(screen.queryByTestId("sidebar-provider")).not.toBeInTheDocument();
    });

    it("should apply custom className to mobile container", () => {
      const { container } = render(
        <AppShell className="mobile-custom">
          <div>Test Content</div>
        </AppShell>
      );

      const mobileContainer = container.querySelector(".mobile-custom");
      expect(mobileContainer).toBeInTheDocument();
    });

    it("should add bottom padding for mobile navigation", () => {
      const { container } = render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      );

      const mainElement = container.querySelector("main");
      expect(mainElement).toHaveClass("pb-16");
    });

    it("should ignore desktop-specific props on mobile", () => {
      render(
        <AppShell
          showBreadcrumbs={true}
          showSidebarTrigger={true}
          headerContent={<div>Header Actions</div>}
        >
          <div>Test Content</div>
        </AppShell>
      );

      // These should not appear in mobile layout
      expect(screen.queryByTestId("breadcrumbs")).not.toBeInTheDocument();
      expect(screen.queryByTestId("sidebar-trigger")).not.toBeInTheDocument();
      expect(screen.queryByText("Header Actions")).not.toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should switch layouts when mobile state changes", () => {
      mockUseIsMobile.mockReturnValue(false);

      const { rerender } = render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByTestId("desktop-sidebar")).toBeInTheDocument();
      expect(screen.queryByTestId("mobile-navigation")).not.toBeInTheDocument();

      mockUseIsMobile.mockReturnValue(true);

      rerender(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.queryByTestId("desktop-sidebar")).not.toBeInTheDocument();
      expect(screen.getByTestId("mobile-navigation")).toBeInTheDocument();
    });
  });
});
