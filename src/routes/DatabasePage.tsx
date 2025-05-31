import React, { useContext, useState, useEffect, ChangeEvent } from "react";
import { DietContext } from "../DietContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faSort,
  faSortUp,
  faSortDown,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

function getTodayDate(): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();

  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone,
  }).format(now);
  const month = new Intl.DateTimeFormat("en", {
    month: "2-digit",
    timeZone,
  }).format(now);
  const day = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    timeZone,
  }).format(now);

  return `${year}-${month}-${day}`;
}

// Define types for sorting and filtering
type SortField = "name" | "protein" | "calories";
type SortDirection = "asc" | "desc";
type FilterOption = "all" | "highProtein" | "lowCalorie" | "lowCarb";

interface FilterCriteria {
  highProtein: number;
  lowCalorie: number;
  lowCarb: number;
}

interface Food {
  id: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  serving_size: number;
  unit: string;
}

const DatabasePage: React.FC = () => {
  const dietContext = useContext(DietContext);
  const { user, session } = useAuth();

  if (!dietContext) {
    throw new Error("DatabasePage must be used within a DietProvider");
  }

  const { database, removeFoodFromDatabase, addFoodEntryToDailyDiet } =
    dietContext;

  // State for search, sort, and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");

  // Define filter criteria thresholds
  const filterCriteria: FilterCriteria = {
    highProtein: 20, // Foods with 20g+ protein per serving
    lowCalorie: 300, // Foods with less than 300 calories per serving
    lowCarb: 10, // Foods with less than 10g carbs per serving
  };

  // State for filtered and sorted food data
  const [displayedFoods, setDisplayedFoods] = useState<[string, Food][]>([]);

  // Add debug state
  const [debugInfo, setDebugInfo] = useState<{
    hasContext?: boolean;
    databaseLength?: number;
    user?: string;
    session?: boolean;
    directSupabaseCall?: {
      success: boolean;
      count: number;
      error?: string;
    };
    envVars?: {
      hasUrl: boolean;
      hasKey: boolean;
      url?: string;
    };
    error?: string;
  } | null>(null);

  // Update displayed foods whenever database, search, sort, or filter changes
  useEffect(() => {
    let result = Object.entries(database);

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(([foodName]) =>
        foodName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply macronutrient filters
    if (filterOption !== "all") {
      result = result.filter(([, foodDetails]) => {
        switch (filterOption) {
          case "highProtein":
            return foodDetails.protein >= filterCriteria.highProtein;
          case "lowCalorie":
            return foodDetails.calories < filterCriteria.lowCalorie;
          case "lowCarb":
            return foodDetails.carbs < filterCriteria.lowCarb;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort(([nameA, detailsA], [nameB, detailsB]) => {
      let valueA: string | number;
      let valueB: string | number;

      if (sortField === "name") {
        valueA = nameA;
        valueB = nameB;
      } else {
        valueA = detailsA[sortField];
        valueB = detailsB[sortField];
      }

      // Numeric sort for numbers, string sort for strings
      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      } else {
        return sortDirection === "asc"
          ? String(valueA).localeCompare(String(valueB))
          : String(valueB).localeCompare(String(valueA));
      }
    });

    setDisplayedFoods(result);
  }, [database, searchQuery, sortField, sortDirection, filterOption]);

  // Add debug effect
  useEffect(() => {
    const checkDebugInfo = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        // Test direct Supabase call
        const { data: foods, error } = await supabase.from("foods").select("*");

        setDebugInfo({
          hasContext: !!dietContext,
          databaseLength: Object.keys(database).length,
          user: currentUser?.email || "No user",
          session: !!currentSession,
          directSupabaseCall: {
            success: !error,
            count: foods?.length || 0,
            error: error?.message,
          },
          envVars: {
            hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
            hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
            url: import.meta.env.VITE_SUPABASE_URL?.substring(0, 20) + "...",
          },
        });
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    checkDebugInfo();
  }, [dietContext, database, user, session]);

  const handleFoodClick = (foodName: string): void => {
    const foodDetails = {
      ...database[foodName],
      name: foodName,
      id: database[foodName].id,
    };
    addFoodEntryToDailyDiet(foodDetails, getTodayDate());
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleSortClick = (field: SortField): void => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and reset direction to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setFilterOption(e.target.value as FilterOption);
  };

  // Sort icon helper
  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <FontAwesomeIcon icon={faSort} className="text-gray-400" />;
    return sortDirection === "asc" ? (
      <FontAwesomeIcon icon={faSortUp} />
    ) : (
      <FontAwesomeIcon icon={faSortDown} />
    );
  };

  return (
    <div className="w-full mx-auto sm:px-4 sm:py-8">
      <h2 className="mt-0 mb-4 text-xl font-semibold">Food Database</h2>

      {/* Debug Info - Remove this after fixing */}
      {process.env.NODE_ENV === "development" || import.meta.env.DEV ? (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <h3 className="font-bold">Debug Info:</h3>
          <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      ) : (
        // Show minimal debug in production
        <div className="mb-2 text-xs text-gray-500">
          Items: {displayedFoods.length} | User: {user?.email || "Anonymous"} |
          Auth: {session ? "Yes" : "No"}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search food items..."
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center">
          <FontAwesomeIcon icon={faFilter} className="mr-2 text-gray-600" />
          <select
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterOption}
            onChange={handleFilterChange}
          >
            <option value="all">All Foods</option>
            <option value="highProtein">High Protein (&gt;20g)</option>
            <option value="lowCalorie">Low Calorie (&lt;300)</option>
            <option value="lowCarb">Low Carb (&lt;10g)</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-2 text-sm text-gray-600">
        {displayedFoods.length} items found
      </div>

      {/* Food Table */}
      <div className="w-full overflow-hidden">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50 w-full table table-fixed">
            <tr>
              <th
                className="w-[30%] p-2 text-left font-bold cursor-pointer"
                onClick={() => handleSortClick("name")}
              >
                <div className="flex items-center">
                  <span>Food</span>
                  <span className="ml-1">{getSortIcon("name")}</span>
                </div>
              </th>
              <th
                className="w-[20%] p-2 text-right font-bold cursor-pointer"
                onClick={() => handleSortClick("protein")}
              >
                <div className="flex items-center justify-end">
                  <span>Protein</span>
                  <span className="ml-1">{getSortIcon("protein")}</span>
                </div>
              </th>
              <th
                className="w-[20%] p-2 text-right font-bold cursor-pointer"
                onClick={() => handleSortClick("calories")}
              >
                <div className="flex items-center justify-end">
                  <span>Calories</span>
                  <span className="ml-1">{getSortIcon("calories")}</span>
                </div>
              </th>
              <th className="w-[20%] p-2 text-left font-bold">Unit</th>
              <th className="w-[10%] p-2"></th>
            </tr>
          </thead>
          <tbody className="block max-h-[65vh] overflow-y-auto">
            {displayedFoods.length > 0 ? (
              displayedFoods.map(([foodName, foodDetails]) => (
                <tr
                  key={foodName}
                  className="w-full table table-fixed hover:bg-gray-50 cursor-pointer group"
                  onClick={() => handleFoodClick(foodName)}
                >
                  <td className="w-[30%] p-2 truncate">{foodName}</td>
                  <td className="w-[20%] p-2 text-right truncate">
                    {foodDetails.protein}
                  </td>
                  <td className="w-[20%] p-2 text-right truncate">
                    {foodDetails.calories}
                  </td>
                  <td className="w-[20%] p-2 truncate">{foodDetails.unit}</td>
                  <td className="w-[10%] p-2">
                    <FontAwesomeIcon
                      className="invisible group-hover:visible text-red-500"
                      icon={faTrash}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFoodFromDatabase(foodName);
                      }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr className="w-full table table-fixed">
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  {searchQuery || filterOption !== "all"
                    ? "No food items match your search or filter criteria"
                    : "No food items in database. Add some to get started!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DatabasePage;
