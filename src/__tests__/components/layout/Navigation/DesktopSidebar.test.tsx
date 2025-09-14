import { describe, it, expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Role } from "@/db/schema/user";
import DesktopSidebar from "@/components/layout/Navigation/DesktopSidebar";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// Mock the sidebar hook
jest.mock("@/components/ui/sidebar", () => ({
  ...jest.requireActual("@/components/ui/sidebar"),
  useSidebar: () => ({ state: "expanded" }),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("DesktopSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("should render loading state when session is loading", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
      update: jest.fn(),
    });

    render(<DesktopSidebar />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should not render when user is not authenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    const { container } = render(<DesktopSidebar />);

    expect(container.firstChild).toBeNull();
  });

  it("should render navigation items for manager role", () => {
    const mockUser = {
      id: "1",
      name: "Test Manager",
      email: "manager@example.com",
      role: Role.MANAGER,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<DesktopSidebar />);

    expect(screen.getByText("ACM Manager")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Payroll")).toBeInTheDocument();
    expect(screen.getByText("Locations")).toBeInTheDocument();
    expect(screen.getByText("Test Manager")).toBeInTheDocument();
  });

  it("should render admin-only items for admin role", () => {
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

    render(<DesktopSidebar />);

    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("should not render admin items for manager role", () => {
    const mockUser = {
      id: "1",
      name: "Test Manager",
      email: "manager@example.com",
      role: Role.MANAGER,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<DesktopSidebar />);

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("should show user initials when no avatar image", () => {
    const mockUser = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: Role.MANAGER,
      image: null,
      facilities: [],
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: "2024-12-31" },
      status: "authenticated",
      update: jest.fn(),
    });

    render(<DesktopSidebar />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });
});
