import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Pagination,
  CompactPagination,
  usePagination,
} from "@/components/pagination/Pagination";
import { renderHook, act } from "@testing-library/react";

describe("Pagination Component", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders pagination controls correctly", () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByText("Showing 1-10 of 100 items")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("calls onPageChange when page button is clicked", async () => {
    const user = userEvent.setup();
    render(<Pagination {...defaultProps} />);

    const page2Button = screen.getByText("2");
    await user.click(page2Button);

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables previous button on first page", () => {
    render(<Pagination {...defaultProps} currentPage={1} />);

    const prevButton = screen.getByRole("button", { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<Pagination {...defaultProps} currentPage={10} />);

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("shows ellipsis for large page ranges", () => {
    render(<Pagination {...defaultProps} totalPages={20} currentPage={10} />);

    const ellipsis = screen.getAllByText("…");
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it("handles items per page change", async () => {
    const user = userEvent.setup();
    const onItemsPerPageChange = jest.fn();

    render(
      <Pagination
        {...defaultProps}
        onItemsPerPageChange={onItemsPerPageChange}
      />
    );

    const select = screen.getByRole("combobox");
    await user.click(select);

    const option20 = screen.getByText("20");
    await user.click(option20);

    expect(onItemsPerPageChange).toHaveBeenCalledWith(20);
  });

  it("hides pagination when totalPages is 1", () => {
    const { container } = render(
      <Pagination
        {...defaultProps}
        totalPages={1}
        showTotalItems={false}
        showItemsPerPage={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("handles disabled state", () => {
    render(<Pagination {...defaultProps} disabled />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

describe("CompactPagination Component", () => {
  const defaultProps = {
    currentPage: 5,
    totalPages: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders compact pagination correctly", () => {
    render(<CompactPagination {...defaultProps} />);

    expect(screen.getByText("Page 5 of 10")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("calls onPageChange for previous/next buttons", async () => {
    const user = userEvent.setup();
    render(<CompactPagination {...defaultProps} />);

    const prevButton = screen.getByText("Previous");
    const nextButton = screen.getByText("Next");

    await user.click(prevButton);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(4);

    await user.click(nextButton);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(6);
  });

  it("hides when totalPages is 1", () => {
    const { container } = render(
      <CompactPagination {...defaultProps} totalPages={1} />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe("usePagination Hook", () => {
  it("initializes with correct default values", () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(20);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(20);
  });

  it("calculates pagination correctly", () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 95,
        initialItemsPerPage: 10,
      })
    );

    expect(result.current.totalPages).toBe(10);
    expect(result.current.endIndex).toBe(10);
  });

  it("handles page changes", () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.startIndex).toBe(40);
    expect(result.current.endIndex).toBe(60);
  });

  it("handles items per page changes", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, initialPage: 3 })
    );

    act(() => {
      result.current.setItemsPerPage(10);
    });

    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.totalPages).toBe(10);
    // Should adjust current page to maintain position
    expect(result.current.currentPage).toBe(5);
  });

  it("provides navigation methods", () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, initialPage: 3 })
    );

    act(() => {
      result.current.nextPage();
    });
    expect(result.current.currentPage).toBe(4);

    act(() => {
      result.current.previousPage();
    });
    expect(result.current.currentPage).toBe(3);

    act(() => {
      result.current.firstPage();
    });
    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.lastPage();
    });
    expect(result.current.currentPage).toBe(5);
  });

  it("provides correct navigation flags", () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    // First page
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.canGoNext).toBe(true);

    // Last page
    act(() => {
      result.current.lastPage();
    });
    expect(result.current.canGoPrevious).toBe(true);
    expect(result.current.canGoNext).toBe(false);
  });

  it("adjusts current page when it exceeds total pages", () => {
    const { result, rerender } = renderHook(
      ({ totalItems }) => usePagination({ totalItems }),
      { initialProps: { totalItems: 100 } }
    );

    act(() => {
      result.current.setPage(5);
    });
    expect(result.current.currentPage).toBe(5);

    // Reduce total items so current page exceeds total pages
    rerender({ totalItems: 50 });
    expect(result.current.currentPage).toBe(3); // Should adjust to last page
  });

  it("handles edge cases", () => {
    const { result } = renderHook(() => usePagination({ totalItems: 0 }));

    expect(result.current.totalPages).toBe(0);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(0);
  });

  it("prevents invalid page navigation", () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    // Try to go to invalid pages
    act(() => {
      result.current.setPage(0);
    });
    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.setPage(10);
    });
    expect(result.current.currentPage).toBe(1); // Should not change

    act(() => {
      result.current.setPage(-1);
    });
    expect(result.current.currentPage).toBe(1); // Should not change
  });
});
