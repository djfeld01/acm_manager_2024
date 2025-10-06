"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  CompactPagination,
  usePagination,
} from "@/components/pagination/Pagination";
import {
  VirtualList,
  VirtualGrid,
} from "@/components/virtualization/VirtualList";
import {
  InfiniteScroll,
  useInfiniteScroll,
} from "@/components/pagination/InfiniteScroll";
import { DataTable, Column } from "@/components/data-table/DataTable";
import { cn } from "@/lib/utils";
import {
  Table2,
  List,
  Grid3X3,
  Infinity,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Zap,
  Clock,
  Database,
} from "lucide-react";

// Mock data generators
interface MockUser {
  id: number;
  name: string;
  email: string;
  role: string;
  location: string;
  joinDate: string;
  salary: number;
  status: "active" | "inactive";
}

interface MockLocation {
  id: number;
  name: string;
  city: string;
  state: string;
  revenue: number;
  occupancy: number;
  units: number;
}

const generateMockUsers = (count: number): MockUser[] => {
  const roles = ["Manager", "Assistant", "Supervisor", "Admin"];
  const locations = ["Austin", "Dallas", "Houston", "San Antonio"];
  const statuses: ("active" | "inactive")[] = ["active", "inactive"];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: roles[i % roles.length],
    location: locations[i % locations.length],
    joinDate: new Date(2020 + (i % 4), i % 12, (i % 28) + 1)
      .toISOString()
      .split("T")[0],
    salary: 40000 + i * 1000 + Math.floor(Math.random() * 20000),
    status: statuses[i % 2],
  }));
};

