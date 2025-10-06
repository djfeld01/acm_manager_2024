"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useOptimizedData,
  useOptimizedList,
  useMutation,
  useOptimizedDataWithPrefetch,
} from "@/lib/hooks/useOptimizedData";
import { cacheUtils, globalCache } from "@/lib/cache/clientCache";
import { prefetchManager } from "@/lib/prefetch/strategies";
import {
  Activity,
  Database,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  MapPin,
} from "lucide-react";

// Mock API functions for demo
const mockApi = {
  fetchUser: async (id: string) => {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 1000 + 500)
    );
    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      role: "manager",
      lastActive: new Date().toISOString(),
    };
  },

  fetchUsers: async (page: number, pageSize: number, filters: any = {}) => {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 800 + 300)
    );

    const startId = (page - 1) * pageSize + 1;
    const items = Array.from({ length: pageSize }, (_, i) => ({
      id: `user-${startId + i}`,
      name: `User ${startId + i}`,
      email: `user${startId + i}@example.com`,
      role: ["manager", "admin", "employee"][i % 3],
      status: Math.random() > 0.2 ? "active" : "inactive",
    }));

    return {
      items,
      total: 1000,
      hasMore: page * pageSize < 1000,
    };
  },

  updateUser: async (userData: any) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { ...userData, updatedAt: new Date().toISOString() };
  },

  fetchDashboardStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      totalUsers: 1000,
      activeUsers: 850,
      totalRevenue: 2500000,
      growth: 12.5,
      lastUpdated: new Date().toISOString(),
    };
  },

  fetchRealtimeData: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      activeConnections: Math.floor(Math.random() * 100) + 50,
      requestsPerSecond: Math.floor(Math.random() * 50) + 20,
      timestamp: new Date().toISOString(),
    };
  },
};

