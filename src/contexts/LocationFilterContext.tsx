"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { LocationOption } from "@/components/locations/LocationSelector";
import { UserLocationAccess } from "@/lib/permissions/locationPermissions";

interface LocationFilterState {
  // Available locations for the current user
  availableLocations: LocationOption[];

  // Currently selected location IDs for filtering
  selectedLocationIds: string[];

  // User's location access permissions
  userAccess: UserLocationAccess | null;

  // Loading state
  isLoading: boolean;

  // Error state
  error: Error | null;
}

interface LocationFilterActions {
  // Set selected locations for filtering
  setSelectedLocations: (locationIds: string[]) => void;

  // Add a location to the selection
  addLocation: (locationId: string) => void;

  // Remove a location from the selection
  removeLocation: (locationId: string) => void;

  // Clear all selected locations
  clearSelection: () => void;

  // Select all available locations
  selectAll: () => void;

  // Set user access permissions
  setUserAccess: (userAccess: UserLocationAccess) => void;

  // Set available locations
  setAvailableLocations: (locations: LocationOption[]) => void;

  // Set loading state
  setLoading: (loading: boolean) => void;

  // Set error state
  setError: (error: Error | null) => void;

  // Reset to initial state
  reset: () => void;
}

type LocationFilterContextType = LocationFilterState & LocationFilterActions;

const LocationFilterContext = createContext<LocationFilterContextType | null>(
  null
);

interface LocationFilterProviderProps {
  children: React.ReactNode;
  initialLocations?: LocationOption[];
  initialSelectedIds?: string[];
  userAccess?: UserLocationAccess | null;
}

export function LocationFilterProvider({
  children,
  initialLocations = [],
  initialSelectedIds = [],
  userAccess = null,
}: LocationFilterProviderProps) {
  const [state, setState] = useState<LocationFilterState>({
    availableLocations: initialLocations,
    selectedLocationIds: initialSelectedIds,
    userAccess,
    isLoading: false,
    error: null,
  });

  // Persist selected locations to localStorage
  useEffect(() => {
    if (state.selectedLocationIds.length > 0) {
      localStorage.setItem(
        "selectedLocationIds",
        JSON.stringify(state.selectedLocationIds)
      );
    }
  }, [state.selectedLocationIds]);

  // Load selected locations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("selectedLocationIds");
    if (stored && initialSelectedIds.length === 0) {
      try {
        const parsedIds = JSON.parse(stored);
        if (Array.isArray(parsedIds)) {
          setState((prev) => ({
            ...prev,
            selectedLocationIds: parsedIds.filter((id) =>
              prev.availableLocations.some((loc) => loc.sitelinkId === id)
            ),
          }));
        }
      } catch (error) {
        console.warn("Failed to parse stored location IDs:", error);
      }
    }
  }, [initialSelectedIds.length]);

  const actions: LocationFilterActions = {
    setSelectedLocations: (locationIds: string[]) => {
      setState((prev) => ({
        ...prev,
        selectedLocationIds: locationIds,
      }));
    },

    addLocation: (locationId: string) => {
      setState((prev) => ({
        ...prev,
        selectedLocationIds: prev.selectedLocationIds.includes(locationId)
          ? prev.selectedLocationIds
          : [...prev.selectedLocationIds, locationId],
      }));
    },

    removeLocation: (locationId: string) => {
      setState((prev) => ({
        ...prev,
        selectedLocationIds: prev.selectedLocationIds.filter(
          (id) => id !== locationId
        ),
      }));
    },

    clearSelection: () => {
      setState((prev) => ({
        ...prev,
        selectedLocationIds: [],
      }));
      localStorage.removeItem("selectedLocationIds");
    },

    selectAll: () => {
      setState((prev) => ({
        ...prev,
        selectedLocationIds: prev.availableLocations.map(
          (loc) => loc.sitelinkId
        ),
      }));
    },

    setUserAccess: (userAccess: UserLocationAccess) => {
      setState((prev) => ({
        ...prev,
        userAccess,
      }));
    },

    setAvailableLocations: (locations: LocationOption[]) => {
      setState((prev) => ({
        ...prev,
        availableLocations: locations,
        // Remove any selected locations that are no longer available
        selectedLocationIds: prev.selectedLocationIds.filter((id) =>
          locations.some((loc) => loc.sitelinkId === id)
        ),
      }));
    },

    setLoading: (loading: boolean) => {
      setState((prev) => ({
        ...prev,
        isLoading: loading,
      }));
    },

    setError: (error: Error | null) => {
      setState((prev) => ({
        ...prev,
        error,
      }));
    },

    reset: () => {
      setState({
        availableLocations: [],
        selectedLocationIds: [],
        userAccess: null,
        isLoading: false,
        error: null,
      });
      localStorage.removeItem("selectedLocationIds");
    },
  };

  const contextValue: LocationFilterContextType = {
    ...state,
    ...actions,
  };

  return (
    <LocationFilterContext.Provider value={contextValue}>
      {children}
    </LocationFilterContext.Provider>
  );
}

export function useLocationFilter() {
  const context = useContext(LocationFilterContext);
  if (!context) {
    throw new Error(
      "useLocationFilter must be used within a LocationFilterProvider"
    );
  }
  return context;
}

// Convenience hooks for common use cases
export function useSelectedLocations() {
  const { selectedLocationIds, availableLocations } = useLocationFilter();

  return {
    selectedLocationIds,
    selectedLocations: availableLocations.filter((loc) =>
      selectedLocationIds.includes(loc.sitelinkId)
    ),
  };
}

export function useLocationAccess() {
  const { userAccess } = useLocationFilter();
  return userAccess;
}

export function useLocationPermissions(locationId: string) {
  const { userAccess } = useLocationFilter();

  if (!userAccess) {
    return {
      canRead: false,
      canWrite: false,
      canManage: false,
      canViewPayroll: false,
      canViewReports: false,
    };
  }

  const permission = userAccess.permissions.find(
    (p) => p.sitelinkId === locationId
  );

  return {
    canRead: permission?.canRead ?? false,
    canWrite: permission?.canWrite ?? false,
    canManage: permission?.canManage ?? false,
    canViewPayroll: permission?.canViewPayroll ?? false,
    canViewReports: permission?.canViewReports ?? false,
  };
}
