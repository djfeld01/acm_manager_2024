import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import {
  LoadingSpinner,
  PageLoading,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  DashboardSkeleton,
  InlineLoading,
  LoadingOverlay,
} from "@/components/shared/LoadingStates";

describe("LoadingStates", () => {
  describe("LoadingSpinner", () => {
    it("should render with default size", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector(".animate-spin");

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("h-6", "w-6");
    });

    it("should render with custom size", () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const spinner = container.querySelector(".animate-spin");

      expect(spinner).toHaveClass("h-8", "w-8");
    });

    it("should apply custom className", () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);
      const spinner = container.querySelector(".animate-spin");

      expect(spinner).toHaveClass("custom-class");
    });
  });

  describe("PageLoading", () => {
    it("should render with default title", () => {
      render(<PageLoading />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render with custom title and description", () => {
      render(
        <PageLoading
          title="Custom Loading"
          description="Please wait while we load your data"
        />
      );

      expect(screen.getByText("Custom Loading")).toBeInTheDocument();
      expect(
        screen.getByText("Please wait while we load your data")
      ).toBeInTheDocument();
    });

    it("should render spinner", () => {
      const { container } = render(<PageLoading />);
      const spinner = container.querySelector(".animate-spin");

      expect(spinner).toBeInTheDocument();
    });
  });

  describe("CardSkeleton", () => {
    it("should render header and content by default", () => {
      const { container } = render(<CardSkeleton />);

      // Should have header skeletons
      const headerSkeletons = container.querySelectorAll(
        '[data-testid="skeleton"]'
      );
      expect(headerSkeletons.length).toBeGreaterThan(0);
    });

    it("should not render header when showHeader is false", () => {
      const { container } = render(<CardSkeleton showHeader={false} />);

      // Should not have CardHeader
      expect(
        container.querySelector('[class*="CardHeader"]')
      ).not.toBeInTheDocument();
    });

    it("should render correct number of content lines", () => {
      const { container } = render(<CardSkeleton contentLines={5} />);

      // Should have 5 content skeleton lines plus header skeletons
      const skeletons = container.querySelectorAll(".h-4");
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("TableSkeleton", () => {
    it("should render correct number of rows and columns", () => {
      const { container } = render(<TableSkeleton rows={3} columns={4} />);

      // Should have header row + 3 data rows = 4 total rows
      const rows = container.querySelectorAll(".flex.space-x-4");
      expect(rows.length).toBe(4); // 1 header + 3 data rows
    });

    it("should not render header when showHeader is false", () => {
      const { container } = render(
        <TableSkeleton showHeader={false} rows={3} />
      );

      // Should only have data rows
      const rows = container.querySelectorAll(".flex.space-x-4");
      expect(rows.length).toBe(3);
    });
  });

  describe("ListSkeleton", () => {
    it("should render correct number of items", () => {
      const { container } = render(<ListSkeleton items={5} />);

      const items = container.querySelectorAll(".flex.items-center.space-x-3");
      expect(items.length).toBe(5);
    });

    it("should render avatars when showAvatar is true", () => {
      const { container } = render(
        <ListSkeleton items={3} showAvatar={true} />
      );

      const avatars = container.querySelectorAll(".rounded-full");
      expect(avatars.length).toBe(3);
    });

    it("should not render avatars when showAvatar is false", () => {
      const { container } = render(
        <ListSkeleton items={3} showAvatar={false} />
      );

      const avatars = container.querySelectorAll(".rounded-full");
      expect(avatars.length).toBe(0);
    });
  });

  describe("DashboardSkeleton", () => {
    it("should render header skeleton", () => {
      const { container } = render(<DashboardSkeleton />);

      // Should have header skeletons
      const headerSkeletons = container.querySelectorAll(
        ".space-y-2 > .h-8, .space-y-2 > .h-4"
      );
      expect(headerSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it("should render correct number of card skeletons", () => {
      const { container } = render(<DashboardSkeleton cards={4} />);

      // Should have grid with cards
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });
  });

  describe("InlineLoading", () => {
    it("should render with default text", () => {
      render(<InlineLoading />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render with custom text", () => {
      render(<InlineLoading text="Saving..." />);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should render spinner", () => {
      const { container } = render(<InlineLoading />);
      const spinner = container.querySelector(".animate-spin");

      expect(spinner).toBeInTheDocument();
    });
  });

  describe("LoadingOverlay", () => {
    it("should render children when not loading", () => {
      render(
        <LoadingOverlay isLoading={false}>
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("should render overlay when loading", () => {
      render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render custom loading text", () => {
      render(
        <LoadingOverlay isLoading={true} loadingText="Processing...">
          <div>Content</div>
        </LoadingOverlay>
      );

      expect(screen.getByText("Processing...")).toBeInTheDocument();
    });

    it("should render spinner when loading", () => {
      const { container } = render(
        <LoadingOverlay isLoading={true}>
          <div>Content</div>
        </LoadingOverlay>
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });
});
