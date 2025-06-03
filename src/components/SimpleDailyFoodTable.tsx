import React, { useContext } from "react";
import { DietContext } from "../DietContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export type FoodEntry = {
  id: number;
  name: string;
  protein: number;
  carbs?: number;
  fat?: number;
  calories: number;
  serving_size?: number;
  unit?: string;
};

interface SimpleDailyFoodTableProps {
  entries: FoodEntry[];
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
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
};

const SimpleDailyFoodTable: React.FC<SimpleDailyFoodTableProps> = ({
  entries,
}) => {
  const dietContext = useContext(DietContext);

  const isMobile = window.innerWidth < 768;

  const handleAddFood = async (entry: FoodEntry) => {
    if (!dietContext) return;
    const { database, addFoodEntryToDailyDiet } = dietContext;
    const dbFood = database[entry.name];
    if (!dbFood) {
      alert(`Food '${entry.name}' not found in database. Cannot add.`);
      return;
    }
    try {
      await addFoodEntryToDailyDiet(
        {
          ...dbFood,
          name: entry.name,
          protein: dbFood.protein,
          carbs: dbFood.carbs,
          fat: dbFood.fat,
          calories: dbFood.calories,
          serving_size: dbFood.serving_size,
          unit: dbFood.unit,
        },
        getTodayDate()
      );
    } catch (error) {
      // Optionally handle error (e.g., show toast)
      // eslint-disable-next-line no-console
      console.error("Failed to add food entry:", error);
    }
  };
  
  const handleAddModifiedFood = async (entry: FoodEntry, multiplier: number) => {
    if (!dietContext) return;
    const { database, addFoodToDatabase, addFoodEntryToDailyDiet } = dietContext;
    
    const originalServingSize = entry.serving_size || 1;
    const newServingSize = originalServingSize * multiplier;
    const newName = `${entry.name} (${multiplier}x)`;
    
    // Check if a food with this modified serving size already exists
    const existingFood = database[newName];
    
    try {
      let foodToAdd;
      
      if (existingFood) {
        // Use existing food entry
        foodToAdd = {
          ...existingFood,
          name: newName
        };
        
        console.log(`Using existing food ${newName} with serving size ${existingFood.serving_size}`);
      } else {
        // Create new food with modified serving size
        // Round all nutritional values to integers to avoid database type errors
        const protein = Math.round((entry.protein * multiplier) * 10) / 10; // Keep one decimal place
        const carbs = Math.round(((entry.carbs || 0) * multiplier) * 10) / 10;
        const fat = Math.round(((entry.fat || 0) * multiplier) * 10) / 10;
        const calories = Math.round(entry.calories * multiplier); // Round calories to integer
        
        console.log(`Creating new food ${newName} with serving size ${newServingSize}`);
        
        // Create the new food object
        const newFood = {
          name: newName,
          protein,
          carbs,
          fat,
          calories,
          serving_size: newServingSize,
          unit: entry.unit || "serving"
        };
        
        console.log("Food to add to database:", newFood);
        
        // Add to database and wait for it to complete
        await addFoodToDatabase(newFood);
        
        // Wait a moment for the database to be updated
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
          // Directly fetch the newly created food to get its ID
          const { foodsTable } = await import('../lib/supabase');
          const newlyCreatedFood = await foodsTable.getByName(newName);
          
          if (newlyCreatedFood) {
            foodToAdd = {
              id: newlyCreatedFood.id || 0,
              name: newlyCreatedFood.name,
              protein: newlyCreatedFood.protein,
              carbs: newlyCreatedFood.carbs || 0,
              fat: newlyCreatedFood.fat || 0,
              calories: newlyCreatedFood.calories,
              serving_size: newlyCreatedFood.serving_size || newServingSize,
              unit: newlyCreatedFood.unit
            };
            console.log(`Retrieved newly created food with ID: ${foodToAdd.id}`);
          } else {
            throw new Error(`Unable to find newly created food: ${newName}`);
          }
        } catch (fetchError) {
          console.error("Error fetching newly created food:", fetchError);
          throw new Error(`Failed to retrieve newly created food: ${newName}`);
        }
      }
      
      if (!foodToAdd || !foodToAdd.id) {
        throw new Error(`Cannot add food to daily diet: Invalid food ID`);
      }
      
      // Add to daily diet
      await addFoodEntryToDailyDiet(
        foodToAdd,
        getTodayDate()
      );
      
      console.log(`Added ${newName} to daily diet`);
    } catch (error) {
      console.error(`Failed to add modified food (${multiplier}x):`, error);
      alert(`Error: Failed to add modified food. ${error instanceof Error ? error.message : ''}`);
    }
  };

  const handleRowKeyDown = (
    e: React.KeyboardEvent<HTMLTableRowElement>,
    entry: FoodEntry
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAddFood(entry);
    }
  };

  const handleDeleteFood = async (reversedIdx: number) => {
    if (!dietContext) return;
    const index = entries.length - 1 - reversedIdx;
    if (index < 0 || !dietContext.removeFoodEntry) return;
    try {
      await dietContext.removeFoodEntry(index);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete food entry:", error);
    }
  };

  const dailyTotals = entries.reduce(
    (acc, entry) => ({
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fat: acc.fat + (entry.fat || 0),
      calories: acc.calories + (entry.calories || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <div className="overflow-x-auto w-full">
      <table
        className="min-w-full bg-white rounded-lg shadow"
        aria-label="Daily Food Log Table"
      >
        <thead>
          <tr className="bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wider">
            <th
              className="px-1 sm:px-4 py-3 text-left"
              tabIndex={0}
              aria-label="Food"
            >
              Food
            </th>
            <th
              className="px-1 sm:px-4 py-3 text-center"
              tabIndex={0}
              aria-label="Serving Size"
            >
              Serving {isMobile ? "" : "Size"}
            </th>
            <th
              className="px-1 sm:px-4 py-3 text-center"
              tabIndex={0}
              aria-label="Calories"
            >
              {isMobile ? "Cal" : "Calories"}
            </th>
            <th
              className="px-1 sm:px-4 py-3 text-center"
              tabIndex={0}
              aria-label="Protein (g)"
            >
              Protein
            </th>
            <th
              className="px-1 sm:px-4 py-3 text-center"
              tabIndex={0}
              aria-label="Carbs (g)"
            >
              Carbs
            </th>
            <th
              className="px-1 sm:px-4 py-3 text-center"
              tabIndex={0}
              aria-label="Fat (g)"
            >
              Fat
            </th>
            <th
              className="px-1 sm:px-4 py-3 text-center"
              aria-label="Actions"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                No food entries for this day.
              </td>
            </tr>
          ) : (
            entries
              .slice()
              .reverse()
              .map((entry, idx) => (
                <tr
                  key={entry.id}
                  className="group hover:bg-blue-50 cursor-pointer text-xs sm:text-sm focus:bg-blue-100 outline-none transition-colors"
                  tabIndex={0}
                  aria-label={`Add ${entry.name} to today`}
                  onClick={() => handleAddFood(entry)}
                  onKeyDown={(e) => handleRowKeyDown(e, entry)}
                  role="button"
                >
                  <td className="px-1 sm:px-4 py-2 font-medium">
                    {entry.name}
                  </td>
                  <td className="px-1 sm:px-4 py-2 text-center">
                    {entry.serving_size || "-"}
                    {entry.unit || ""}
                  </td>
                  <td className="px-1 sm:px-4 py-2 text-center">
                    {entry.calories}
                  </td>
                  <td className="px-1 sm:px-4 py-2 text-center">
                    {entry.protein}g
                  </td>
                  <td className="px-1 sm:px-4 py-2 text-center">
                    {entry.carbs || 0}g
                  </td>
                  <td className="px-1 sm:px-4 py-2 text-center">
                    {entry.fat || 0}g
                  </td>
                  <td className="px-1 sm:px-4 py-2 text-center">
                    <div className="invisible group-hover:visible group-focus-within:visible flex items-center justify-center gap-1">
                      {/* Size modifier buttons */}
                      <button
                        className="text-xs bg-green-100 hover:bg-green-200 px-1.5 py-0.5 rounded text-green-800 focus:outline-none focus:ring-1 focus:ring-green-500"
                        tabIndex={0}
                        aria-label={`Add ${entry.name} with 0.5x serving size`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddModifiedFood(entry, 0.5);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddModifiedFood(entry, 0.5);
                          }
                        }}
                      >
                        0.5x
                      </button>
                      <button
                        className="text-xs bg-blue-100 hover:bg-blue-200 px-1.5 py-0.5 rounded text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        tabIndex={0}
                        aria-label={`Add ${entry.name} with 1.5x serving size`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddModifiedFood(entry, 1.5);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddModifiedFood(entry, 1.5);
                          }
                        }}
                      >
                        1.5x
                      </button>
                      <button
                        className="text-xs bg-purple-100 hover:bg-purple-200 px-1.5 py-0.5 rounded text-purple-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        tabIndex={0}
                        aria-label={`Add ${entry.name} with 2x serving size`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddModifiedFood(entry, 2);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddModifiedFood(entry, 2);
                          }
                        }}
                      >
                        2x
                      </button>
                      <span
                        className="text-red-500 cursor-pointer ml-1"
                        tabIndex={0}
                        aria-label={`Delete ${entry.name} from today`}
                        role="button"
                        onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                          e.stopPropagation();
                          handleDeleteFood(idx);
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteFood(idx);
                          }
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </span>
                    </div>
                  </td>
                </tr>
              ))
          )}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 font-semibold text-xs sm:text-sm">
            <td className="px-1 sm:px-4 py-2">{isMobile ? "Totals" : "Daily Total"}</td>
            <td className="px-1 sm:px-4 py-2 text-center"></td>
            <td className="px-1 sm:px-4 py-2 text-center">
              {dailyTotals.protein.toFixed(1)}g
            </td>
            <td className="px-1 sm:px-4 py-2 text-center">
              {dailyTotals.carbs.toFixed(1)}g
            </td>
            <td className="px-1 sm:px-4 py-2 text-center">
              {dailyTotals.fat.toFixed(1)}g
            </td>
            <td className="px-1 sm:px-4 py-2 text-center">
              {dailyTotals.calories.toFixed(0)}
            </td>
            <td className="px-1 sm:px-4 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default SimpleDailyFoodTable;
