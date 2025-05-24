import { supabase, FoodItem, DailyDietWithFood } from "../lib/supabase";
import { MacroGoal } from "../types/goals";

// Define export data types
export type ExportDataType = "foods" | "entries" | "goals";
export type ExportFormat = "csv" | "json";

export interface ExportOptions {
  startDate?: string;
  endDate?: string;
  dataTypes: ExportDataType[];
  format: ExportFormat;
}

export interface ExportMetadata {
  exportDate: string;
  dataTypes: ExportDataType[];
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
  format: ExportFormat;
  version: string;
}

export const ExportService = {
  /**
   * Get foods data for export
   * @returns A promise that resolves to an array of food items
   */
  async getFoodsData(): Promise<FoodItem[]> {
    try {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching foods for export:", error);
      throw error;
    }
  },

  /**
   * Get diet entries data for export with date range filtering
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns A promise that resolves to an array of daily diet entries with food details
   */
  async getDietEntriesData(
    startDate?: string,
    endDate?: string
  ): Promise<DailyDietWithFood[]> {
    try {
      let query = supabase.from("dailydiet").select(`
          id,
          date,
          foods!dailydiet_food_id_fkey (
            id,
            name,
            protein,
            carbs,
            fat,
            calories,
            serving_size,
            unit
          )
        `);

      // Apply date range filters if provided
      if (startDate) {
        query = query.gte("date", startDate);
      }

      if (endDate) {
        query = query.lte("date", endDate);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;

      // Transform the data to a more usable format
      return (data as unknown as any[]).map((item) => ({
        id: item.id,
        date: item.date,
        name: item.foods.name,
        protein: item.foods.protein,
        carbs: item.foods.carbs,
        fat: item.foods.fat,
        calories: item.foods.calories,
        serving_size: item.foods.serving_size || 1, // Add default serving_size
        unit: item.foods.unit,
        food_id: item.foods.id,
      }));
    } catch (error) {
      console.error("Error fetching diet entries for export:", error);
      throw error;
    }
  },

  /**
   * Get macro goals data for export with date range filtering
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns A promise that resolves to an array of macro goals
   */
  async getGoalsData(
    startDate?: string,
    endDate?: string
  ): Promise<MacroGoal[]> {
    try {
      let query = supabase.from("macro_goals").select("*");

      // Apply date range filters if provided
      if (startDate) {
        query = query.gte("target_date", startDate);
      }

      if (endDate) {
        query = query.lte("target_date", endDate);
      }

      const { data, error } = await query.order("target_date", {
        ascending: false,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching goals for export:", error);
      throw error;
    }
  },

  /**
   * Format data as CSV
   * @param data The data to format
   * @returns Formatted CSV string
   */
  formatAsCSV(data: any[]): string {
    if (!data || data.length === 0) return "";

    // Get headers from the first item's keys
    const headers = Object.keys(data[0]);

    // Create CSV header row
    let csv = headers.join(",") + "\n";

    // Add data rows
    data.forEach((item) => {
      const row = headers.map((header) => {
        const value = item[header];

        // Handle CSV special cases (quotes, commas, etc.)
        if (value === null || value === undefined) {
          return "";
        } else if (typeof value === "string") {
          // Escape quotes and wrap in quotes if contains comma or quote
          if (value.includes('"') || value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        } else if (typeof value === "object") {
          // For objects/arrays, convert to JSON string and wrap in quotes
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        return String(value);
      });

      csv += row.join(",") + "\n";
    });

    return csv;
  },

  /**
   * Format data as JSON
   * @param data The data to format
   * @param metadata Optional metadata to include
   * @returns Formatted JSON string
   */
  formatAsJSON(
    data: { [key: string]: any[] },
    metadata: ExportMetadata
  ): string {
    const exportData = {
      metadata,
      data,
    };

    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Generate export metadata
   * @param options Export options
   * @returns Metadata object
   */
  generateMetadata(options: ExportOptions): ExportMetadata {
    return {
      exportDate: new Date().toISOString(),
      dataTypes: options.dataTypes,
      dateRange: {
        startDate: options.startDate,
        endDate: options.endDate,
      },
      format: options.format,
      version: "1.0.0", // App version
    };
  },

  /**
   * Export data with the given options
   * @param options Export options
   * @returns Exported data as a string in the requested format
   */
  async exportData(options: ExportOptions): Promise<string> {
    const metadata = this.generateMetadata(options);
    const exportData: { [key: string]: any[] } = {};

    // Fetch selected data types
    if (options.dataTypes.includes("foods")) {
      exportData.foods = await this.getFoodsData();
    }

    if (options.dataTypes.includes("entries")) {
      exportData.entries = await this.getDietEntriesData(
        options.startDate,
        options.endDate
      );
    }

    if (options.dataTypes.includes("goals")) {
      exportData.goals = await this.getGoalsData(
        options.startDate,
        options.endDate
      );
    }

    // Format data according to selected format
    if (options.format === "csv") {
      // For CSV, we need to handle multiple data types differently
      // We'll create separate sections for each data type
      let csvContent = "";

      for (const [dataType, data] of Object.entries(exportData)) {
        if (data.length > 0) {
          // Add section header with metadata
          csvContent += `# ${dataType.toUpperCase()} EXPORT\n`;
          csvContent += `# Export Date: ${metadata.exportDate}\n`;
          if (metadata.dateRange.startDate) {
            csvContent += `# Start Date: ${metadata.dateRange.startDate}\n`;
          }
          if (metadata.dateRange.endDate) {
            csvContent += `# End Date: ${metadata.dateRange.endDate}\n`;
          }
          csvContent += "\n";

          // Add data in CSV format
          csvContent += this.formatAsCSV(data);

          // Add separation between sections
          csvContent += "\n\n";
        }
      }

      return csvContent;
    } else {
      // JSON format
      return this.formatAsJSON(exportData, metadata);
    }
  },
};

export default ExportService;
