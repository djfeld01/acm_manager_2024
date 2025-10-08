"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationSelector } from "./LocationSelector";
import {
  useLocationFilter,
  useSelectedLocations,
} from "@/contexts/LocationFilterContext";
import {
  Building2,
  Filter,
  X,
  MapPin,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationFilterBarProps {
  showClearAll?: boolean;
  showSelectAll?: boolean;
  showLocationCount?: boolean;
  showQuickActions?: boolean;
  onViewReports?: (locationIds: string[]) => void;
  onCompareLocations?: (locationIds: string[]) => void;
  onManageLocations?: () => void;
  className?: string;
}

export function LocationFilterBar({
  showClearAll = true,
  showSelectAll = true,
  showLocationCount = true,
  showQuickActions = false,
  onViewReports,
  onCompareLocations,
  onManageLocations,
  className,
}: LocationFilterBarProps) {
  const {
    availableLocations,
    selectedLocationIds,
    setSelectedLocations,
    clearSelection,
    selectAll,
    userAccess,
  } = useLocationFilter();

  const { selectedLocations } = useSelectedLocations();

  const handleSelectionChange = (locationIds: string[]) => {
    setSelectedLocations(locationIds);
  };

  const getLocationSummary = () => {
    if (selectedLocationIds.length === 0) {
      return "No locations selected";
    }

    if (selectedLocationIds.length === 1) {
      const location = selectedLocations[0];
      return `${location?.facilityName || "Unknown location"}`;
    }

    if (selectedLocationIds.length === availableLocations.length) {
      return "All locations selected";
    }

    return `${selectedLocationIds.length} of ${availableLocations.length} locations selected`;
  };

  const canManageLocations =
    userAccess?.role === "ADMIN" || userAccess?.role === "OWNER";

  return (
    <Card className={cn("border-l-4 border-l-primary", className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Location Filter</h3>
            {showLocationCount && (
              <Badge variant="outline" className="ml-auto">
                {getLocationSummary()}
              </Badge>
            )}
          </div>

          {/* Location Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <LocationSelector
                locations={availableLocations}
                selectedLocationIds={selectedLocationIds}
                onSelectionChange={handleSelectionChange}
                placeholder="Select locations to filter data..."
                allowMultiple={true}
                showInactive={false}
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              {showSelectAll && availableLocations.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={
                    selectedLocationIds.length === availableLocations.length
                  }
                >
                  Select All
                </Button>
              )}

              {showClearAll && selectedLocationIds.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Selected Locations Display */}
          {selectedLocations.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Filtering data for:
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedLocations.map((location) => (
                  <Badge
                    key={location.sitelinkId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    <span>{location.facilityAbbreviation}</span>
                    <span className="text-muted-foreground">
                      {location.city}, {location.state}
                    </span>
                    <button
                      onClick={() => {
                        const newSelection = selectedLocationIds.filter(
                          (id) => id !== location.sitelinkId
                        );
                        setSelectedLocations(newSelection);
                      }}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && selectedLocationIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {onViewReports && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewReports(selectedLocationIds)}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              )}

              {onCompareLocations && selectedLocationIds.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCompareLocations(selectedLocationIds)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Compare Locations
                </Button>
              )}

              {onManageLocations && canManageLocations && (
                <Button variant="outline" size="sm" onClick={onManageLocations}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              )}
            </div>
          )}

          {/* No Access Message */}
          {availableLocations.length === 0 && !userAccess && (
            <div className="text-center py-4 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No location access configured</p>
            </div>
          )}

          {/* No Locations Available */}
          {availableLocations.length === 0 && userAccess && (
            <div className="text-center py-4 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No locations available</p>
              <p className="text-xs">Contact your administrator for access</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
