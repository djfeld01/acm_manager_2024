"use client";
import { useState } from "react";
import { SimpleChartControls } from "@/components/charts/SimpleChartControls";
export default function BetaPage() {
  return (
    <div>
      <h1>Beta Page</h1>
      <SimpleChartControls
        selectedTimePeriod="30d"
        onTimePeriodChange={(period) =>
          console.log("Time period changed to:", period)
        }
        filters={[
          {
            id: "exampleFilter",
            label: "Cool",
            type: "select",
            options: [
              { value: "option1", label: "Option 1" },
              { value: "option2", label: "Option 2" },
            ],
          },
        ]}
        activeFilters={{ exampleFilter: "option1" }}
        onFilterChange={(filterId, value) =>
          console.log(`Filter ${filterId} changed to:`, value)
        }
        onClearFilters={() => console.log("Filters cleared")}
        onExport={(format) => console.log("Exporting as:", format)}
        onRefresh={() => console.log("Data refreshed")}
        isLoading={false}
      />
    </div>
  );
}
