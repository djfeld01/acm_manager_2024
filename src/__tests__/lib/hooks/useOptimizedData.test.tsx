import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useOptimizedData,
  useOptimizedList,
  useMutation,
} from "@/lib/hooks/useOptimizedData";

// Mock the cache module
jest.mock("@/lib/cache/clientCache", () => ({
  useCache: jest.fn(),
  globalCache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
  cacheUtils: {
    invalidatePrefix: jest.fn(),
  },
}));

const mockCacheModule = require("@/lib/cache/clientCache");

describe("useOptimizedData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window focus events
    Object.defineProperty(window, "addEventListener", {
      value: jest.fn(),
      writable: true,
    });

    Object.defineProperty(window, "removeEventListener", {
      value: jest.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should fetch data successfully", async () => {
    const mockData = { id: 1, name: "Test" };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);

    mockCacheModule.useCache.mockReturnValue({
      data: mockData,
      isLoading: false,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    const { result } = renderHook(() =>
      useOptimizedData({
        key: "test-key",
        fetcher: mockFetcher,
      })
    );

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle loading state", () => {
    const mockFetcher = jest.fn();

    mockCacheModule.useCache.mockReturnValue({
      data: null,
      isLoading: true,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    const { result } = renderHook(() =>
      useOptimizedData({
        key: "test-key",
        fetcher: mockFetcher,
      })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("should handle errors", () => {
    const mockError = new Error("Test error");
    const mockFetcher = jest.fn().mockRejectedValue(mockError);

    mockCacheModule.useCache.mockReturnValue({
      data: null,
      isLoading: false,
      isStale: false,
      error: mockError,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    const { result } = renderHook(() =>
      useOptimizedData({
        key: "test-key",
        fetcher: mockFetcher,
      })
    );

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeNull();
  });

  it("should apply data selector", () => {
    const mockData = { id: 1, name: "Test", extra: "data" };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);
    const selector = (data: typeof mockData) => ({
      id: data.id,
      name: data.name,
    });

    mockCacheModule.useCache.mockReturnValue({
      data: mockData,
      isLoading: false,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    const { result } = renderHook(() =>
      useOptimizedData({
        key: "test-key",
        fetcher: mockFetcher,
        select: selector,
      })
    );

    expect(result.current.data).toEqual({ id: 1, name: "Test" });
  });

  it("should keep previous data when requested", () => {
    const mockData1 = { id: 1, name: "Test 1" };
    const mockData2 = { id: 2, name: "Test 2" };
    const mockFetcher = jest.fn();

    const { result, rerender } = renderHook(
      ({ data }) =>
        useOptimizedData({
          key: "test-key",
          fetcher: mockFetcher,
          keepPreviousData: true,
        }),
      {
        initialProps: { data: mockData1 },
      }
    );

    // First render with data
    mockCacheModule.useCache.mockReturnValue({
      data: mockData1,
      isLoading: false,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    rerender({ data: mockData1 });
    expect(result.current.data).toEqual(mockData1);

    // Second render with loading state but should keep previous data
    mockCacheModule.useCache.mockReturnValue({
      data: null,
      isLoading: true,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    rerender({ data: null });
    expect(result.current.data).toEqual(mockData1); // Should keep previous data
  });

  it("should use placeholder data when no data available", () => {
    const placeholderData = { id: 0, name: "Placeholder" };
    const mockFetcher = jest.fn();

    mockCacheModule.useCache.mockReturnValue({
      data: null,
      isLoading: true,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    const { result } = renderHook(() =>
      useOptimizedData({
        key: "test-key",
        fetcher: mockFetcher,
        placeholderData,
      })
    );

    expect(result.current.data).toEqual(placeholderData);
  });

  it("should handle retry logic", async () => {
    const mockFetcher = jest
      .fn()
      .mockRejectedValueOnce(new Error("First failure"))
      .mockRejectedValueOnce(new Error("Second failure"))
      .mockResolvedValueOnce({ id: 1, name: "Success" });

    // Mock the retry behavior
    let retryCount = 0;
    mockCacheModule.useCache.mockImplementation(({ fetcher }) => {
      return {
        data: null,
        isLoading: retryCount < 3,
        isStale: false,
        error: retryCount < 3 ? new Error("Retry error") : null,
        refetch: async () => {
          retryCount++;
          return fetcher();
        },
        invalidate: jest.fn(),
      };
    });

    const { result } = renderHook(() =>
      useOptimizedData({
        key: "test-key",
        fetcher: mockFetcher,
        retry: 3,
        retryDelay: 100,
      })
    );

    expect(result.current.retryCount).toBe(0);

    // Simulate retries
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.retryCount).toBeGreaterThan(0);
    });
  });
});

describe("useOptimizedList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should load list data with pagination", async () => {
    const mockData = {
      items: [{ id: 1 }, { id: 2 }],
      total: 100,
      hasMore: true,
    };
    const mockFetcher = jest.fn().mockResolvedValue(mockData);

    mockCacheModule.useCache.mockReturnValue({
      data: mockData,
      isLoading: false,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    const { result } = renderHook(() =>
      useOptimizedList({
        baseKey: "test-list",
        fetcher: mockFetcher,
        pageSize: 20,
      })
    );

    await waitFor(() => {
      expect(result.current.items).toEqual(mockData.items);
      expect(result.current.total).toBe(100);
      expect(result.current.hasMore).toBe(true);
    });
  });

  it("should load more items when requested", async () => {
    const page1Data = {
      items: [{ id: 1 }, { id: 2 }],
      total: 100,
      hasMore: true,
    };
    const page2Data = {
      items: [{ id: 3 }, { id: 4 }],
      total: 100,
      hasMore: true,
    };

    const mockFetcher = jest
      .fn()
      .mockResolvedValueOnce(page1Data)
      .mockResolvedValueOnce(page2Data);

    let currentData = page1Data;
    mockCacheModule.useCache.mockImplementation(() => ({
      data: currentData,
      isLoading: false,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    }));

    const { result } = renderHook(() =>
      useOptimizedList({
        baseKey: "test-list",
        fetcher: mockFetcher,
      })
    );

    // Initial load
    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    });

    // Load more
    currentData = page2Data;
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toEqual([
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]);
    });
  });

  it("should reset when filters change", async () => {
    const mockFetcher = jest.fn().mockResolvedValue({
      items: [{ id: 1 }],
      total: 1,
      hasMore: false,
    });

    mockCacheModule.useCache.mockReturnValue({
      data: { items: [{ id: 1 }], total: 1, hasMore: false },
      isLoading: false,
      isStale: false,
      error: null,
      refetch: jest.fn(),
      invalidate: jest.fn(),
    });

    const { result, rerender } = renderHook(
      ({ filters }) =>
        useOptimizedList({
          baseKey: "test-list",
          fetcher: mockFetcher,
          filters,
        }),
      {
        initialProps: { filters: { category: "A" } },
      }
    );

    // Change filters
    rerender({ filters: { category: "B" } });

    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: 1 }]);
    });
  });
});

describe("useMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should execute mutation successfully", async () => {
    const mockMutationFn = jest
      .fn()
      .mockResolvedValue({ id: 1, updated: true });
    const mockOnSuccess = jest.fn();

    const { result } = renderHook(() =>
      useMutation({
        mutationFn: mockMutationFn,
        onSuccess: mockOnSuccess,
      })
    );

    await act(async () => {
      const response = await result.current.mutate({ id: 1 });
      expect(response).toEqual({ id: 1, updated: true });
    });

    expect(mockMutationFn).toHaveBeenCalledWith({ id: 1 });
    expect(mockOnSuccess).toHaveBeenCalledWith(
      { id: 1, updated: true },
      { id: 1 }
    );
    expect(result.current.data).toEqual({ id: 1, updated: true });
    expect(result.current.error).toBeNull();
  });

  it("should handle mutation errors", async () => {
    const mockError = new Error("Mutation failed");
    const mockMutationFn = jest.fn().mockRejectedValue(mockError);
    const mockOnError = jest.fn();

    const { result } = renderHook(() =>
      useMutation({
        mutationFn: mockMutationFn,
        onError: mockOnError,
      })
    );

    await act(async () => {
      try {
        await result.current.mutate({ id: 1 });
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockOnError).toHaveBeenCalledWith(mockError, { id: 1 });
    expect(result.current.error).toBe(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it("should invalidate cache after successful mutation", async () => {
    const mockMutationFn = jest.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useMutation({
        mutationFn: mockMutationFn,
        invalidateQueries: ["users", "locations"],
      })
    );

    await act(async () => {
      await result.current.mutate({ id: 1 });
    });

    expect(mockCacheModule.cacheUtils.invalidatePrefix).toHaveBeenCalledWith(
      "users"
    );
    expect(mockCacheModule.cacheUtils.invalidatePrefix).toHaveBeenCalledWith(
      "locations"
    );
  });

  it("should update cache with custom strategy", async () => {
    const mockMutationFn = jest
      .fn()
      .mockResolvedValue({ id: 1, name: "Updated" });
    const mockUpdateCache = jest.fn();

    const { result } = renderHook(() =>
      useMutation({
        mutationFn: mockMutationFn,
        updateCache: mockUpdateCache,
      })
    );

    await act(async () => {
      await result.current.mutate({ id: 1 });
    });

    expect(mockUpdateCache).toHaveBeenCalledWith(
      { id: 1, name: "Updated" },
      { id: 1 }
    );
  });

  it("should reset mutation state", () => {
    const mockMutationFn = jest.fn();

    const { result } = renderHook(() =>
      useMutation({
        mutationFn: mockMutationFn,
      })
    );

    // Set some state
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
