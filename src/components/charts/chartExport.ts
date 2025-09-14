// Chart export utilities
// Basic export functionality without external dependencies

export interface ExportOptions {
  filename?: string;
  quality?: number;
  backgroundColor?: string;
  scale?: number;
}

export class ChartExporter {
  /**
   * Export chart as SVG (if supported by the chart library)
   */
  static async exportAsSVG(
    element: HTMLElement,
    options: ExportOptions = {}
  ): Promise<void> {
    const { filename = "chart" } = options;

    try {
      // Find SVG element within the chart container
      const svgElement = element.querySelector("svg");
      if (!svgElement) {
        throw new Error("No SVG element found in chart");
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;

      // Add XML namespace if not present
      if (!clonedSvg.getAttribute("xmlns")) {
        clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }

      // Serialize SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);

      // Create blob and download
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `${filename}.svg`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting SVG:", error);
      throw new Error("Failed to export chart as SVG");
    }
  }

  /**
   * Export chart data as CSV
   */
  static exportAsCSV(
    data: any[],
    options: ExportOptions & { columns?: string[] } = {}
  ): void {
    const { filename = "chart-data", columns } = options;

    try {
      if (!data || data.length === 0) {
        throw new Error("No data to export");
      }

      // Get column headers
      const headers = columns || Object.keys(data[0]);

      // Create CSV content
      const csvContent = [
        headers.join(","), // Header row
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Escape commas and quotes in values
              if (
                typeof value === "string" &&
                (value.includes(",") || value.includes('"'))
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `${filename}.csv`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      throw new Error("Failed to export data as CSV");
    }
  }

  /**
   * Export chart data as JSON
   */
  static exportAsJSON(data: any[], options: ExportOptions = {}): void {
    const { filename = "chart-data" } = options;

    try {
      if (!data || data.length === 0) {
        throw new Error("No data to export");
      }

      const jsonContent = JSON.stringify(data, null, 2);

      // Create blob and download
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.download = `${filename}.json`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      throw new Error("Failed to export data as JSON");
    }
  }

  /**
   * Copy chart data to clipboard
   */
  static async copyToClipboard(data: any[]): Promise<void> {
    try {
      if (!data || data.length === 0) {
        throw new Error("No data to copy");
      }

      // Convert to CSV format for clipboard
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join("\t"), // Use tabs for better spreadsheet compatibility
        ...data.map((row) => headers.map((header) => row[header]).join("\t")),
      ].join("\n");

      await navigator.clipboard.writeText(csvContent);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      throw new Error("Failed to copy data to clipboard");
    }
  }

  /**
   * Export chart with available formats
   */
  static async exportChart(
    element: HTMLElement,
    data: any[],
    format: "svg" | "csv" | "json" | "clipboard",
    options: ExportOptions & { columns?: string[] } = {}
  ): Promise<void> {
    switch (format) {
      case "svg":
        return this.exportAsSVG(element, options);
      case "csv":
        return this.exportAsCSV(data, options);
      case "json":
        return this.exportAsJSON(data, options);
      case "clipboard":
        return this.copyToClipboard(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

// Hook for easy chart export
export function useChartExport() {
  const exportChart = async (
    elementId: string,
    data: any[],
    format: "svg" | "csv" | "json" | "clipboard",
    options: ExportOptions & { columns?: string[] } = {}
  ) => {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    return ChartExporter.exportChart(element, data, format, options);
  };

  return { exportChart };
}
