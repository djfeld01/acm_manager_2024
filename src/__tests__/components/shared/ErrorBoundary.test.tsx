import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary, {
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
  withErrorBoundary,
} from "@/components/shared/ErrorBoundary";

// Component that throws an error for testing
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic ErrorBoundary", () => {
    it("should render children when there is no error", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });

    it("should render error fallback when child throws error", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByText("A component on this page encountered an error.")
      ).toBeInTheDocument();
    });

    it("should call onError callback when error occurs", () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should reset error when retry button is clicked", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      const retryButton = screen.getByRole("button", { name: /try again/i });
      fireEvent.click(retryButton);

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText("No error")).toBeInTheDocument();
    });
  });

  describe("Error Boundary Levels", () => {
    it("should render page-level error boundary correctly", () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Page Error")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This page encountered an error and could not be displayed."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go home/i })
      ).toBeInTheDocument();
    });

    it("should render section-level error boundary correctly", () => {
      render(
        <ErrorBoundary level="section">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Section Error")).toBeInTheDocument();
      expect(
        screen.getByText(
          "This section encountered an error and could not be loaded."
        )
      ).toBeInTheDocument();
    });

    it("should render component-level error boundary correctly", () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByText("A component on this page encountered an error.")
      ).toBeInTheDocument();
    });
  });

  describe("Error Details", () => {
    it("should show error details when showErrorDetails is true", () => {
      render(
        <ErrorBoundary showErrorDetails={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const showDetailsButton = screen.getByRole("button", {
        name: /show error details/i,
      });
      fireEvent.click(showDetailsButton);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
      expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    });

    it("should not show error details when showErrorDetails is false", () => {
      render(
        <ErrorBoundary showErrorDetails={false}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.queryByRole("button", { name: /show error details/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Specialized Error Boundaries", () => {
    it("should render PageErrorBoundary correctly", () => {
      render(
        <PageErrorBoundary>
          <ThrowError shouldThrow={true} />
        </PageErrorBoundary>
      );

      expect(screen.getByText("Page Error")).toBeInTheDocument();
    });

    it("should render SectionErrorBoundary correctly", () => {
      render(
        <SectionErrorBoundary>
          <ThrowError shouldThrow={true} />
        </SectionErrorBoundary>
      );

      expect(screen.getByText("Section Error")).toBeInTheDocument();
    });

    it("should render ComponentErrorBoundary correctly", () => {
      render(
        <ComponentErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ComponentErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  describe("withErrorBoundary HOC", () => {
    it("should wrap component with error boundary", () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        level: "component",
      });

      render(<WrappedComponent shouldThrow={true} />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should render wrapped component normally when no error", () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        level: "component",
      });

      render(<WrappedComponent shouldThrow={false} />);

      expect(screen.getByText("No error")).toBeInTheDocument();
    });
  });

  describe("Error Actions", () => {
    it("should handle go home action for page-level errors", () => {
      // Mock window.location
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      fireEvent.click(goHomeButton);

      expect(mockLocation.href).toBe("/");
    });
  });
});
