"use client";

import React from "react";
import { useLocationFilter } from "@/contexts/LocationFilterContext";
import {
  hasLocationAccess,
  canReadLocation,
  UserLocationAccess,
} from "./locationPermissions";

export interface LocationFilteredData<T> {
  data: T[];
  filteredData: T[];
  selectedLocationIds: string[];
  hasLocationFilter: boolean;
  isFiltering: boolean;
}

export interface WithLocationFilterProps<T> {
  locationFilteredData: LocationFilteredData<T>;
}

/**
 * Higher-order component that provides location-filtered data
 */
export function withLocationFilter<T extends { sitelinkId?: string }, P = {}>(
  WrappedComponent: React.ComponentType<P & WithLocationFilterProps<T>>,
  options: {
    // Function to extract location ID from data item
    getLocationId?: (item: T) => string;
    // Whether to require location selection (if false, shows all data when no locations selected)
    requireSelection?: boolean;
    // Whether to check read permissions for each location
    checkReadPermissions?: boolean;
  } = {}
) {
  const {
    getLocationId = (item: T) => item.sitelinkId || "",
    requireSelection = false,
    checkReadPermissions = true,
  } = options;

  return function LocationFilteredComponent(props: P & { data: T[] }) {
    const { data, ...otherProps } = props;
    const { selectedLocationIds, userAccess } = useLocationFilter();

    // Filter data based on selected locations and permissions
    const filteredData = React.useMemo(() => {
      if (!data || data.length === 0) {
        return [];
      }

      // If no locations selected and requireSelection is false, return all accessible data
      if (selectedLocationIds.length === 0 && !requireSelection) {
        if (!checkReadPermissions || !userAccess) {
          return data;
        }

        // Filter by read permissions only
        return data.filter((item) => {
          const locationId = getLocationId(item);
          return locationId && canReadLocation(userAccess, locationId);
        });
      }

      // If no locations selected and requireSelection is true, return empty array
      if (selectedLocationIds.length === 0 && requireSelection) {
        return [];
      }

      // Filter by selected locations
      let filtered = data.filter((item) => {
        const locationId = getLocationId(item);
        return locationId && selectedLocationIds.includes(locationId);
      });

      // Additional permission check if required
      if (checkReadPermissions && userAccess) {
        filtered = filtered.filter((item) => {
          const locationId = getLocationId(item);
          return locationId && canReadLocation(userAccess, locationId);
        });
      }

      return filtered;
    }, [data, selectedLocationIds, userAccess]);

    const locationFilteredData: LocationFilteredData<T> = {
      data,
      filteredData,
      selectedLocationIds,
      hasLocationFilter: selectedLocationIds.length > 0,
      isFiltering: selectedLocationIds.length > 0 || requireSelection,
    };

    return (
      <WrappedComponent
        {...(otherProps as P)}
        locationFilteredData={locationFilteredData}
      />
    );
  };
}

/**
 * Hook for location-filtered data
 */
export function useLocationFilteredData<T extends { sitelinkId?: string }>(
  data: T[],
  options: {
    getLocationId?: (item: T) => string;
    requireSelection?: boolean;
    checkReadPermissions?: boolean;
  } = {}
): LocationFilteredData<T> {
  const {
    getLocationId = (item: T) => item.sitelinkId || "",
    requireSelection = false,
    checkReadPermissions = true,
  } = options;

  const { selectedLocationIds, userAccess } = useLocationFilter();

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // If no locations selected and requireSelection is false, return all accessible data
    if (selectedLocationIds.length === 0 && !requireSelection) {
      if (!checkReadPermissions || !userAccess) {
        return data;
      }

      // Filter by read permissions only
      return data.filter((item) => {
        const locationId = getLocationId(item);
        return locationId && canReadLocation(userAccess, locationId);
      });
    }

    // If no locations selected and requireSelection is true, return empty array
    if (selectedLocationIds.length === 0 && requireSelection) {
      return [];
    }

    // Filter by selected locations
    let filtered = data.filter((item) => {
      const locationId = getLocationId(item);
      return locationId && selectedLocationIds.includes(locationId);
    });

    // Additional permission check if required
    if (checkReadPermissions && userAccess) {
      filtered = filtered.filter((item) => {
        const locationId = getLocationId(item);
        return locationId && canReadLocation(userAccess, locationId);
      });
    }

    return filtered;
  }, [
    data,
    selectedLocationIds,
    userAccess,
    getLocationId,
    requireSelection,
    checkReadPermissions,
  ]);

  return {
    data,
    filteredData,
    selectedLocationIds,
    hasLocationFilter: selectedLocationIds.length > 0,
    isFiltering: selectedLocationIds.length > 0 || requireSelection,
  };
}

/**
 * Component that renders different content based on location filter state
 */
interface LocationFilterStateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireSelection?: boolean;
}

export function LocationFilterState({
  children,
  fallback,
  requireSelection = false,
}: LocationFilterStateProps) {
  const { selectedLocationIds } = useLocationFilter();

  if (requireSelection && selectedLocationIds.length === 0) {
    return <>{fallback}</> || null;
  }

  return <>{children}</>;
}

/**
 * Utility function to check if data should be shown based on location filter
 */
export function shouldShowLocationData(
  locationId: string,
  userAccess: UserLocationAccess | null,
  selectedLocationIds: string[],
  requireSelection: boolean = false
): boolean {
  // Check basic location access
  if (userAccess && !hasLocationAccess(userAccess, locationId)) {
    return false;
  }

  // If no selection required and no locations selected, show all accessible data
  if (!requireSelection && selectedLocationIds.length === 0) {
    return true;
  }

  // If selection required and no locations selected, don't show data
  if (requireSelection && selectedLocationIds.length === 0) {
    return false;
  }

  // Check if location is in selected list
  return selectedLocationIds.includes(locationId);
}
