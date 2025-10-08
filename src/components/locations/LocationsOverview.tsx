"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationCard, LocationData } from "./LocationCard";
import { ComponentErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CardSkeleton } from "@/components/shared/LoadingStates";
import {
  Building2,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Map,
  Grid3X3,
  List,
  Download,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationsOverviewProps {
  locations: LocationData[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onViewLocation?: (sitelinkId: string) => void;
  onManageLocation?: (sitelinkId: string) => void;
  onViewReports?: (sitelinkId: string) => void;
  onAddLocation?: () => void;
  onExportData?: (format: "csv" | "pdf") => void;
  onCompareLocations?: (locationIds: string[]) => void;
  className?: string;
}

export function LocationsOverview({
  locations,
  isLoading = false,
  error = null,
  onRetry,
  onViewLocation,
  onManageLocation,
  onViewReports,
  onAddLocation,
  onExportData,
  onCompareLocations,
  className,
}: LocationsOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Calculate summary metrics
  const totalLocations = locations.length;
  const activeLocations = locations.filter((loc) => loc.isActive).length;
  const averageOccupancy =
    locations.reduce((sum, loc) => sum + loc.occupancyRate, 0) /
      totalLocations || 0;
  const totalRevenue = locations.reduce(
    (sum, loc) => sum + loc.monthlyRevenue,
    0
  );
  const totalAlerts = locations.reduce((sum, loc) => sum + loc.alertCount, 0);

  // Get unique states for filtering
  const states = Array.from(new Set(locations.map((loc) => loc.state))).sort();

  // Filter and sort locations
  const filteredLocations = locations
    .filter((location) => {
      const matchesSearch =
        searchTerm === "" ||
        location.facilityName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.facilityAbbreviation
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesState =
        selectedState === "all" || location.state === selectedState;

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && location.isActive) ||
        (selectedStatus === "inactive" && !location.isActive) ||
        (selectedStatus === "alerts" && location.alertCount > 0) ||
        (selectedStatus === "high-occupancy" && location.occupancyRate >= 90) ||
        (selectedStatus === "low-occupancy" && location.occupancyRate < 75);

      return matchesSearch && matchesState && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.facilityName.localeCompare(b.facilityName);
        case "occupancy":
          return b.occupancyRate - a.occupancyRate;
        case "revenue":
          return b.monthlyRevenue - a.monthlyRevenue;
        case "alerts":
          return b.alertCount - a.alertCount;
        case "state":
          return a.state.localeCompare(b.state);
        default:
          return 0;
      }
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleLocationSelect = (sitelinkId: string, selected: boolean) => {
    if (selected) {
      setSelectedLocations((prev) => [...prev, sitelinkId]);
    } else {
      setSelectedLocations((prev) => prev.filter((id) => id !== sitelinkId));
    }
  };

  const handleSelectAll = () => {
    if (selectedLocations.length === filteredLocations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(filteredLocations.map((loc) => loc.sitelinkId));
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <CardSkeleton />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Failed to load locations</p>
            <p className="text-xs text-muted-foreground">
              {error.message || "An error occurred while loading the data"}
            </p>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-4"
            >
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <ComponentErrorBoundary>
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Locations Overview
            </h2>
            <p className="text-muted-foreground">
              {totalLocations} locations • {activeLocations} active
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onAddLocation && (
              <Button onClick={onAddLocation}>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            )}

            {onExportData && (
              <Button variant="outline" onClick={() => onExportData("csv")}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}

            {selectedLocations.length > 1 && onCompareLocations && (
              <Button
                variant="outline"
                onClick={() => onCompareLocations(selectedLocations)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Compare ({selectedLocations.length})
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Locations
                  </p>
                  <p className="text-2xl font-bold">{totalLocations}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeLocations} active
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Occupancy</p>
                  <p className="text-2xl font-bold">
                    {averageOccupancy.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Across all locations
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Monthly combined
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold">{totalAlerts}</p>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Sort Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state-select">State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger id="state-select">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-select">Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                    <SelectItem value="alerts">Has Alerts</SelectItem>
                    <SelectItem value="high-occupancy">
                      High Occupancy (90%+)
                    </SelectItem>
                    <SelectItem value="low-occupancy">
                      Low Occupancy (&lt;75%)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-select">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="occupancy">Occupancy Rate</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="alerts">Alert Count</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="view-mode">View</Label>
                <Select
                  value={viewMode}
                  onValueChange={(value: "grid" | "list") => setViewMode(value)}
                >
                  <SelectTrigger id="view-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        Grid
                      </div>
                    </SelectItem>
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        List
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedState("all");
                      setSelectedStatus("all");
                      setSortBy("name");
                    }}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  {filteredLocations.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleSelectAll}
                      className="flex-1"
                    >
                      {selectedLocations.length === filteredLocations.length
                        ? "Deselect"
                        : "Select"}{" "}
                      All
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locations Display */}
        {filteredLocations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">No locations found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-3"
            )}
          >
            {filteredLocations.map((location) => (
              <div key={location.sitelinkId} className="relative">
                <LocationCard
                  location={location}
                  variant={viewMode === "list" ? "compact" : "default"}
                  onViewDetails={onViewLocation}
                  onManageLocation={onManageLocation}
                  onViewReports={onViewReports}
                />

                {/* Selection checkbox for comparison */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(location.sitelinkId)}
                    onChange={(e) =>
                      handleLocationSelect(
                        location.sitelinkId,
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredLocations.length} of {totalLocations} locations
          {selectedLocations.length > 0 && (
            <span> • {selectedLocations.length} selected</span>
          )}
        </div>
      </div>
    </ComponentErrorBoundary>
  );
}
