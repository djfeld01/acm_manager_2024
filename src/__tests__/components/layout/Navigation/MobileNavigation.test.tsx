import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Role } from "@/db/schema/user";
import MobileNavigation from "@/components/layout/Navigation/MobileNavigation";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("MobileNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("should not render when session is loading", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
      update: jest.fn(),
    });

    const { container } = render(<MobileNavigation />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when user is not authenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    const { container } = render(<MobileNavigation />);

    expect(container.firstChild).toBeNull();
  });

  it("should render mobile header and bottom navigation for authenticated user", () => {
    const mockUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: Role.MANAGER,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNavigation />);

    // Check header
    expect(screen.getByText("ACM Manager")).toBeInTheDocument();
    expect(screen.getByText("ACM")).toBeInTheDocument();

    // Check bottom navigation items
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Payroll")).toBeInTheDocument();
    expect(screen.getByText("Locations")).toBeInTheDocument();

    // Check user avatar
    expect(screen.getByText("TU")).toBeInTheDocument(); // User initials
  });

  it("should show hamburger menu when there are secondary nav items", () => {
    const mockUser = {
      id: "1",
      name: "Test Admin",
      email: "admin@example.com",
      role: Role.ADMIN, // Admin has more nav items
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNavigation />);

    // Should show hamburger menu button
    expect(
      screen.getByRole("button", { name: /open menu/i })
    ).toBeInTheDocument();
  });

  it("should highlight active navigation item", () => {
    const mockUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: Role.MANAGER,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    mockUsePathname.mockReturnValue("/payroll");

    render(<MobileNavigation />);

    // The payroll link should have active styling
    const payrollLink = screen.getByRole("link", { name: /payroll/i });
    expect(payrollLink).toHaveClass("text-primary");
  });

  it("should open hamburger menu when clicked", () => {
    const mockUser = {
      id: "1",
      name: "Test Admin",
      email: "admin@example.com",
      role: Role.ADMIN,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNavigation />);

    // Click hamburger menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    fireEvent.click(menuButton);

    // Should show menu content
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(
      screen.getByText("Additional navigation options")
    ).toBeInTheDocument();
  });

  it("should show user profile dropdown when avatar clicked", () => {
    const mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: Role.MANAGER,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNavigation />);

    // Click user avatar
    const avatarButton = screen.getByRole("button", { name: /john doe/i });
    fireEvent.click(avatarButton);

    // Should show profile dropdown
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("should have proper touch targets for mobile", () => {
    const mockUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: Role.MANAGER,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<MobileNavigation />);

    // Bottom navigation items should have minimum 44px height
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveClass("min-h-[44px]");
  });
});