const generateMockLocations = (count: number): MockLocation[] => {
  const cities = [
    "Austin",
    "Dallas",
    "Houston",
    "San Antonio",
    "Fort Worth",
    "El Paso",
  ];
  const states = ["TX", "CA", "FL", "NY"];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Storage Center ${i + 1}`,
    city: cities[i % cities.length],
    state: states[i % states.length],
    revenue: 50000 + Math.floor(Math.random() * 100000),
    occupancy: 60 + Math.floor(Math.random() * 40),
    units: 100 + Math.floor(Math.random() * 400),
  }));
};

export default function PaginationDemo() {
  const [activeTab, setActiveTab] = useState("pagination");

  // Generate large datasets
  const allUsers = useMemo(() => generateMockUsers(10000), []);
  const allLocations = useMemo(() => generateMockLocations(1000), []);

  // Pagination demo state
  const userPagination = usePagination({
    totalItems: allUsers.length,
    initialItemsPerPage: 10,
  });

  const paginatedUsers = useMemo(() => {
    return allUsers.slice(userPagination.startIndex, userPagination.endIndex);
  }, [allUsers, userPagination.startIndex, userPagination.endIndex]);

  // Infinite scroll demo
  const mockFetchUsers = async (page: number, pageSize: number) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allUsers.slice(startIndex, endIndex);

    return {
      items,
      hasMore: endIndex < allUsers.length,
      total: allUsers.length,
    };
  };

  const infiniteScroll = useInfiniteScroll({
    fetchData: mockFetchUsers,
    pageSize: 20,
  });

  // Data table columns
  const userColumns: Column<MockUser>[] = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      width: 80,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      filterable: true,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      filterable: true,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      filterable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      filterable: true,
    },
    {
      key: "salary",
      header: "Salary",
      sortable: true,
      render: (value) => (
        <span className="font-mono">${value.toLocaleString()}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value) => (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {value}
        </Badge>
      ),
    },
  ];

  const locationColumns: Column<MockLocation>[] = [
    {
      key: "name",
      header: "Location",
      sortable: true,
      filterable: true,
    },
    {
      key: "city",
      header: "City",
      sortable: true,
      filterable: true,
    },
    {
      key: "revenue",
      header: "Revenue",
      sortable: true,
      render: (value) => (
        <span className="font-mono text-green-600">
          ${value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "occupancy",
      header: "Occupancy",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm">{value}%</span>
        </div>
      ),
    },
    {
      key: "units",
      header: "Units",
      sortable: true,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Pagination & Virtualization Demo
        </h1>
        <p className="text-muted-foreground">
          High-performance data handling for large datasets
        </p>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">
              {allUsers.length.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">
              {allLocations.length.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Locations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">60fps</div>
            <div className="text-sm text-muted-foreground">
              Smooth Scrolling
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">&lt;16ms</div>
            <div className="text-sm text-muted-foreground">Render Time</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pagination" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Pagination
          </TabsTrigger>
          <TabsTrigger value="virtual-list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Virtual List
          </TabsTrigger>
          <TabsTrigger value="virtual-grid" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Virtual Grid
          </TabsTrigger>
          <TabsTrigger
            value="infinite-scroll"
            className="flex items-center gap-2"
          >
            <Infinity className="h-4 w-4" />
            Infinite Scroll
          </TabsTrigger>
          <TabsTrigger value="data-table" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Data Table
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagination" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Pagination</CardTitle>
              <p className="text-sm text-muted-foreground">
                Traditional pagination with page numbers and items per page
                control
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User List */}
              <div className="space-y-2">
                {paginatedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <Pagination
                currentPage={userPagination.currentPage}
                totalPages={userPagination.totalPages}
                totalItems={allUsers.length}
                itemsPerPage={userPagination.itemsPerPage}
                onPageChange={userPagination.setPage}
                onItemsPerPageChange={userPagination.setItemsPerPage}
              />

              {/* Compact Pagination Example */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">
                  Compact Pagination (Mobile)
                </h4>
                <CompactPagination
                  currentPage={userPagination.currentPage}
                  totalPages={userPagination.totalPages}
                  onPageChange={userPagination.setPage}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="virtual-list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Virtual List</CardTitle>
              <p className="text-sm text-muted-foreground">
                Efficiently render large lists by only showing visible items
              </p>
            </CardHeader>
            <CardContent>
              <VirtualList
                items={allUsers}
                itemHeight={60}
                height={400}
                renderItem={(user, index) => (
                  <div className="flex items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{user.role}</Badge>
                      <span className="text-sm font-mono">
                        ${user.salary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                getItemKey={(user) => user.id}
                className="border rounded-lg"
              />
              <div className="text-xs text-muted-foreground mt-2">
                Rendering {allUsers.length.toLocaleString()} items with virtual
                scrolling
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="virtual-grid" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Virtual Grid</CardTitle>
              <p className="text-sm text-muted-foreground">
                Virtual scrolling for grid layouts with fixed item sizes
              </p>
            </CardHeader>
            <CardContent>
              <VirtualGrid
                items={allLocations}
                itemWidth={280}
                itemHeight={120}
                width={600}
                height={400}
                gap={16}
                renderItem={(location, index) => (
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {location.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {location.city}, {location.state}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 font-mono">
                            ${location.revenue.toLocaleString()}
                          </span>
                          <span>{location.occupancy}% occupied</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full"
                            style={{ width: `${location.occupancy}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                getItemKey={(location) => location.id}
                className="border rounded-lg"
              />
              <div className="text-xs text-muted-foreground mt-2">
                Rendering {allLocations.length.toLocaleString()} items in a
                virtual grid
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infinite-scroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Infinite Scroll</CardTitle>
              <p className="text-sm text-muted-foreground">
                Load more data automatically as the user scrolls
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-auto border rounded-lg">
                <InfiniteScroll
                  items={infiniteScroll.items}
                  renderItem={(user, index) => (
                    <div className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                        >
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                  loadMore={infiniteScroll.loadMore}
                  hasMore={infiniteScroll.hasMore}
                  isLoading={infiniteScroll.isLoading}
                  error={infiniteScroll.error}
                  getItemKey={(user) => user.id}
                  onRetry={infiniteScroll.retry}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>
                  Loaded {infiniteScroll.items.length.toLocaleString()} items
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={infiniteScroll.refresh}
                  disabled={infiniteScroll.isLoading}
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Data Table</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full-featured data table with sorting, filtering, selection, and
                pagination
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allUsers.slice(0, 1000)} // Limit for demo performance
                columns={userColumns}
                pagination={{
                  enabled: true,
                  pageSize: 25,
                  pageSizeOptions: [10, 25, 50, 100],
                }}
                selection={{
                  enabled: true,
                  getItemId: (user) => user.id,
                }}
                sorting={{
                  enabled: true,
                  defaultSort: { key: "name", direction: "asc" },
                }}
                filtering={{
                  enabled: true,
                  searchPlaceholder: "Search users...",
                }}
                actions={{
                  enabled: true,
                  onExport: (data) => {
                    console.log("Exporting", data.length, "items");
                  },
                }}
                onRowClick={(user) => {
                  console.log("Clicked user:", user.name);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Virtual Data Table</CardTitle>
              <p className="text-sm text-muted-foreground">
                Data table with virtual scrolling for maximum performance
              </p>
            </CardHeader>
            <CardContent>
              <DataTable
                data={allLocations}
                columns={locationColumns}
                pagination={{ enabled: false }}
                virtualization={{
                  enabled: true,
                  height: 400,
                  itemHeight: 50,
                }}
                sorting={{ enabled: true }}
                filtering={{ enabled: true }}
                actions={{ enabled: true }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