export default function OptimizationDemo() {
  const [activeTab, setActiveTab] = useState("caching");
  const [selectedUserId, setSelectedUserId] = useState("1");
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(cacheUtils.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Performance Optimization Demo
        </h1>
        <p className="text-muted-foreground">
          Showcase of caching, prefetching, and loading optimization strategies
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">
              {cacheStats?.global?.size || 0}
            </div>
            <div className="text-sm text-muted-foreground">Cached Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">
              {((cacheStats?.global?.hitRate || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">
              {cacheStats?.global?.staleCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">Stale Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {prefetchManager.getStats().enabled ? "ON" : "OFF"}
            </div>
            <div className="text-sm text-muted-foreground">Prefetching</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="caching">Smart Caching</TabsTrigger>
          <TabsTrigger value="prefetching">Prefetching</TabsTrigger>
          <TabsTrigger value="optimistic">Optimistic Updates</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Sync</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="caching" className="space-y-6">
          <CachingDemo
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
          />
        </TabsContent>

        <TabsContent value="prefetching" className="space-y-6">
          <PrefetchingDemo />
        </TabsContent>

        <TabsContent value="optimistic" className="space-y-6">
          <OptimisticUpdatesDemo />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealtimeSyncDemo />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Smart Caching Demo
function CachingDemo({
  selectedUserId,
  setSelectedUserId,
}: {
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
}) {
  const {
    data: userData,
    isLoading: userLoading,
    isStale: userStale,
    error: userError,
    refetch: refetchUser,
  } = useOptimizedData({
    key: `user-${selectedUserId}`,
    fetcher: () => mockApi.fetchUser(selectedUserId),
    staleTime: 10000, // 10 seconds
    cacheTime: 60000, // 1 minute
  });

  const {
    items: users,
    isLoading: usersLoading,
    loadMore,
    hasMore,
    refresh: refreshUsers,
  } = useOptimizedList({
    baseKey: "users-list",
    fetcher: mockApi.fetchUsers,
    pageSize: 10,
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Individual User Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((id) => (
              <Button
                key={id}
                variant={
                  selectedUserId === id.toString() ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedUserId(id.toString())}
              >
                User {id}
              </Button>
            ))}
          </div>

          {userLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading user data...
            </div>
          )}

          {userData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{userData.name}</h3>
                <div className="flex items-center gap-2">
                  {userStale && (
                    <Badge variant="outline" className="text-orange-600">
                      Stale
                    </Badge>
                  )}
                  <Badge variant="outline">{userData.role}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
              <p className="text-xs text-muted-foreground">
                Last active:{" "}
                {new Date(userData.lastActive).toLocaleTimeString()}
              </p>
            </div>
          )}

          {userError && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Error loading user data
            </div>
          )}

          <Button onClick={refetchUser} size="sm" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh User
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Paginated List Cache
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {usersLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading more users...
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={loadMore}
              disabled={!hasMore || usersLoading}
              size="sm"
              className="flex-1"
            >
              Load More ({users.length} loaded)
            </Button>
            <Button onClick={refreshUsers} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Prefetching Demo
function PrefetchingDemo() {
  const {
    data: dashboardData,
    isLoading,
    hoverProps,
  } = useOptimizedDataWithPrefetch({
    key: "dashboard-stats",
    fetcher: mockApi.fetchDashboardStats,
    prefetchOnHover: true,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hover-based Prefetching</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hover over the cards below to prefetch data before clicking
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((id) => (
              <Card
                key={id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                {...hoverProps}
              >
                <CardContent className="p-4 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-semibold">Dashboard {id}</div>
                  <div className="text-sm text-muted-foreground">
                    Hover to prefetch
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading dashboard data...
            </div>
          )}

          {dashboardData && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Dashboard Statistics</h3>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  Total Users: {dashboardData.totalUsers.toLocaleString()}
                </div>
                <div>
                  Active Users: {dashboardData.activeUsers.toLocaleString()}
                </div>
                <div>
                  Revenue: ${dashboardData.totalRevenue.toLocaleString()}
                </div>
                <div>Growth: {dashboardData.growth}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Optimistic Updates Demo
function OptimisticUpdatesDemo() {
  const [optimisticUsers, setOptimisticUsers] = useState([
    { id: "1", name: "John Doe", status: "active" },
    { id: "2", name: "Jane Smith", status: "inactive" },
    { id: "3", name: "Bob Johnson", status: "active" },
  ]);

  const updateUserMutation = useMutation({
    mutationFn: mockApi.updateUser,
    onSuccess: (data, variables) => {
      console.log("User updated successfully:", data);
    },
    onError: (error, variables) => {
      // Revert optimistic update on error
      setOptimisticUsers((prev) =>
        prev.map((user) =>
          user.id === variables.id
            ? {
                ...user,
                status: user.status === "active" ? "inactive" : "active",
              }
            : user
        )
      );
    },
  });

  const toggleUserStatus = (userId: string) => {
    // Optimistic update
    setOptimisticUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "active" ? "inactive" : "active",
            }
          : user
      )
    );

    // Actual mutation
    const user = optimisticUsers.find((u) => u.id === userId);
    if (user) {
      updateUserMutation.mutate({
        id: userId,
        status: user.status === "active" ? "inactive" : "active",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optimistic Updates</CardTitle>
        <p className="text-sm text-muted-foreground">
          UI updates immediately, then syncs with server
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {optimisticUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">ID: {user.id}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={user.status === "active" ? "default" : "secondary"}
              >
                {user.status}
              </Badge>
              <Button
                size="sm"
                onClick={() => toggleUserStatus(user.id)}
                disabled={updateUserMutation.isLoading}
              >
                {updateUserMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Toggle"
                )}
              </Button>
            </div>
          </div>
        ))}

        {updateUserMutation.error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            Update failed: {updateUserMutation.error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Real-time Sync Demo
function RealtimeSyncDemo() {
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);

    const interval = setInterval(async () => {
      try {
        const data = await mockApi.fetchRealtimeData();
        setRealtimeData(data);
      } catch (error) {
        console.error("Failed to fetch realtime data:", error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Real-time Data Sync
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Data updates every 2 seconds automatically
        </p>
      </CardHeader>
      <CardContent>
        {realtimeData ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {realtimeData.activeConnections}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Connections
              </div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {realtimeData.requestsPerSecond}
              </div>
              <div className="text-sm text-muted-foreground">
                Requests/Second
              </div>
            </div>
            <div className="col-span-2 text-xs text-muted-foreground text-center">
              Last updated:{" "}
              {new Date(realtimeData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Connecting to real-time data...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Performance Demo
function PerformanceDemo() {
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const stats = cacheUtils.getStats();
      const prefetchStats = prefetchManager.getStats();

      setPerformanceMetrics({
        cache: stats,
        prefetch: prefetchStats,
        memory: (performance as any).memory
          ? {
              used: Math.round(
                (performance as any).memory.usedJSHeapSize / 1024 / 1024
              ),
              total: Math.round(
                (performance as any).memory.totalJSHeapSize / 1024 / 1024
              ),
            }
          : null,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    cacheUtils.invalidateAll();
    globalCache.clear();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <div className="flex gap-2">
            <Button onClick={clearCache} size="sm" variant="outline">
              Clear Cache
            </Button>
            <Button
              onClick={() =>
                prefetchManager.setEnabled(!prefetchManager.getStats().enabled)
              }
              size="sm"
              variant="outline"
            >
              Toggle Prefetching
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {performanceMetrics && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-semibold">Cache Statistics</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Global Cache Size:{" "}
                    {performanceMetrics.cache.global?.size || 0}
                  </div>
                  <div>
                    Query Cache Size:{" "}
                    {performanceMetrics.cache.query?.size || 0}
                  </div>
                  <div>
                    Hit Rate:{" "}
                    {(
                      (performanceMetrics.cache.global?.hitRate || 0) * 100
                    ).toFixed(1)}
                    %
                  </div>
                  <div>
                    Stale Items:{" "}
                    {performanceMetrics.cache.global?.staleCount || 0}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Prefetch Status</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    Enabled:
                    {performanceMetrics.prefetch.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    Network:{" "}
                    {performanceMetrics.prefetch.networkConditions?.priority ||
                      "Unknown"}
                  </div>
                  <div>
                    Should Prefetch:{" "}
                    {performanceMetrics.prefetch.networkConditions
                      ?.shouldPrefetch
                      ? "Yes"
                      : "No"}
                  </div>
                </div>
              </div>

              {performanceMetrics.memory && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Memory Usage</h4>
                  <div className="space-y-1 text-sm">
                    <div>Used: {performanceMetrics.memory.used} MB</div>
                    <div>Total: {performanceMetrics.memory.total} MB</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (performanceMetrics.memory.used /
                              performanceMetrics.memory.total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
