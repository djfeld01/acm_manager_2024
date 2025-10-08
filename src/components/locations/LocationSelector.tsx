"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export interface LocationOption {
  sitelinkId: string;
  facilityName: string;
  facilityAbbreviation: string;
  city: string;
  state: string;
  isActive: boolean;
}

interface LocationSelectorProps {
  locations: LocationOption[];
  selectedLocationIds: string[];
  onSelectionChange: (locationIds: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  allowMultiple?: boolean;
  showInactive?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LocationSelector({
  locations,
  selectedLocationIds,
  onSelectionChange,
  placeholder = "Select location(s)...",
  maxSelections,
  allowMultiple = true,
  showInactive = false,
  disabled = false,
  className,
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filter locations based on showInactive setting and search
  const filteredLocations = locations.filter((location) => {
    const matchesActive = showInactive || location.isActive;
    const matchesSearch =
      searchValue === "" ||
      location.facilityName.toLowerCase().includes(searchValue.toLowerCase()) ||
      location.facilityAbbreviation
        .toLowerCase()
        .includes(searchValue.toLowerCase()) ||
      location.city.toLowerCase().includes(searchValue.toLowerCase()) ||
      location.state.toLowerCase().includes(searchValue.toLowerCase());

    return matchesActive && matchesSearch;
  });

  // Get selected locations for display
  const selectedLocations = filteredLocations.filter((location) =>
    selectedLocationIds.includes(location.sitelinkId)
  );

  const handleSelect = (locationId: string) => {
    if (!allowMultiple) {
      // Single selection mode
      onSelectionChange([locationId]);
      setOpen(false);
      return;
    }

    // Multiple selection mode
    const isSelected = selectedLocationIds.includes(locationId);
    let newSelection: string[];

    if (isSelected) {
      // Remove from selection
      newSelection = selectedLocationIds.filter((id) => id !== locationId);
    } else {
      // Add to selection (check max limit)
      if (maxSelections && selectedLocationIds.length >= maxSelections) {
        return; // Don't add if at max limit
      }
      newSelection = [...selectedLocationIds, locationId];
    }

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedLocationIds.length === filteredLocations.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all (respecting max limit)
      const allIds = filteredLocations.map((loc) => loc.sitelinkId);
      const limitedIds = maxSelections
        ? allIds.slice(0, maxSelections)
        : allIds;
      onSelectionChange(limitedIds);
    }
  };

  const getDisplayText = () => {
    if (selectedLocations.length === 0) {
      return placeholder;
    }

    if (selectedLocations.length === 1) {
      return selectedLocations[0].facilityName;
    }

    if (selectedLocations.length <= 3) {
      return selectedLocations
        .map((loc) => loc.facilityAbbreviation)
        .join(", ");
    }

    return `${selectedLocations.length} locations selected`;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{getDisplayText()}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search locations..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <CommandList>
              <CommandEmpty>No locations found.</CommandEmpty>
              <CommandGroup>
                {allowMultiple && filteredLocations.length > 1 && (
                  <CommandItem value="select-all" onSelect={handleSelectAll}>
                    <Checkbox
                      checked={
                        selectedLocationIds.length === filteredLocations.length
                      }
                      className="mr-2"
                    />
                    <span className="font-medium">
                      {selectedLocationIds.length === filteredLocations.length
                        ? "Deselect All"
                        : "Select All"}
                    </span>
                  </CommandItem>
                )}
                {filteredLocations.map((location) => {
                  const isSelected = selectedLocationIds.includes(
                    location.sitelinkId
                  );
                  const isDisabled = Boolean(
                    maxSelections &&
                      !isSelected &&
                      selectedLocationIds.length >= maxSelections
                  );

                  return (
                    <CommandItem
                      key={location.sitelinkId}
                      value={location.sitelinkId}
                      onSelect={() => handleSelect(location.sitelinkId)}
                      disabled={isDisabled}
                    >
                      {allowMultiple ? (
                        <Checkbox checked={isSelected} className="mr-2" />
                      ) : (
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {location.facilityName}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {location.facilityAbbreviation}
                          </Badge>
                          {!location.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {location.city}, {location.state}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected locations display for multiple selection */}
      {allowMultiple && selectedLocations.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLocations.map((location) => (
            <Badge
              key={location.sitelinkId}
              variant="secondary"
              className="text-xs"
            >
              {location.facilityAbbreviation}
              <button
                onClick={() => handleSelect(location.sitelinkId)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                disabled={disabled}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selection limit indicator */}
      {maxSelections && allowMultiple && (
        <div className="text-xs text-muted-foreground mt-1">
          {selectedLocationIds.length} of {maxSelections} selected
        </div>
      )}
    </div>
  );
}
